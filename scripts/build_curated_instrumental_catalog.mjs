import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const COMMONS_API_URL = "https://commons.wikimedia.org/w/api.php";
const ARCHIVE_METADATA_URL = "https://archive.org/metadata";
const MAX_TRACKS = Number(process.env.CURATED_MAX_TRACKS ?? 100);
const COMMONS_BATCH_SIZE = 45;
const USER_AGENT = "VibeShuffleResearch/0.1 (https://github.com/eybmits/vibe_shuffle)";

const CATEGORY_STYLES = {
  happy: {
    accent: "#22c55e",
    palette: ["#f0fdf4", "#86efac", "#15803d"],
    valence: 0.82,
    energy: 0.76,
  },
  relaxed: {
    accent: "#14b8a6",
    palette: ["#ecfeff", "#99f6e4", "#0f766e"],
    valence: 0.72,
    energy: 0.3,
  },
  tense: {
    accent: "#f97316",
    palette: ["#fff7ed", "#fdba74", "#c2410c"],
    valence: 0.28,
    energy: 0.74,
  },
  sad_low: {
    accent: "#818cf8",
    palette: ["#eef2ff", "#c7d2fe", "#4f46e5"],
    valence: 0.28,
    energy: 0.3,
  },
};

const COMMONS_CATEGORIES = [
  "Soundtrack music from Incompetech",
  "Contemporary music from Incompetech",
  "Classical music from Incompetech",
  "Jazz music from Incompetech",
  "World music from Incompetech",
  "Unclassifiable music from Incompetech",
  "Cinematic (genre) music from Incompetech",
  "Cinematic (topic) music from Incompetech",
  "Holiday music from Incompetech",
];

const PINNED_TITLE_TERMS = [
  "carefree",
  "sneaky snitch",
  "cipher",
  "investigations",
  "local forecast",
  "lobby time",
  "aurea carmina",
  "amazing plan",
  "adventure meme",
  "arcadia",
  "the complex",
  "movement proposition",
  "action",
  "heroic age",
  "hitman",
  "darkest child",
  "evening melodrama",
  "lightless dawn",
  "slow burn",
  "impact",
  "rising tide",
  "magic scout",
  "dream culture",
  "pamgaea",
  "inspired",
  "airport lounge",
  "jazz brunch",
  "electro cabello",
  "severe tire damage",
  "stay the course",
  "the snow queen",
  "thinking music",
  "wallpaper",
  "whiskey on the mississippi",
];

const POSITIVE_TERMS = [
  "happy",
  "carefree",
  "fun",
  "bright",
  "bouncy",
  "comedy",
  "uplifting",
  "inspired",
  "jazz",
  "lounge",
  "latin",
  "dance",
  "adventure",
  "celebration",
  "comic",
  "groove",
  "sunny",
  "playful",
];

const NEGATIVE_TERMS = [
  "sad",
  "melancholy",
  "melancholic",
  "dark",
  "horror",
  "suspense",
  "tension",
  "unease",
  "doom",
  "despair",
  "lonely",
  "lost",
  "ghost",
  "devastation",
  "revenge",
  "hitman",
  "night",
  "serious",
];

const HIGH_ENERGY_TERMS = [
  "action",
  "driving",
  "high energy",
  "fast",
  "epic",
  "dramatic",
  "industrial",
  "electronic",
  "rock",
  "intense",
  "battle",
  "chase",
  "adventure",
  "techno",
  "dance",
];

const LOW_ENERGY_TERMS = [
  "ambient",
  "slow",
  "calm",
  "piano",
  "lounge",
  "soft",
  "quiet",
  "dream",
  "sentimental",
  "meditative",
  "relax",
  "warm",
  "minimal",
];

const BAD_TERMS = [
  "voice",
  "voices",
  "vocal",
  "song with",
  "choral",
  "choir",
  "lyrics",
  "christmas carol",
  "spoken",
  "speech",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : String(value).split(/[|;,]/);
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return stripHtml(value).toLowerCase();
}

function textBlob(...values) {
  return values.flatMap(asArray).map(cleanText).join(" ");
}

