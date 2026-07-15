import assert from "node:assert/strict";
import test from "node:test";

import { rankSongs } from "./songSelection.js";

const songs = [
  { id: "happy-near", energy: 0.72, quadrant: "happy", valence: 0.76 },
  { id: "happy-far", energy: 0.95, quadrant: "happy", valence: 0.95 },
  { id: "relaxed", energy: 0.2, quadrant: "relaxed", valence: 0.8 },
  { id: "tense", energy: 0.8, quadrant: "tense", valence: 0.2 },
];

test("Vibe mode restricts candidates to the detected quadrant", () => {
  const ranked = rankSongs(
    songs,
    "vibe",
    { energy: 0.7, tag: "happy", valence: 0.75 },
    null,
    42,
    [],
  );

  assert.deepEqual(ranked.map((song) => song.id), ["happy-near", "happy-far"]);
});

test("Vibe mode selects the smallest Euclidean distance without random jitter", () => {
  const ranked = rankSongs(
    songs,
    "vibe",
    { energy: 0.7, tag: "happy", valence: 0.75 },
    null,
    999,
    [],
  );

  assert.equal(ranked[0].id, "happy-near");
  assert.ok(ranked[0].score < ranked[1].score);
});

test("played and current tracks are excluded", () => {
  const ranked = rankSongs(
    songs,
    "vibe",
    { energy: 0.7, tag: "happy", valence: 0.75 },
    "happy-near",
    42,
    ["relaxed"],
  );

  assert.deepEqual(ranked.map((song) => song.id), ["happy-far"]);
});

test("Random mode is deterministic for the same session seed", () => {
  const first = rankSongs(songs, "random", {}, null, 1234, []);
  const second = rankSongs(songs, "random", {}, null, 1234, []);

  assert.deepEqual(
    first.map((song) => song.id),
    second.map((song) => song.id),
  );
  assert.ok(first.every((song) => song.fit === null));
});

test("Vibe mode falls back to the full available pool if a quadrant is exhausted", () => {
  const ranked = rankSongs(
    songs,
    "vibe",
    { energy: 0.1, tag: "sad_low", valence: 0.1 },
    null,
    42,
    [],
  );

  assert.equal(ranked.length, songs.length);
});
