# Architecture

Vibe Shuffle is a client-only React/Vite single-page app. There is no backend:
all signal processing runs in the browser, and only the ratings are exported as
a CSV file.

## Signal chain

```
camera ──► MediaPipe blendshapes ──► expressionModel ──► continuous valence (+ motion)
heart-rate sensor ──► HR/RR packets ──► physiologyModel ──► arousal (both directions)
                                                  │
                          fuseEmotionSignals ◄─────┘
                                   │
                       valence × arousal  ──►  quadrant (0.5 thresholds)
                                   │
                          rankSongs (Vibe block)
```

- **Valence** comes from the face. `src/expressionModel.js` turns Face
  Landmarker blendshapes into happy/tense/sad scores, subtracts a slowly-learned
  personal neutral baseline, and maps the positive-vs-negative balance to a
  continuous valence (`valenceFromScores`). Head/body motion (nose-tip drift +
  frame differencing) feeds a motion channel that boosts the "happy" score and
  raises arousal.
- **Arousal** comes from the heart-rate sensor when one is connected.
  `src/physiologyModel.js` parses HR + RR intervals, builds a 120 s personal
  baseline, and computes `physiology_arousal` from z-scored HR (up) and RMSSD
  (down). SDNN is logged but excluded from the short-window estimate.
- **Fusion** (`fuseEmotionSignals`): face sets valence; a usable ECG sets the
  arousal base (both directions); head motion adds to arousal on top. Without a
  usable ECG, the face/motion channel carries arousal (upward only). With no
  face and no ECG, both axes center at 0.5.
- **Quadrants**: valence × arousal split at 0.5 into Energetic / Calm / Tense /
  Melancholic (internal tags `happy` / `relaxed` / `tense` / `sad_low`).

## Session/protocol

`src/App.jsx` holds the whole flow:

- **Setup screen**: connect Spotify (playback only), optional camera, optional
  heart-rate sensor; the 100-track pool is always ready.
- **Two blocks** (`blockOrder`, randomized per session): `random` ranks tracks
  deterministically at random, `vibe` ranks by distance to the fused state in
  the valence/arousal plane (`rankSongs`). 5 tracks per block, 60 s each.
- **Rating**: after each track, two sequential 5-point questions (liking, then
  mood-fit) collected in `RatingModal` and saved by `submitRating`.
- **Result**: `ResultsChart` shows mean mood-fit Vibe vs Random (liking as a
  control); `downloadCsv` exports the slim `CSV_COLUMNS`.

## Playback

`useSpotifyAuth` (Authorization Code + PKCE, playback scopes only) and
`useSpotifyPlayer` (Web Playback SDK) drive playback. `startPlayback` issues a
single `PUT /me/player/play` and only starts the listening-window timer once
Spotify accepts the track.

## Modules

| Module | Responsibility |
| --- | --- |
| `src/App.jsx` | UI, hooks (auth/player/camera/HR), protocol, rating, chart, CSV. |
| `src/expressionModel.js` | Expression → continuous valence, baseline, motion. |
| `src/physiologyModel.js` | HR/HRV, baseline, arousal, signal fusion. |
| `src/spotifyLibrary.js` | Quadrant definitions + `buildDemoLibrary()`. |
| `src/demoTracks.js` | The 100 curated tracks with embedded features. |
