import assert from "node:assert/strict";
import test from "node:test";

import { quadrantFromAxes } from "./spotifyLibrary.js";
import { STUDY_TRACKS } from "./studyCatalog.js";

test("study catalog contains 100 unique, playable track records", () => {
  assert.equal(STUDY_TRACKS.length, 100);
  assert.equal(new Set(STUDY_TRACKS.map((track) => track.spotifyId)).size, 100);
  assert.equal(
    new Set(STUDY_TRACKS.map((track) => `${track.title}|${track.artist}`.toLowerCase())).size,
    100,
  );

  for (const track of STUDY_TRACKS) {
    assert.match(track.spotifyId, /^[A-Za-z0-9]{22}$/);
    assert.ok(track.title.trim());
    assert.ok(track.artist.trim());
    assert.ok(Number.isFinite(track.valence) && track.valence >= 0 && track.valence <= 1);
    assert.ok(Number.isFinite(track.energy) && track.energy >= 0 && track.energy <= 1);
  }
});

test("study catalog has exactly 25 tracks in each quadrant", () => {
  const counts = STUDY_TRACKS.reduce(
    (result, track) => {
      result[quadrantFromAxes(track.valence, track.energy)] += 1;
      return result;
    },
    { happy: 0, relaxed: 0, sad_low: 0, tense: 0 },
  );

  assert.deepEqual(counts, { happy: 25, relaxed: 25, sad_low: 25, tense: 25 });
});