function countAny(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function titleFromCommons(fileTitle, objectName) {
  const raw = stripHtml(objectName) || fileTitle;
  return raw
    .replace(/^File:/, "")
    .replace(/\.(mp3|ogg|oga)$/i, "")
    .replace(/\s*\(ISRC [^)]+\)\s*/gi, "")
    .replace(/\s*\(cc-by\)\s*/gi, " ")
    .replace(/\s*\(filmmusic\)\s*/gi, " ")
    .replace(/\s*\(incompetech\)\s*/gi, " ")
    .replace(/^Kevin MacLeod\s*[~-]\s*/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalTitle(value) {
  return cleanText(value)
    .replace(/\bby kevin macleod\b/g, "")
    .replace(/\bcc-by\b/g, "")
    .replace(/\bfilmmusic\b/g, "")
    .replace(/\bincompetech\b/g, "")
    .replace(/\bisrc usu[a-z0-9]+\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleFromArchiveFile(file) {
  return String(file.title || file.name.replace(/\.[^.]+$/, ""))
    .replace(/\s*\(ISRC [^)]+\)\s*/gi, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quadrantFromAxes(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5) return "happy";
  if (valence >= 0.5 && energy < 0.5) return "relaxed";
  if (valence < 0.5 && energy >= 0.5) return "tense";
  return "sad_low";
}

function estimateAxes(text, sourceBias = {}) {
  const positive = countAny(text, POSITIVE_TERMS);
  const negative = countAny(text, NEGATIVE_TERMS);
  const high = countAny(text, HIGH_ENERGY_TERMS);
  const low = countAny(text, LOW_ENERGY_TERMS);
  const valenceBase = sourceBias.valence ?? 0.5;
  const energyBase = sourceBias.energy ?? 0.5;
  const valence = clamp(valenceBase + positive * 0.09 - negative * 0.11, 0.08, 0.92);
  const energy = clamp(energyBase + high * 0.08 - low * 0.1, 0.08, 0.92);
  const quadrant = quadrantFromAxes(valence, energy);

  return {
    confidence: clamp(0.45 + (positive + negative + high + low) * 0.06, 0.35, 0.92),
    energy,
    quadrant,
    valence,
    evidence: { positive, negative, highEnergy: high, lowEnergy: low },
  };
}

function qualityScore(track) {
  const title = track.title.toLowerCase();
  const pinnedScore = PINNED_TITLE_TERMS.reduce(
    (score, term, index) => score + (title.includes(term) ? 100 - index : 0),
    0,
  );
  const durationSeconds = (track.durationMs ?? 0) / 1000;
  const durationScore =
    durationSeconds >= 120 && durationSeconds <= 360
      ? 35
      : durationSeconds >= 75 && durationSeconds <= 480
        ? 18
        : 0;
  const sourceScore = track.source === "curated_archive" ? 45 : 25;
  const confidenceScore = Math.round((track.analysisConfidence ?? 0) * 20);

  return pinnedScore + durationScore + sourceScore + confidenceScore;
}

function pickDiverseCatalog(candidates, maxTracks) {
  const seen = new Set();
  const unique = candidates
    .filter((track) => {
      const key = `${canonicalTitle(track.title)}::${track.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => qualityScore(b) - qualityScore(a));
  const groups = {
    happy: unique.filter((track) => track.quadrant === "happy").sort((a, b) => qualityScore(b) - qualityScore(a)),
    relaxed: unique.filter((track) => track.quadrant === "relaxed").sort((a, b) => qualityScore(b) - qualityScore(a)),
    tense: unique.filter((track) => track.quadrant === "tense").sort((a, b) => qualityScore(b) - qualityScore(a)),
    sad_low: unique.filter((track) => track.quadrant === "sad_low").sort((a, b) => qualityScore(b) - qualityScore(a)),
  };
  const order = ["happy", "relaxed", "tense", "sad_low"];
  const output = [];
  let index = 0;

  while (output.length < maxTracks && order.some((quadrant) => groups[quadrant][index])) {
    for (const quadrant of order) {
      const track = groups[quadrant][index];
      if (track) output.push(track);
      if (output.length >= maxTracks) break;
    }
    index += 1;
  }

  for (const track of unique) {
    if (output.length >= maxTracks) break;
    if (!output.some((item) => item.id === track.id)) output.push(track);
  }

  return output;
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

function toCsv(rows) {
  const columns = [
    "id",
    "title",
    "artist",
    "album",
    "quadrant",
    "valence",
    "energy",
    "durationMs",
    "analysisConfidence",
    "categorySource",
    "audioUrl",
    "downloadUrl",
    "externalUrl",
    "licenseUrl",
    "source",
  ];
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const text = Array.isArray(value) ? value.join("|") : String(value);
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replaceAll('"', '""')}"`;
  };

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
}

async function fetchJson(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": USER_AGENT,
        ...(options.headers ?? {}),
      },
    });
    const text = await response.text();

    if (response.ok && text.trim().startsWith("{")) return JSON.parse(text);
    if (attempt === retries) {
      throw new Error(`Request failed ${response.status}: ${text.slice(0, 180)}`);
    }

    await delay(1000 + attempt * 1500);
  }

  throw new Error("Request failed.");
}

async function fetchCommonsCategory(category) {
  const titles = [];
  let cmcontinue = null;

  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmtype: "file",
      cmlimit: "500",
      format: "json",
      origin: "*",
    });
    if (cmcontinue) params.set("cmcontinue", cmcontinue);

    const payload = await fetchJson(`${COMMONS_API_URL}?${params.toString()}`);
    titles.push(...(payload.query?.categorymembers ?? []).map((item) => item.title));
    cmcontinue = payload.continue?.cmcontinue ?? null;
    await delay(250);
  } while (cmcontinue && titles.length < 700);

  return titles;
}

