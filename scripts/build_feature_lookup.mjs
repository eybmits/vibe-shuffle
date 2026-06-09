import { execFile } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { artistNameKey, trackNameKey } from "../src/trackKey.js";

const SMALL_DATASET_PATH = "data/spotify_tracks_dataset.csv";
const LARGE_DATASET_PATH = "data/spotify_12m_tracks_features.csv";
const LARGE_DATASET_KAGGLE_URL =
  "https://www.kaggle.com/api/v1/datasets/download/rodolfofigueroa/spotify-12m-songs";
const OUTPUT_JSON_PATH = "public/feature-lookup.json";

const execFileAsync = promisify(execFile);

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

// Streaming CSV row reader for files too large to hold as parsed rows in memory.
async function* csvRowsStream(filePath) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  let field = "";
  let row = [];
  let inQuotes = false;
  let lastWasClosingQuote = false;

  for await (const chunk of stream) {
    for (let index = 0; index < chunk.length; index += 1) {
      const character = chunk[index];

      if (lastWasClosingQuote) {
        lastWasClosingQuote = false;
        if (character === '"') {
          field += '"';
          inQuotes = true;
          continue;
        }
      }

      if (inQuotes) {
        if (character === '"') {
          inQuotes = false;
          lastWasClosingQuote = true;
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
        yield row;
        row = [];
        field = "";
      } else if (character !== "\r") {
        field += character;
      }
    }
  }

  if (field || row.length) {
    row.push(field);
    yield row;
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureLargeDataset() {
  if (await fileExists(LARGE_DATASET_PATH)) return true;

  console.log("Downloading Spotify 1.2M songs dataset from Kaggle (~100 MB)…");
  const zipPath = "data/spotify_12m.zip";
  await mkdir("data", { recursive: true });

  try {
    const response = await fetch(LARGE_DATASET_KAGGLE_URL, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
    await execFileAsync("unzip", ["-o", "-q", zipPath, "-d", "data/spotify_12m_tmp"]);
    const { stdout } = await execFileAsync("find", ["data/spotify_12m_tmp", "-name", "*.csv"]);
    const csvPath = stdout.trim().split("\n")[0];
    if (!csvPath) throw new Error("No CSV found in dataset zip.");
    await execFileAsync("mv", [csvPath, LARGE_DATASET_PATH]);
    return true;
  } catch (error) {
    console.warn(`Large dataset unavailable (${error.message}); building from small dataset only.`);
    return false;
  } finally {
    await rm(zipPath, { force: true });
    await rm("data/spotify_12m_tmp", { force: true, recursive: true });
  }
}

// The large dataset stores artists as a Python-style list string: ['A', "B"].
const FIRST_ARTIST_PATTERN = /^\[\s*(['"])(.*?)\1\s*(?:,|\])/;

function firstArtistFromList(value) {
  const match = FIRST_ARTIST_PATTERN.exec(String(value ?? ""));
  return match ? match[2] : "";
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function parseFeatures(valenceRaw, energyRaw, instrumentalnessRaw) {
  const valence = Number(valenceRaw);
  const energy = Number(energyRaw);
  const instrumentalness = Number(instrumentalnessRaw);
  if (!Number.isFinite(valence) || !Number.isFinite(energy)) return null;

  return [
    round2(valence),
    round2(energy),
    Number.isFinite(instrumentalness) ? round2(instrumentalness) : 0,
  ];
}

async function main() {
  const ids = {};
  const names = {};
  const artistSums = new Map();
  let skipped = 0;
  let largeRows = 0;

  const addArtistSample = (artistKey, features) => {
    if (!artistKey) return;
    const sums = artistSums.get(artistKey) ?? [0, 0, 0, 0];
    sums[0] += features[0];
    sums[1] += features[1];
    sums[2] += features[2];
    sums[3] += 1;
    artistSums.set(artistKey, sums);
  };

  for (const row of parseCsv(await readFile(SMALL_DATASET_PATH, "utf8"))) {
    const features = parseFeatures(row.valence, row.energy, row.instrumentalness);
    if (!row.track_id || !features) {
      skipped += 1;
      continue;
    }

    ids[row.track_id] ??= features;
    const primaryArtist = String(row.artists ?? "").split(";")[0];
    const nameKey = trackNameKey(primaryArtist, row.track_name);
    if (nameKey) names[nameKey] ??= features;
    addArtistSample(artistNameKey(primaryArtist), features);
  }

  if (await ensureLargeDataset()) {
    let headers = null;
    let columnIndex = null;

    for await (const row of csvRowsStream(LARGE_DATASET_PATH)) {
      if (!headers) {
        headers = row;
        columnIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
        continue;
      }
      if (row.length !== headers.length) {
        skipped += 1;
        continue;
      }

      largeRows += 1;
      const features = parseFeatures(
        row[columnIndex.valence],
        row[columnIndex.energy],
        row[columnIndex.instrumentalness],
      );
      if (!features) {
        skipped += 1;
        continue;
      }

      const primaryArtist = firstArtistFromList(row[columnIndex.artists]);
      const nameKey = trackNameKey(primaryArtist, row[columnIndex.name]);
      if (nameKey) names[nameKey] ??= features;
      addArtistSample(artistNameKey(primaryArtist), features);
    }
  }

  // Tier-3 fallback: average mood profile per artist for tracks no dataset
  // contains individually.
  const artists = {};
  for (const [artistKey, [valenceSum, energySum, instrumentalnessSum, count]] of artistSums) {
    artists[artistKey] = [
      round2(valenceSum / count),
      round2(energySum / count),
      round2(instrumentalnessSum / count),
    ];
  }

  await mkdir(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  await writeFile(OUTPUT_JSON_PATH, JSON.stringify({ ids, names, artists }));
  console.log(
    `Wrote ${Object.keys(ids).length} ids, ${Object.keys(names).length} name keys, ` +
      `${Object.keys(artists).length} artist keys to ${OUTPUT_JSON_PATH} ` +
      `(${largeRows} large-dataset rows, ${skipped} rows skipped).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
