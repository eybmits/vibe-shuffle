import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const MAX_TRACKS = 100;
const MIN_INSTRUMENTALNESS = 0.5;
const MAX_SPEECHINESS = 0.33;

const CATEGORY_STYLES = {
  happy: {
    accent: "#22c55e",
    palette: ["#f0fdf4", "#86efac", "#15803d"],
  },
  relaxed: {
    accent: "#14b8a6",
    palette: ["#ecfeff", "#99f6e4", "#0f766e"],
  },
  tense: {
    accent: "#f97316",
    palette: ["#fff7ed", "#fdba74", "#c2410c"],
  },
  sad_low: {
    accent: "#818cf8",
    palette: ["#eef2ff", "#c7d2fe", "#4f46e5"],
  },
};

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function parsePlaylistId(input) {
  if (!input) throw new Error("Missing SPOTIFY_PLAYLIST_URL.");

  if (input.startsWith("spotify:playlist:")) {
    return input.split(":").at(-1);
  }

  const directId = input.match(/^[A-Za-z0-9]{20,}$/)?.[0];
  if (directId) return directId;

  const match = input.match(/playlist\/([A-Za-z0-9]+)/);
  if (match?.[1]) return match[1];

  throw new Error("SPOTIFY_PLAYLIST_URL must be a playlist URL, Spotify URI, or playlist ID.");
}

async function getAccessToken(clientId, clientSecret) {
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function spotifyFetch(pathname, token) {
  const response = await fetch(`${SPOTIFY_API_URL}${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? 2);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return spotifyFetch(pathname, token);
  }

  if (response.status === 403 && pathname.startsWith("/audio-features")) {
    throw new Error(
      "Spotify returned 403 for Audio Features. Your Spotify app likely lacks access to deprecated Audio Features/Audio Analysis endpoints.",
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API request failed ${pathname} (${response.status}): ${text}`);
  }

  return response.json();
}

async function fetchPlaylistTracks(playlistId, token) {
  const tracks = [];
  let offset = 0;
  const fields = [
    "items(track(id,uri,name,artists(name),album(name,images(url,width,height)),duration_ms,explicit,is_playable,external_urls.spotify,preview_url,popularity))",
    "next",
    "total",
  ].join(",");

  while (true) {
    const payload = await spotifyFetch(
      `/playlists/${playlistId}/tracks?limit=100&offset=${offset}&fields=${encodeURIComponent(fields)}`,
      token,
    );

    for (const item of payload.items ?? []) {
      if (item.track?.id) tracks.push(item.track);
    }

    if (!payload.next) break;
    offset += 100;
  }

  return tracks;
}

async function fetchAudioFeatures(trackIds, token) {
  const features = new Map();

  for (let index = 0; index < trackIds.length; index += 100) {
    const batch = trackIds.slice(index, index + 100);
    const payload = await spotifyFetch(`/audio-features?ids=${batch.join(",")}`, token);

    for (const item of payload.audio_features ?? []) {
      if (item?.id) features.set(item.id, item);
    }
  }

  return features;
}

function quadrantFromAxes(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5) return "happy";
  if (valence >= 0.5 && energy < 0.5) return "relaxed";
  if (valence < 0.5 && energy >= 0.5) return "tense";
  return "sad_low";
}

function bestImage(images = []) {
  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
}

function normalizeTrack(track, features) {
  const quadrant = quadrantFromAxes(features.valence, features.energy);
  const style = CATEGORY_STYLES[quadrant];

  return {
    id: track.id,
    spotifyId: track.id,
    spotifyUri: track.uri,
    title: track.name,
    artist: track.artists?.map((artist) => artist.name).join(", ") ?? "Unknown artist",
    album: track.album?.name ?? "",
    albumImageUrl: bestImage(track.album?.images),
    externalUrl: track.external_urls?.spotify ?? null,
    durationMs: track.duration_ms,
    explicit: Boolean(track.explicit),
    popularity: track.popularity ?? null,
    previewUrl: track.preview_url ?? null,
    audioUrl: track.preview_url ?? null,
    valence: Number(features.valence.toFixed(4)),
    energy: Number(features.energy.toFixed(4)),
    instrumentalness: Number(features.instrumentalness.toFixed(4)),
    speechiness: Number(features.speechiness.toFixed(4)),
    danceability: Number(features.danceability.toFixed(4)),
    tempo: Number(features.tempo.toFixed(3)),
    quadrant,
    accent: style.accent,
    palette: style.palette,
  };
}

function toCsv(rows) {
  const columns = [
    "id",
    "spotifyId",
    "spotifyUri",
    "title",
    "artist",
    "album",
    "quadrant",
    "valence",
    "energy",
    "instrumentalness",
    "speechiness",
    "danceability",
    "tempo",
    "durationMs",
    "audioUrl",
    "externalUrl",
  ];

  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replaceAll('"', '""')}"`;
  };

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
}

function distribution(rows) {
  return rows.reduce(
    (counts, row) => ({
      ...counts,
      [row.quadrant]: (counts[row.quadrant] ?? 0) + 1,
    }),
    { happy: 0, relaxed: 0, tense: 0, sad_low: 0 },
  );
}

async function main() {
  const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requiredEnv("SPOTIFY_CLIENT_SECRET");
  const playlistUrl = requiredEnv("SPOTIFY_PLAYLIST_URL");
  const playlistId = parsePlaylistId(playlistUrl);
  const token = await getAccessToken(clientId, clientSecret);
  const playlistTracks = await fetchPlaylistTracks(playlistId, token);
  const uniqueTracks = [...new Map(playlistTracks.map((track) => [track.id, track])).values()];
  const features = await fetchAudioFeatures(uniqueTracks.map((track) => track.id), token);

  const eligible = uniqueTracks
    .map((track) => {
      const feature = features.get(track.id);
      return feature ? normalizeTrack(track, feature) : null;
    })
    .filter(Boolean)
    .filter((track) => track.albumImageUrl)
    .filter((track) => track.instrumentalness >= MIN_INSTRUMENTALNESS)
    .filter((track) => track.speechiness <= MAX_SPEECHINESS)
    .filter((track) => track.spotifyUri)
    .slice(0, MAX_TRACKS);

  const payload = {
    generatedAt: new Date().toISOString(),
    sourcePlaylist: playlistUrl,
    sourcePlaylistId: playlistId,
    source: "spotify",
    filters: {
      maxTracks: MAX_TRACKS,
      minInstrumentalness: MIN_INSTRUMENTALNESS,
      maxSpeechiness: MAX_SPEECHINESS,
    },
    distribution: distribution(eligible),
    tracks: eligible,
  };

  await mkdir(path.resolve("src/data"), { recursive: true });
  await mkdir(path.resolve("data"), { recursive: true });
  await writeFile(
    path.resolve("src/data/spotifyCatalog.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  await writeFile(path.resolve("data/spotify_catalog.csv"), `${toCsv(eligible)}\n`);

  console.log(`Fetched ${uniqueTracks.length} unique playlist tracks.`);
  console.log(`Saved ${eligible.length} eligible instrumental tracks.`);
  console.table(distribution(eligible));

  if (eligible.length < MAX_TRACKS) {
    console.warn(
      `Only ${eligible.length}/${MAX_TRACKS} tracks matched the instrumental filters. The app will use all eligible tracks without forcing quadrant balance.`,
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