async function fetchCommonsPageInfo(titles) {
  const pages = [];

  for (let index = 0; index < titles.length; index += COMMONS_BATCH_SIZE) {
    const batch = titles.slice(index, index + COMMONS_BATCH_SIZE);
    const params = new URLSearchParams({
      action: "query",
      titles: batch.join("|"),
      prop: "imageinfo|categories",
      iiprop: "url|extmetadata|mime|size",
      cllimit: "50",
      format: "json",
      origin: "*",
    });
    const payload = await fetchJson(`${COMMONS_API_URL}?${params.toString()}`);
    pages.push(...Object.values(payload.query?.pages ?? {}));
    await delay(350);
  }

  return pages;
}

async function fetchCommonsTracks() {
  const titleSet = new Set();

  for (const category of COMMONS_CATEGORIES) {
    console.log(`Commons category: ${category}`);
    try {
      const titles = await fetchCommonsCategory(category);
      titles.forEach((title) => titleSet.add(title));
      console.log(`  ${titles.length} files`);
    } catch (error) {
      console.warn(`  ${error.message}`);
    }
  }

  const allTitles = [...titleSet].filter((title) => /\.(mp3|ogg|oga)$/i.test(title));
  console.log(`Fetching metadata for ${allTitles.length} Commons audio files...`);
  const pages = await fetchCommonsPageInfo(allTitles);

  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.url) return null;
      const ext = info.extmetadata ?? {};
      const duration = Number(info.duration ?? 0);
      if (duration < 70 || duration > 720) return null;

      const title = titleFromCommons(page.title, ext.ObjectName?.value);
      const description = stripHtml(ext.ImageDescription?.value);
      const categories = stripHtml(ext.Categories?.value);
      const blob = textBlob(title, description, categories);
      if (hasAny(blob, BAD_TERMS)) return null;

      const axes = estimateAxes(blob);
      const style = CATEGORY_STYLES[axes.quadrant];
      const artist = stripHtml(ext.Artist?.value).replace(/^.*Kevin MacLeod.*$/i, "Kevin MacLeod");

      return {
        id: `commons-${page.pageid}`,
        archiveIdentifier: null,
        archiveFile: null,
        jamendoId: null,
        spotifyId: null,
        spotifyUri: null,
        title,
        artist: artist || "Kevin MacLeod",
        album: "Incompetech Instrumental Essentials",
        albumImageUrl: null,
        audioUrl: info.url,
        downloadUrl: info.url,
        externalUrl: info.descriptionurl,
        licenseUrl: ext.LicenseUrl?.value || "https://creativecommons.org/licenses/by/3.0/",
        durationMs: Math.round(duration * 1000),
        valence: Number(axes.valence.toFixed(4)),
        energy: Number(axes.energy.toFixed(4)),
        instrumentalness: 0.98,
        speechiness: 0.01,
        danceability: Number(clamp(axes.energy * 0.62 + axes.valence * 0.2, 0, 1).toFixed(4)),
        tempo: null,
        quadrant: axes.quadrant,
        accent: style.accent,
        palette: style.palette,
        categorySource: "wikimedia_commons_incompetech_curated",
        analysisSource: "commons_description_category_heuristic",
        analysisConfidence: Number(axes.confidence.toFixed(4)),
        sourceSearch: "wikimedia-commons-incompetech",
        source: "wikimedia_commons",
        commons: {
          pageId: page.pageid,
          fileTitle: page.title,
          categories,
          description,
          evidence: axes.evidence,
          licenseShortName: ext.LicenseShortName?.value ?? null,
        },
      };
    })
    .filter(Boolean);
}

