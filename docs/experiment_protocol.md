# Experiment Protocol

The app implements a blinded, counterbalanced validation protocol comparing
**Random Shuffle** against **Vibe Shuffle**.

## Design

- **Pool**: a fixed set of 100 curated Spotify tracks (`src/demoTracks.js`), 25
  per valence/arousal quadrant. Every participant hears from the same pool.
- **Blocks**: two blocks — `random` and `vibe` — of 5 tracks each (10 tracks
  total). The block order is **randomized per session** (counterbalancing) and
  recorded as `block_order` (e.g. `vibe>random`).
- **Listening window**: each track plays for **60 seconds**, then the rating
  prompt opens. The participant can also rate early ("Rate now").
- **Blinding**: the condition (random vs vibe) is never shown to the
  participant during the session.

## Selection

- **Random block**: the next track is chosen deterministically at random from
  the pool (a per-session seed makes the order differ every run).
- **Vibe block**: the next track is the one whose (valence, arousal) is closest
  to the participant's fused state over the just-finished window, filtered to
  the matching quadrant when possible, with a penalty for recently played
  tracks.

The participant's state is the fusion of facial valence and (optional)
heart-rate arousal plus head-motion; see `architecture.md`.

## Ratings

After each track, two **5-point** questions are asked **in sequence**:

1. **Liking** — "How much do you like this song?" → `rating_like_1_to_5`
2. **Mood-fit** — "How well did it fit your current mood?" → `rating_fit_1_to_5`

Mood-fit is the primary outcome; liking is the control. Asking both lets the
analysis separate "did not fit my mood" from "I just don't like this song".

## Outcome & export

At the end the app shows mean **mood-fit Vibe vs Random** (with liking as a
control bar) and exports a CSV. Columns (`CSV_COLUMNS` in `src/App.jsx`):

```
protocol_id, timestamp, block_order, block_number, block_mode, track_number,
song_id, spotify_id, song_title, artist, song_quadrant, song_valence,
song_arousal, face_present, ecg_connected, physiology_quality,
detected_valence, detected_arousal, physiology_arousal,
rating_like_1_to_5, rating_fit_1_to_5
```

Primary analysis: compare `rating_fit_1_to_5` between `block_mode = vibe` and
`block_mode = random`, controlling for `rating_like_1_to_5` and accounting for
`block_order`.
