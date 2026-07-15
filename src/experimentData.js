const clamp01 = (value, fallback = 0.5) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 1) : fallback;
};

export function moodTagFromAxes(valence, arousal) {
  if (valence >= 0.5 && arousal >= 0.5) return "happy";
  if (valence >= 0.5 && arousal < 0.5) return "relaxed";
  if (valence < 0.5 && arousal >= 0.5) return "tense";
  return "sad_low";
}

export function createSelectionContext(signal, mode, origin = "unknown") {
  const valence = clamp01(signal?.valence);
  const arousal = clamp01(signal?.energy);
  const mood = signal?.tag ?? moodTagFromAxes(valence, arousal);
  return {
    applied: mode === "vibe",
    arousal,
    confidence: clamp01(signal?.confidence, 0),
    energy: arousal,
    mode,
    mood,
    source: signal?.selectionSignalSource ?? origin,
    tag: mood,
    valence,
  };
}

export function songDistanceToSelection(song, context) {
  if (!song || !context) return null;
  const songValence = Number(song.valence);
  const songArousal = Number(song.energy);
  if (!Number.isFinite(songValence) || !Number.isFinite(songArousal)) return null;
  return Math.hypot(songValence - context.valence, songArousal - context.arousal);
}

export function summarizeMoodPositionSamples(samples, fallbackSignal = null) {
  const validSamples = samples.filter(
    (sample) => Number.isFinite(sample?.valence) && Number.isFinite(sample?.energy),
  );

  if (!validSamples.length) {
    const valence = clamp01(fallbackSignal?.valence);
    const energy = clamp01(fallbackSignal?.energy);
    const facePresent = Boolean(fallbackSignal?.facePresent);
    return {
      confidence: clamp01(fallbackSignal?.confidence, 0),
      energy,
      facePresent,
      sampleCount: 0,
      selectionSignalSource: fallbackSignal?.selectionSignalSource ?? "fallback_signal",
      tag: fallbackSignal?.tag ?? (facePresent ? moodTagFromAxes(valence, energy) : "relaxed"),
      valence,
    };
  }

  const mean = (field, fallback = 0) =>
    validSamples.reduce((total, sample) => total + Number(sample[field] ?? fallback), 0) /
    validSamples.length;
  const valence = clamp01(mean("valence", 0.5));
  const energy = clamp01(mean("energy", 0.5));

  return {
    confidence: clamp01(mean("confidence"), 0),
    energy,
    facePresent: validSamples.some((sample) => sample.facePresent),
    sampleCount: validSamples.length,
    selectionSignalSource: "mean_60s_mood_position",
    tag: moodTagFromAxes(valence, energy),
    valence,
  };
}

// The original 27 columns stay first for backward compatibility. Diagnostic
// columns follow so the adaptive mechanism can be audited after data collection.
export const CSV_COLUMNS = [
  "protocol_id",
  "participant_number",
  "protocol_label",
  "timestamp",
  "block_order",
  "run_number",
  "run_order",
  "block_number",
  "block_mode",
  "track_number",
  "song_id",
  "spotify_id",
  "song_title",
  "artist",
  "song_quadrant",
  "song_valence",
  "song_arousal",
  "face_present",
  "ecg_connected",
  "physiology_quality",
  "detected_valence",
  "detected_arousal",
  "physiology_arousal",
  "physiology_coherence",
  "rating_like_1_to_7",
  "rating_fit_1_to_7",
  "self_reported_mood",
  "trial_id",
  "trial_jumped",
  "listening_duration_seconds",
  "detected_mood",
  "detected_confidence",
  "mood_position_sample_count",
  "detected_signal_source",
  "window_expression",
  "window_expression_confidence",
  "window_expression_sample_count",
  "expression_valence",
  "expression_motion_arousal",
  "mean_happy",
  "mean_relaxed",
  "mean_tense",
  "mean_sad_low",
  "selection_applied",
  "selection_target_mood",
  "selection_target_valence",
  "selection_target_arousal",
  "selection_target_confidence",
  "selection_target_source",
  "selection_song_distance",
  "selection_quadrant_match",
  "physiology_arousal_source",
  "hr_bpm_mean",
  "hr_bpm_median",
  "mean_rr_ms",
  "rr_count",
  "total_rr_count",
  "rejected_rr_count",
  "rr_artifact_rate",
  "rmssd_ms",
  "sdnn_ms",
  "pnn20",
  "baseline_hr_bpm",
  "baseline_rmssd_ms",
  "baseline_sdnn_ms",
  "z_hr",
  "z_rmssd",
  "z_sdnn",
  "export_quality_flags",
  "export_schema_version",
];

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function ratingsToCsv(ratings) {
  const rows = ratings.map((rating) =>
    CSV_COLUMNS.map((column) => csvEscape(rating[column])).join(","),
  );

  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}

export function trialDataQualityFlags(record) {
  const flags = [];
  const finite = (field) => Number.isFinite(record[field]);

  if (!finite("detected_valence") || !finite("detected_arousal")) {
    flags.push("missing_detected_axes");
  }
  if (record.face_present && Number(record.window_expression_sample_count) < 1) {
    flags.push("missing_face_window");
  }
  if (!record.face_present) flags.push("no_face_detected");
  if (record.ecg_connected && record.physiology_quality !== "good") {
    flags.push(`physiology_${record.physiology_quality || "unknown"}`);
  }
  if (
    record.physiology_quality === "good" &&
    (!finite("physiology_arousal") ||
      !finite("hr_bpm_mean") ||
      !finite("rmssd_ms") ||
      Number(record.rr_count) < 20)
  ) {
    flags.push("incomplete_hrv_window");
  }
  if (
    record.block_mode === "vibe" &&
    (!finite("selection_target_valence") || !finite("selection_target_arousal"))
  ) {
    flags.push("missing_selection_target");
  }
  if (record.trial_jumped) flags.push("jumped_trial");

  return flags.length ? flags.join("|") : "ok";
}
