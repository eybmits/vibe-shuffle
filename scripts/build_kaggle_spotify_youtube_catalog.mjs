#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const DATASET_URL =
  "https://huggingface.co/datasets/maharshipandya/spotify-tracks-dataset/resolve/main/dataset.csv?download=true";
const RAW_DATASET_PATH = "data/spotify_tracks_dataset.csv";
const YOUTUBE_CACHE_PATH = "data/youtube_lookup_cache.json";
const OUTPUT_JSON_PATH = "src/data/musicCatalog.json";
const OUTPUT_CSV_PATH = "data/kaggle_spotify_youtube_catalog.csv";

const COMPACT_GENRES = [
  "ambient",
  "piano",
  "classical",
  "electronic",
  "chill",
  "study",
  "sleep",
  "new-age",
  "guitar",
  "techno",
  "deep-house",
  "progressive-house",
  "trip-hop",
  "jazz",
  "minimal-techno",
  "idm",
  "trance",
  "breakbeat",
  "drum-and-bass",
  "club",
];
const GENRE_LABELS = {
  ambient: "Ambient",
  piano: "Piano",
  classical: "Classical",
  electronic: "Electronic",
  chill: "Chill",
  study: "Study",
  sleep: "Sleep",
  "new-age": "New Age",
  guitar: "Guitar",
  techno: "Techno",
  "deep-house": "Deep House",
  "progressive-house": "Progressive House",
  "trip-hop": "Trip Hop",
  jazz: "Jazz",
  "minimal-techno": "Minimal Techno",
  idm: "IDM",
  trance: "Trance",
  breakbeat: "Breakbeat",
  "drum-and-bass": "Drum and Bass",
  club: "Club",
};
const CATALOG_SCOPE = process.env.KAGGLE_CATALOG_SCOPE ?? "full";
const TRACKS_PER_GENRE = Number(process.env.KAGGLE_TRACKS_PER_GENRE ?? 5);
const MAX_TRACKS = Number(process.env.KAGGLE_MAX_TRACKS ?? 0);
const MIN_INSTRUMENTALNESS = Number(process.env.MIN_INSTRUMENTALNESS ?? 0.85);
const MAX_SPEECHINESS = Number(process.env.MAX_SPEECHINESS ?? 0.12);
const YOUTUBE_LOOKUP =
  process.env.YOUTUBE_LOOKUP === undefined
    ? CATALOG_SCOPE === "compact"
    : process.env.YOUTUBE_LOOKUP !== "0";
const YOUTUBE_DELAY_MS = Number(process.env.YOUTUBE_DELAY_MS ?? 180);
const YT_DLP_PYTHONPATH = process.env.YT_DLP_PYTHONPATH ?? "";
const execFileAsync = promisify(execFile);

const QUADRANTS = {
  happy: {
    accent: "#22c55e",
    palette: ["#f0fdf4", "#86efac", "#15803d"],
  },
  relaxed: {
    accent: "#14b8a6",
    palette: ["#ecfeff", "#5eead4", "#0f766e"],
  },
  tense: {
    accent: "#f97316",
    palette: ["#fff7ed", "#fdba74", "#9a3412"],
  },
  sad_low: {
    accent: "#818cf8",
    palette: ["#eef2ff", "#a5b4fc", "#3730a3"],
  },
};

const EXCLUDED_TEXT_SNIPPETS = [
  "brown sleep noise",
  "clean white noise",
  "faithless god is a dj",
  "jan blomqvist;elena pitoulis more",
  "kid francescoli;julia minkin moon",
  "novo amor anchor",
  "shiloh dynasty",
  "the prodigy breathe",
  "the prodigy invaders must die",
  "the prodigy you'll be under my wheels",
  "unknown mortal orchestra so good at being in trouble",
  "white noise",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (inQuotes) {
      if (character === '"' && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((items) => items.length === headers.length)
    .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index]])));
}

