# Architecture

Vibe Shuffle is a Vite + React + Tailwind single-page app. The application is
client-only; there is no backend service.

## Main Components

- `src/App.jsx`: complete experiment UI, state machine, playback handling,
  expression sampling, track ranking, rating modal, and CSV export.
- `src/expressionModel.js`: pure local expression scoring, baseline
  calibration, temporal switching, and listening-window summaries.
- `src/data/musicCatalog.json`: static track catalog consumed by the app.
- `src/data/spotifyCatalog.json`: legacy/optional Spotify catalog output.
- `scripts/build_curated_instrumental_catalog.mjs`: current public-demo
  catalog generator using Wikimedia Commons/Incompetech and selected Internet
  Archive instrumentals.
- `scripts/build_jamendo_catalog.mjs`: preferred real-music catalog generator.
- `scripts/build_internet_archive_catalog.mjs`: no-login real-music fallback
  generator.
- `scripts/build_spotify_catalog.mjs`: build-time Spotify catalog generator.
- `src/index.css`: Tailwind entrypoint and global base styles.

## Data Flow

1. The app loads `musicCatalog.json`.
2. Each track is normalized into a common internal shape:
   `id`, `title`, `artist`, `spotifyUri`, `audioUrl`, `quadrant`,
   `valence`, `energy`, `instrumentalness`, and visual styling fields.
3. The validation protocol starts with Random Shuffle and then Vibe Shuffle.
4. Expression samples are estimated locally with MediaPipe Face Landmarker
   blendshapes.
5. Random Shuffle ignores expression state for track selection.
6. At the end of each listening window, the app averages the expression samples
   from that window.
7. Vibe Shuffle ranks the next track by that window-average expression state and
   recent-play avoidance.
8. After each listening window, the participant must submit a 1-4 rating.
9. At protocol completion, ratings are exported as CSV.

## Expression Detection

The browser loads MediaPipe Face Landmarker from `@mediapipe/tasks-vision`.
The app uses face blendshape scores, not identity recognition. The expression
model estimates:

- `happy`
- `relaxed`
- `tense`
- `sad_low`

The classifier uses a short neutral baseline, exponential smoothing, minimum
sustained samples, and switching margins to reduce flicker. Neutral/low-evidence
faces default to `relaxed`; `sad_low` requires sustained frown/mouth-corner
evidence plus low smile evidence. Camera frames are not stored or uploaded.

Track selection uses the average expression scores across the just-finished
listening window, not the last detected instant. This makes brief end-of-song
noise less likely to control the next Vibe Shuffle track.

## Playback Paths

There are three playback paths:

- Direct MP3/stream playback: Jamendo or fallback instrumental URLs in the
  catalog.
- Spotify Web Playback SDK: full-track playback for Spotify catalog entries
  with `spotifyUri`; requires Spotify Premium.
- Spotify preview URL: stored when available during catalog generation, but not
  relied on for full-track playback.

## Catalog Generation

Catalog generators run at build time, not in the browser. The current curated
path writes `src/data/musicCatalog.json` and
`data/curated_instrumental_catalog.csv`. Jamendo and Spotify paths can also
write `src/data/musicCatalog.json`. Secrets are provided through environment
variables or an ignored `.env` file and are never committed.
