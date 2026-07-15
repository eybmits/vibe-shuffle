# Architecture

Vibe Shuffle is a client-only React/Vite single-page application. GitHub Pages
serves static files; there is no application backend or study database.

## Runtime data flow

```text
camera frame
  -> MediaPipe Face Landmarker
  -> blendshape scores + motion
  -> expressionModel
  -> Valence and camera-motion Arousal

BLE Heart Rate Service
  -> HR and RR packets
  -> physiologyModel
  -> baseline-relative physiological Arousal

Valence + Arousal
  -> 60 s fused position average
  -> quadrant and songSelection
  -> Spotify playback
  -> rating modal
  -> local CSV download
```

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `src/App.jsx` | React UI, browser APIs, Spotify PKCE/player, protocol state, ratings, export. |
| `src/expressionModel.js` | Pure blendshape feature extraction, rule scores, smoothing, baseline, Valence. |
| `src/physiologyModel.js` | Pure BLE packet parsing, RR filtering, HRV, baseline normalization, Arousal and fusion. |
| `src/songSelection.js` | Pure candidate exclusion and Random/Vibe ranking. |
| `src/experimentData.js` | Mood-window summaries, selection audit context, CSV schema and quality flags. |
| `src/spotifyLibrary.js` | Runtime track objects and quadrant labels. |
| `src/studyCatalog.js` | Static 100-track study catalog. |

The scientific core is kept in pure JavaScript modules so it can be tested
without React, a camera, Spotify, or BLE hardware.

## External boundaries

- **MediaPipe:** WASM and the Face Landmarker model are downloaded from their
  configured CDNs. Inference is then performed by `detectForVideo()` in the
  browser.
- **Spotify:** Authorization Code with PKCE obtains a user token. The Web
  Playback SDK creates a Spotify Connect device and Spotify APIs control
  playback. The application does not receive or redistribute audio files.
- **Web Bluetooth:** the browser connects directly to the standard `heart_rate`
  GATT service and subscribes to `heart_rate_measurement` notifications.
- **CSV:** `Blob` and `URL.createObjectURL()` create a deliberate local download;
  no export endpoint exists.

## State lifecycle

Signal samples live in React state and refs for the active session. Each trial
starts with empty 60-second signal buffers. At rating submission, those buffers
are summarized once and written into an in-memory rating record. Completing the
session creates the CSV locally. Reloading resets experiment state; only Spotify
authentication state is kept in `localStorage`.

## Protocol state

`buildSessionPlan()` resolves one of two fixed masked orders. The participant
number suggests the order, and the experimenter can override it before start.
Every session contains two blocks of five trials. The participant never sees
the condition name.

The first track is selected from the current setup-time signal. Every subsequent
Vibe track uses the mean fused position from the just-completed listening
window. Played tracks are hard-excluded for the rest of the ten-track session.

## Build and deployment

CI and Pages both build from `main` with Node 20. `dist/` is generated and is
not versioned. See [`deployment.md`](deployment.md).