async function ensureDataset() {
  try {
    await readFile(RAW_DATASET_PATH, "utf8");
    return;
  } catch {
    // Download below.
  }

  console.log(`Downloading Spotify tracks dataset to ${RAW_DATASET_PATH}`);
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Dataset download failed with HTTP ${response.status}`);
  }
  await mkdir(path.dirname(RAW_DATASET_PATH), { recursive: true });
  await writeFile(RAW_DATASET_PATH, await response.text());
}

function numberField(row, key, fallback = 0) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}

function quadrantFromAxes(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5) return "happy";
  if (valence >= 0.5 && energy < 0.5) return "relaxed";
  if (valence < 0.5 && energy >= 0.5) return "tense";
  return "sad_low";
}

function normalizedKey(row) {
  return `${row.artists}::${row.track_name}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isExcludedCandidate(row) {
  const text = `${row.artists} ${row.track_name}`.toLowerCase();
  return EXCLUDED_TEXT_SNIPPETS.some((snippet) => text.includes(snippet));
}

function labelForGenre(genre) {
  if (GENRE_LABELS[genre]) return GENRE_LABELS[genre];
  return genre
    .split("-")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function youtubeQuery(track) {
  return `${track.artist} ${track.title} official audio`;
}

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function youtubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function youtubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
}

function extractFirstVideoId(html) {
  const matches = [...html.matchAll(/"videoId":"([^"]{11})"/g)].map((match) => match[1]);
  return matches.find((id, index) => matches.indexOf(id) === index) ?? null;
}

async function readYoutubeCache() {
  try {
    return JSON.parse(await readFile(YOUTUBE_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function writeYoutubeCache(cache) {
  await mkdir(path.dirname(YOUTUBE_CACHE_PATH), { recursive: true });
  await writeFile(YOUTUBE_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

async function lookupYoutube(track, cache) {
  const query = youtubeQuery(track);
  if (cache[query]?.videoId || (!YT_DLP_PYTHONPATH && cache[query])) return cache[query];
  if (!YOUTUBE_LOOKUP) {
    cache[query] = {
      query,
      searchUrl: youtubeSearchUrl(query),
      videoId: null,
      watchUrl: null,
      embedUrl: null,
    };
    return cache[query];
  }

  let videoId = null;
  if (YT_DLP_PYTHONPATH) {
    try {
      const { stdout } = await execFileAsync(
        "python3",
        ["-m", "yt_dlp", "--get-id", `ytsearch1:${query}`],
        {
          env: {
            ...process.env,
            PYTHONPATH: YT_DLP_PYTHONPATH,
          },
          maxBuffer: 1024 * 1024,
          timeout: 30_000,
        },
      );
      videoId = stdout.trim().split(/\s+/).find((item) => /^[a-zA-Z0-9_-]{11}$/.test(item)) ?? null;
    } catch (error) {
      console.warn(`yt-dlp lookup failed for "${query}": ${error.message}`);
    }
  }

  try {
    if (!videoId) {
      const response = await fetch(youtubeSearchUrl(query), {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          Cookie: "CONSENT=YES+",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        },
      });
      if (response.ok) {
        videoId = extractFirstVideoId(await response.text());
      } else {
        console.warn(`YouTube lookup HTTP ${response.status} for "${query}"`);
      }
    }
  } catch (error) {
    console.warn(`YouTube lookup failed for "${query}": ${error.message}`);
  }

  cache[query] = {
    embedUrl: videoId ? youtubeEmbedUrl(videoId) : null,
    query,
    searchUrl: youtubeSearchUrl(query),
    videoId,
    watchUrl: videoId ? youtubeWatchUrl(videoId) : null,
  };
  await sleep(YOUTUBE_DELAY_MS);
  return cache[query];
}

function isEligibleRow(row) {
  const durationMs = numberField(row, "duration_ms");
  return (
    row.explicit === "False" &&
    row.track_id &&
    row.track_name &&
    row.artists &&
    !isExcludedCandidate(row) &&
    durationMs >= 90_000 &&
    durationMs <= 420_000 &&
    numberField(row, "instrumentalness") >= MIN_INSTRUMENTALNESS &&
    numberField(row, "speechiness") <= MAX_SPEECHINESS
  );
}

function createTrack(row) {
  const valence = numberField(row, "valence", 0.5);
  const energy = numberField(row, "energy", 0.5);
  const quadrant = quadrantFromAxes(valence, energy);
  const style = QUADRANTS[quadrant];
  return {
    album: row.album_name,
    albumImageUrl: null,
    analysisConfidence: 0.93,
    artist: row.artists.replaceAll(";", ", "),
    categorySource: "kaggle_spotify_audio_features",
    danceability: numberField(row, "danceability"),
    durationMs: numberField(row, "duration_ms"),
    energy,
    explicit: row.explicit === "True",
    externalUrl: `https://open.spotify.com/track/${row.track_id}`,
    id: `spotify-${row.track_id}`,
    instrumentalness: numberField(row, "instrumentalness"),
    licenseUrl: "https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset",
    popularity: numberField(row, "popularity"),
    quadrant,
    source: CATALOG_SCOPE === "full" ? "spotify_dataset_full" : "kaggle_spotify_youtube",
    speechiness: numberField(row, "speechiness"),
    spotifyId: row.track_id,
    spotifyUri: `spotify:track:${row.track_id}`,
    tempo: numberField(row, "tempo"),
    title: row.track_name,
    trackGenre: row.track_genre,
    trackGenreLabel: labelForGenre(row.track_genre),
    valence,
    youtubeQuery: null,
    youtubeSearchUrl: null,
    youtubeUrl: null,
    youtubeVideoId: null,
    youtubeEmbedUrl: null,
    accent: style.accent,
    palette: style.palette,
  };
}

function addTrackFromRow(row, selected, usedTrackIds, usedArtistTitles) {
  const key = normalizedKey(row);
  if (usedTrackIds.has(row.track_id) || usedArtistTitles.has(key)) return false;
  selected.push(createTrack(row));
  usedTrackIds.add(row.track_id);
  usedArtistTitles.add(key);
  return true;
}

function pickCompactTracks(rows) {
  const usedTrackIds = new Set();
  const usedArtistTitles = new Set();
  const selected = [];

  COMPACT_GENRES.forEach((genre) => {
    const candidates = rows
      .filter((row) => row.track_genre === genre && isEligibleRow(row))
      .sort((a, b) => numberField(b, "popularity") - numberField(a, "popularity"));

    let pickedForGenre = 0;
    for (const row of candidates) {
      if (addTrackFromRow(row, selected, usedTrackIds, usedArtistTitles)) pickedForGenre += 1;
      if (pickedForGenre >= TRACKS_PER_GENRE) break;
    }
  });

  return selected;
}

function pickFullTracks(rows) {
  const usedTrackIds = new Set();
  const usedArtistTitles = new Set();
  const selected = [];
  const candidates = rows
    .filter(isEligibleRow)
    .sort(
      (a, b) =>
        numberField(b, "popularity") - numberField(a, "popularity") ||
        a.track_genre.localeCompare(b.track_genre) ||
        a.track_name.localeCompare(b.track_name),
    );

  for (const row of candidates) {
    addTrackFromRow(row, selected, usedTrackIds, usedArtistTitles);
    if (MAX_TRACKS > 0 && selected.length >= MAX_TRACKS) break;
  }

  return selected;
}

function pickTracks(rows) {
  if (CATALOG_SCOPE === "compact") return pickCompactTracks(rows);
  if (CATALOG_SCOPE !== "full") {
    throw new Error(`Unsupported KAGGLE_CATALOG_SCOPE="${CATALOG_SCOPE}". Use "full" or "compact".`);
  }
  return pickFullTracks(rows);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function catalogCsv(tracks) {
  const columns = [
    "id",
    "trackGenre",
    "trackGenreLabel",
    "title",
    "artist",
    "popularity",
    "valence",
    "energy",
    "quadrant",
    "spotifyId",
    "youtubeVideoId",
    "youtubeUrl",
    "youtubeSearchUrl",
  ];
  return [
    columns.join(","),
    ...tracks.map((track) => columns.map((column) => csvEscape(track[column])).join(",")),
  ].join("\n");
}

async function main() {
  await ensureDataset();
  const rows = parseCsv(await readFile(RAW_DATASET_PATH, "utf8"));
  const tracks = pickTracks(rows);
  const cache = await readYoutubeCache();

  if (YOUTUBE_LOOKUP) {
    for (const [index, track] of tracks.entries()) {
      const lookup = await lookupYoutube(track, cache);
      track.youtubeQuery = lookup.query;
      track.youtubeSearchUrl = lookup.searchUrl;
      track.youtubeUrl = lookup.watchUrl;
      track.youtubeVideoId = lookup.videoId;
      track.youtubeEmbedUrl = lookup.embedUrl;
      if ((index + 1) % 10 === 0) {
        console.log(`YouTube lookup ${index + 1}/${tracks.length}`);
        await writeYoutubeCache(cache);
      }
    }
    await writeYoutubeCache(cache);
  } else {
    tracks.forEach((track) => {
      const query = youtubeQuery(track);
      track.youtubeQuery = query;
      track.youtubeSearchUrl = youtubeSearchUrl(query);
    });
  }

  const genres = [...new Set(tracks.map((track) => track.trackGenre))].sort((a, b) =>
    labelForGenre(a).localeCompare(labelForGenre(b)),
  );
  const genreOptions = genres.map((genre) => ({
    count: tracks.filter((track) => track.trackGenre === genre).length,
    genre,
    label: labelForGenre(genre),
  })).filter((option) => option.count > 0);

  await writeFile(
    OUTPUT_JSON_PATH,
    `${JSON.stringify(
      {
        dataset: {
          filter: {
            catalogScope: CATALOG_SCOPE,
            maxTracks: MAX_TRACKS || null,
            maxSpeechiness: MAX_SPEECHINESS,
            minInstrumentalness: MIN_INSTRUMENTALNESS,
          },
          license: "bsd",
          source:
            "https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset",
          mirror:
            "https://huggingface.co/datasets/maharshipandya/spotify-tracks-dataset",
        },
        generatedAt: new Date().toISOString(),
        genreOptions,
        source: CATALOG_SCOPE === "full" ? "spotify_dataset_full" : "kaggle_spotify_youtube",
        tracks,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(OUTPUT_CSV_PATH, `${catalogCsv(tracks)}\n`);

  const distribution = tracks.reduce((counts, track) => {
    counts[track.quadrant] = (counts[track.quadrant] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`Wrote ${tracks.length} tracks to ${OUTPUT_JSON_PATH}`);
  console.log("Quadrants:", distribution);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
