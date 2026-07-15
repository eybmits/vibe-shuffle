# CSV Data Dictionary

One row represents one rated track trial. `src/experimentData.js` is the
executable schema; this document explains schema version 2.

Blank cells represent unavailable or inapplicable values. The exporter never
writes the strings `NaN` or `Infinity`.

## Session and protocol

| Column | Meaning |
| --- | --- |
| `protocol_id` | Session identifier generated as `VS-<compact timestamp>`. |
| `participant_number` | Experimenter-entered pseudonymous participant number. |
| `protocol_label` | Masked order label: Protocol 1 or Protocol 2. |
| `timestamp` | ISO timestamp when the trial rating was submitted. |
| `block_order` | Actual condition order, for example `random>vibe`. |
| `run_number` | Compatibility field; currently always 1. |
| `run_order` | Compatibility field; currently equal to `block_order`. |
| `block_number` | Position of the current block: 1 or 2. |
| `block_mode` | Hidden condition: `random` or `vibe`. |
| `track_number` | Position within the current block: 1-5. |
| `trial_id` | Session-wide trial position: 1-10. |
| `trial_jumped` | `true` when the participant used `Rate now`. |
| `listening_duration_seconds` | Confirmed playback time accumulated before rating, maximum 60. |

## Song

| Column | Meaning |
| --- | --- |
| `song_id` | Runtime identifier prefixed with `spotify-`. |
| `spotify_id` | Spotify track ID. |
| `song_title` | Frozen catalog title. |
| `artist` | Frozen catalog artist. |
| `song_quadrant` | `happy`, `relaxed`, `tense`, or `sad_low`. |
| `song_valence` | Catalog Valence on 0-1. |
| `song_arousal` | Catalog Energy on 0-1, used as the song-side Arousal coordinate. |

## Participant outcomes

| Column | Meaning |
| --- | --- |
| `rating_like_1_to_7` | Liking response; 1 is lowest and 7 highest. |
| `rating_fit_1_to_7` | Mood-fit response; 1 is lowest and 7 highest. Primary outcome. |
| `self_reported_mood` | `energetic`, `calm`, `tense`, `melancholic`, or `neutral`. |

## Fused listener state

| Column | Meaning |
| --- | --- |
| `detected_valence` | Mean fused horizontal position during the listening window. |
| `detected_arousal` | Mean fused vertical position during the listening window. |
| `detected_mood` | Quadrant of the mean fused position. |
| `detected_confidence` | Mean signal confidence on 0-1. Not a probability of true emotion. |
| `mood_position_sample_count` | Number of event-driven fused positions averaged. |
| `detected_signal_source` | Usually `mean_60s_mood_position`; identifies a fallback when no samples exist. |

## Facial expression

| Column | Meaning |
| --- | --- |
| `face_present` | Whether any usable face sample occurred in the trial window. |
| `window_expression` | Dominant rule score: `happy`, `relaxed`, `tense`, or `sad_low`. |
| `window_expression_confidence` | Dominant window score on 0-1. |
| `window_expression_sample_count` | Number of camera-expression samples summarized. |
| `expression_valence` | Valence calculated from mean Happy/Sad/Tense scores. |
| `expression_motion_arousal` | Camera motion channel on 0.5-0.95. |
| `mean_happy` | Mean baseline-relative Happy rule score. |
| `mean_relaxed` | Mean fallback Relaxed score. |
| `mean_tense` | Mean baseline-relative Tense rule score. |
| `mean_sad_low` | Mean baseline-relative Sad rule score. |

## Selection audit

These fields describe the target that selected the **current** track. They are
not recomputed from the participant's response to that track.

| Column | Meaning |
| --- | --- |
| `selection_applied` | `true` only when Vibe used the target for selection. |
| `selection_target_mood` | Target quadrant at selection time. |
| `selection_target_valence` | Target horizontal coordinate at selection time. |
| `selection_target_arousal` | Target vertical coordinate at selection time. |
| `selection_target_confidence` | Target signal confidence. |
| `selection_target_source` | `session_start`, `previous_trial_window`, or signal-specific fallback. |
| `selection_song_distance` | Euclidean distance from current song to selection target. |
| `selection_quadrant_match` | Whether current song and target occupy the same quadrant. |

Random trials retain target metadata for audit, but `selection_applied=false`
confirms that the signal did not choose the song.

## Physiology and HRV

| Column | Unit or values | Meaning |
| --- | --- | --- |
| `ecg_connected` | boolean | A heart-rate source was connected. The name is historical; the app receives Heart Rate Service packets, not raw ECG. |
| `physiology_quality` | categorical | `inactive`, `bpm_only`, `low`, or `good`. |
| `physiology_arousal` | 0-1 | Baseline-relative physiological Arousal, blank if unusable. |
| `physiology_arousal_source` | categorical | `hr_rmssd`, `fast_hr`, or blank. |
| `physiology_coherence` | 0-1 | Exploratory rhythm diagnostic; not used for selection. |
| `hr_bpm_mean` | BPM | Mean packet heart rate in the trial window. |
| `hr_bpm_median` | BPM | Median packet heart rate used for baseline comparison. |
| `mean_rr_ms` | ms | Mean accepted RR interval. |
| `rr_count` | count | Accepted RR intervals. |
| `total_rr_count` | count | All received RR intervals. |
| `rejected_rr_count` | count | RR intervals rejected by plausibility rules. |
| `rr_artifact_rate` | 0-1 | Rejected divided by total RR intervals. |
| `rmssd_ms` | ms | Root mean square of successive accepted RR differences. |
| `sdnn_ms` | ms | Sample standard deviation of accepted RR intervals; diagnostic only. |
| `pnn20` | 0-1 | Fraction of successive RR differences above 20 ms. |
| `baseline_hr_bpm` | BPM | Personal baseline median HR. |
| `baseline_rmssd_ms` | ms | Personal baseline median chunk RMSSD. |
| `baseline_sdnn_ms` | ms | Personal baseline median chunk SDNN. |
| `z_hr` | robust spread units | Baseline-relative HR change. Positive means higher HR. |
| `z_rmssd` | robust spread units | Reversed baseline-relative RMSSD change. Positive means lower RMSSD. |
| `z_sdnn` | robust spread units | Reversed baseline-relative SDNN change; diagnostic only. |

## Export quality

| Column | Meaning |
| --- | --- |
| `export_quality_flags` | `ok` or pipe-separated flags for missing/low-quality inputs and early trials. |
| `export_schema_version` | Integer schema version; currently 2. |

Possible flags include `missing_detected_axes`, `missing_face_window`,
`no_face_detected`, `physiology_<quality>`, `incomplete_hrv_window`,
`missing_selection_target`, and `jumped_trial`.

## Data protection note

`participant_number`, `protocol_id`, and `timestamp` can link records across
files or to a collection schedule. Treat the CSV as pseudonymous research data,
not anonymous public data.