function archiveFileUrl(identifier, fileName) {
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${fileName
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function fetchArchiveGhostTracks() {
  const identifier = "nineinchnails_ghosts_I_IV";
  const payload = await fetchJson(`${ARCHIVE_METADATA_URL}/${identifier}`);
  const files = (payload.files ?? [])
    .filter((file) => {
      const name = String(file.name ?? "");
      const duration = Number(file.length ?? 0);
      return name.endsWith("_320kb.mp3") && duration >= 75 && duration <= 480;
    })
    .slice(0, 24);

  return files.map((file, index) => {
    const title = titleFromArchiveFile(file);
    const text = textBlob(title, "instrumental ambient cinematic electronic dark piano ghost");
    const bias = index % 4 === 0 ? CATEGORY_STYLES.relaxed : index % 4 === 1 ? CATEGORY_STYLES.tense : CATEGORY_STYLES.sad_low;
    const axes = estimateAxes(text, bias);
    const style = CATEGORY_STYLES[axes.quadrant];

    return {
      id: `archive-${identifier}-${index + 1}`,
      archiveIdentifier: identifier,
      archiveFile: file.name,
      jamendoId: null,
      spotifyId: null,
      spotifyUri: null,
      title,
      artist: file.artist || "Nine Inch Nails",
      album: "Ghosts I-IV",
      albumImageUrl: `https://archive.org/services/img/${identifier}`,
      audioUrl: archiveFileUrl(identifier, file.name),
      downloadUrl: archiveFileUrl(identifier, file.name),
      externalUrl: `https://archive.org/details/${identifier}`,
      licenseUrl: payload.metadata?.licenseurl ?? "https://creativecommons.org/licenses/by-nc-sa/3.0/us/",
      durationMs: Math.round(Number(file.length) * 1000),
      valence: Number(axes.valence.toFixed(4)),
      energy: Number(axes.energy.toFixed(4)),
      instrumentalness: 0.99,
      speechiness: 0.01,
      danceability: Number(clamp(axes.energy * 0.58 + axes.valence * 0.16, 0, 1).toFixed(4)),
      tempo: null,
      quadrant: axes.quadrant,
      accent: style.accent,
      palette: style.palette,
      categorySource: "curated_archive_mainstream_instrumental",
      analysisSource: "curated_album_context_heuristic",
      analysisConfidence: Number(clamp(axes.confidence + 0.08, 0, 0.96).toFixed(4)),
      sourceSearch: "curated-nine-inch-nails-ghosts",
      source: "curated_archive",
      internetArchive: {
        identifier,
        fileName: file.name,
        format: file.format ?? null,
        licenseUrl: payload.metadata?.licenseurl ?? null,
        evidence: axes.evidence,
      },
    };
  });
}

async function main() {
  const [ghostTracks, commonsTracks] = await Promise.all([
    fetchArchiveGhostTracks(),
    fetchCommonsTracks(),
  ]);
  const tracks = pickDiverseCatalog([...ghostTracks, ...commonsTracks], MAX_TRACKS);

  if (tracks.length < MAX_TRACKS) {
    throw new Error(`Only ${tracks.length}/${MAX_TRACKS} curated tracks were available.`);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "curated_instrumental",
    catalogMode: "curated-mainstream-instrumental",
    note:
      "Curated legal instrumental catalog from Wikimedia Commons/Incompetech and Internet Archive. Audio files are direct public media URLs with license links. Valence and Energy are inferred from title, description, category and curated album context.",
    filters: {
      maxTracks: MAX_TRACKS,
      sources: ["wikimedia_commons_incompetech", "internet_archive_nine_inch_nails_ghosts"],
      licenseUrlRequired: true,
      instrumentalOnly: true,
      selectionStrategy: "quality-ranked tracks interleaved across the four precomputed quadrants",
    },
    distribution: distribution(tracks),
    tracks,
  };

  await mkdir(path.resolve("src/data"), { recursive: true });
  await mkdir(path.resolve("data"), { recursive: true });
  await writeFile(path.resolve("src/data/musicCatalog.json"), `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(path.resolve("data/curated_instrumental_catalog.csv"), `${toCsv(tracks)}\n`);

  console.log(`Fetched ${ghostTracks.length} curated archive tracks.`);
  console.log(`Fetched ${commonsTracks.length} Commons/Incompetech tracks.`);
  console.log(`Saved ${tracks.length}/${MAX_TRACKS} curated instrumental tracks.`);
  console.table(distribution(tracks));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
