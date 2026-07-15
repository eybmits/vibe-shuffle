import test from "node:test";
import assert from "node:assert/strict";
import {
  CSV_COLUMNS,
  createSelectionContext,
  ratingsToCsv,
  songDistanceToSelection,
  summarizeMoodPositionSamples,
  trialDataQualityFlags,
} from "./experimentData.js";

test("60 second mood summary keeps averaged axes finite", () => {
  const summary = summarizeMoodPositionSamples([
    { confidence: 0.4, energy: 0.3, facePresent: true, valence: 0.7 },
    { confidence: 0.8, energy: 0.9, facePresent: true, valence: 0.5 },
  ]);

  assert.ok(Math.abs(summary.valence - 0.6) < 1e-9);
  assert.ok(Math.abs(summary.energy - 0.6) < 1e-9);
  assert.ok(Math.abs(summary.confidence - 0.6) < 1e-9);
  assert.equal(summary.sampleCount, 2);
  assert.equal(summary.tag, "happy");
});

test("selection context records the exact target used for adaptive ranking", () => {
  const context = createSelectionContext(
    {
      confidence: 0.7,
      energy: 0.8,
      selectionSignalSource: "face_window_plus_ecg_arousal",
      tag: "happy",
      valence: 0.7,
    },
    "vibe",
  );

  assert.equal(context.applied, true);
  assert.equal(context.mood, "happy");
  assert.equal(context.source, "face_window_plus_ecg_arousal");
  assert.ok(songDistanceToSelection({ energy: 0.75, valence: 0.75 }, context) < 0.08);
});

test("mood summary uses a finite neutral fallback when no samples exist", () => {
  const summary = summarizeMoodPositionSamples([], {
    confidence: Number.NaN,
    energy: Number.NaN,
    facePresent: false,
    valence: Number.NaN,
  });

  assert.equal(summary.valence, 0.5);
  assert.equal(summary.energy, 0.5);
  assert.equal(summary.confidence, 0);
  assert.equal(summary.tag, "relaxed");
});

test("CSV schema is unique and serializer never writes NaN or Infinity", () => {
  assert.equal(new Set(CSV_COLUMNS).size, CSV_COLUMNS.length);
  const csv = ratingsToCsv([
    {
      protocol_id: "VS-test",
      detected_valence: Number.NaN,
      detected_arousal: Number.POSITIVE_INFINITY,
      song_title: 'A "quoted", title',
    },
  ]);

  assert.doesNotMatch(csv, /NaN|Infinity/);
  assert.match(csv, /"A ""quoted"", title"/);
});

test("complete trial record passes export quality checks", () => {
  const record = {
    block_mode: "vibe",
    detected_arousal: 0.61,
    detected_valence: 0.72,
    ecg_connected: true,
    face_present: true,
    hr_bpm_mean: 78,
    physiology_arousal: 0.61,
    physiology_quality: "good",
    rmssd_ms: 34,
    rr_count: 60,
    selection_target_arousal: 0.58,
    selection_target_valence: 0.7,
    trial_jumped: false,
    window_expression_sample_count: 300,
  };

  assert.equal(trialDataQualityFlags(record), "ok");
});

test("quality flags expose missing adaptive and HRV data", () => {
  const flags = trialDataQualityFlags({
    block_mode: "vibe",
    ecg_connected: true,
    face_present: true,
    physiology_quality: "good",
    rr_count: 0,
    trial_jumped: true,
    window_expression_sample_count: 0,
  });

  assert.match(flags, /missing_detected_axes/);
  assert.match(flags, /missing_face_window/);
  assert.match(flags, /incomplete_hrv_window/);
  assert.match(flags, /missing_selection_target/);
  assert.match(flags, /jumped_trial/);
});
