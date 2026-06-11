# Curated Track Set

The app plays a **fixed set of 100 curated Spotify tracks**, defined in
`src/demoTracks.js`. There is no runtime catalog build and no personal-library
read — Spotify is used only for playback.

## Contents

- 100 well-known tracks, **25 per valence/arousal quadrant** (Energetic / Calm /
  Tense / Melancholic).
- Each entry has a real Spotify track ID/URI and **embedded audio features**
  (`valence`, `energy`, `instrumentalness`, `popularity`), so the quadrant is
  determined deterministically without any API call or lookup file.

```js
{ spotifyId: "4LRPiXqCikLlN15c3yImP7", title: "As It Was", artist: "Harry Styles",
  valence: 0.66, energy: 0.73, instrumentalness: 0, popularity: 94 }
```

`buildDemoLibrary()` in `src/spotifyLibrary.js` turns these into the runtime
track objects (adding quadrant, accent, palette via `EMOTION_QUADRANTS`).

## How it was generated

The set was produced once from the public Kaggle "Spotify Tracks Dataset"
(real Spotify audio features, ~2022): for each quadrant, the most popular,
de-duplicated tracks with `popularity ≥ 55` were taken until 25 were collected.
The result was written directly into `src/demoTracks.js` as a static module.

To regenerate or swap tracks, edit `src/demoTracks.js` directly (real Spotify
track IDs are required for playback, and valence/energy must be in 0–1).

## Why a fixed set

- Works without reading the participant's Spotify library, so it is unaffected
  by the Spotify library API rate limits and Development-mode restrictions.
- Every participant draws from the same balanced pool, which keeps the
  Vibe-vs-Random comparison controlled.
