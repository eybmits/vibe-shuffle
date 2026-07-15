# Experiment Protocol

Vibe Shuffle implements a participant-blinded, within-participant comparison of
Random Shuffle and Vibe Shuffle. Both conditions use the same fixed study
catalog. Only the selection policy changes.

## Design

| Element | Implemented value |
| --- | --- |
| Design | Within-participant crossover |
| Conditions | Random and Vibe |
| Blocks | 2 |
| Tracks per block | 5 |
| Trials per participant | 10 |
| Default listening window | 60 seconds |
| Catalog | 100 tracks, 25 per quadrant |
| Primary outcome | 7-point mood-fit rating |

Order is counterbalanced across participants through two masked protocols:

- **Protocol 1:** Random, then Vibe.
- **Protocol 2:** Vibe, then Random.

An odd participant number suggests Protocol 1 and an even number suggests
Protocol 2. The experimenter can override this suggestion before starting. The
participant sees only the masked protocol number, never the condition names.

This is a within-participant design because every participant completes both
conditions. Order is a between-participant counterbalancing factor.

## Participant flow

1. The experimenter enters a pseudonymous participant number and checks the
   masked protocol.
2. Spotify is connected. Camera and BLE heart-rate sensor are optional.
3. A connected cardiac sensor completes a 120-second personal baseline.
4. When the session starts with a camera, a 14-second facial calibration runs.
5. The participant presses Play. The timer advances only after Spotify playback
   has been confirmed.
6. The track plays for up to 60 seconds. `Rate now` can end the window early.
7. Playback pauses and all three required questions are answered.
8. The next track is selected. Played tracks are excluded for the rest of the
   session.
9. After trial 10, the app downloads the session CSV.

`listening_duration_seconds` and `trial_jumped` preserve whether a trial used
the full listening window. Early trials are not silently treated as 60-second
trials.

## Selection policies

### Shared controls

- Both conditions use `src/studyCatalog.js`.
- The current and previously played tracks are excluded.
- A session seed makes Random ordering reproducible within the session.
- The participant cannot see which policy is active.

### Random

Random ranks every remaining track by a deterministic pseudorandom value based
on track ID and session seed. Facial and physiological signals are still logged
but do not affect selection.

### Vibe

The listener target is `(Valence, Arousal)`. Vibe:

1. maps that target to one of four quadrants;
2. restricts candidates to unplayed tracks in that quadrant;
3. calculates Euclidean distance for every candidate;
4. selects the smallest distance;
5. uses the session seed only to resolve an exact distance tie.

If all tracks in the target quadrant have already been used, the method falls
back to all remaining tracks. This fallback cannot normally occur in a
ten-track session with 25 tracks per quadrant, but it keeps the function total.

The first track uses the setup-time signal. Each later Vibe track uses the mean
listener position from the preceding trial's actual listening window. Selection
target, source, distance, and quadrant match are exported for audit.

## Ratings

After every trial, the participant answers:

1. **Liking:** "How much do you like this song?" on 1-7.
2. **Mood fit:** "How well did it fit your current mood?" on 1-7.
3. **Current mood:** Energetic, Calm, Tense, Melancholic, or Neutral.

Mood fit is the primary outcome. Liking is a control because a participant may
dislike a song even when its affective profile matches the current state. Mood
option positions are randomized at every prompt to reduce fixed-position bias.

## Proposed analysis

The independent observational unit is the participant, not the individual song
rating. For each participant:

1. average the five mood-fit ratings in Random;
2. average the five mood-fit ratings in Vibe;
3. calculate `Vibe - Random`.

Report the paired participant points, condition summaries, the paired effect,
and a confidence interval. With a small sample and ordinal ratings, use an exact
paired Wilcoxon signed-rank or paired permutation test as the primary
sensitivity-robust inference. A paired t-test may be reported as a secondary
analysis when the participant-level differences are approximately symmetric
and free of influential outliers.

Exclude or separately analyze trials with `trial_jumped=true`, very short
`listening_duration_seconds`, or severe `export_quality_flags`; define that rule
before examining the condition result. Report the complete-case and all-trial
results as a robustness check. Protocol order can be shown descriptively and,
with sufficient sample size, modeled as an interaction or fixed effect.

No confirmatory test should be described as preregistered unless a dated public
preregistration actually exists.

## Blinding boundary

The participant-facing view hides block mode, order labels, signal diagnostics,
and the condition comparison. The CSV necessarily contains `block_mode` and
`block_order` for analysis. This is participant blinding, not double blinding:
an experimenter with access to setup or exported data can recover the order.
