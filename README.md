# Vibe Shuffle

Vibe Shuffle is a browser-based research prototype that compares random music
selection with affect-adaptive music selection. Each participant completes both
conditions, rates every track, and exports one CSV row per trial.

- **Authors:** Felix Hajuj, Markus Baumann, Miriam Janner
- **Paper:** Work in progress - [`public/paper.pdf`](public/paper.pdf)
- **Live application:** https://eybmits.github.io/vibe-shuffle/

## Research question

Does Vibe Shuffle produce higher participant-rated mood fit than Random Shuffle
when both conditions use the same fixed track pool?

The prototype evaluates recommendation quality. It does not claim to infer an
objective or clinical emotion.

## How it works

1. MediaPipe facial blendshapes are mapped to a baseline-relative Valence score
   with transparent, rule-based heuristics after a 14-second calibration.
2. An optional Bluetooth heart-rate sensor provides heart rate and RR intervals.
   Heart rate and RMSSD are compared with a 120-second personal baseline to
   estimate Arousal.
3. The signals are fused into a Valence-Arousal coordinate during each listening
   window.
4. Random mode uses a reproducible seeded order. Vibe mode selects the closest
   unplayed track from the matching Valence-Energy quadrant.
5. The participant rates liking and mood fit on seven-point scales and reports
   their current mood.

The fixed catalog in `src/studyCatalog.js` contains 100 tracks: 25 in each
Valence-Energy quadrant. Its embedded features originate from the public Kaggle
Spotify Tracks Dataset. Both experimental conditions use this same catalog.

## Study protocol

- Within-participant crossover design
- One Random block and one Vibe block
- Counterbalanced order:
  - Protocol 1: Random -> Vibe
  - Protocol 2: Vibe -> Random
- Five tracks per block and ten trials per participant
- Up to 60 seconds of listening per track
- Early rating is allowed and recorded
- Primary outcome: participant-rated mood fit

The exported CSV records protocol and track metadata, ratings, listening time,
derived signal summaries, selection details, and data-quality flags.
Condition-level mean mood-fit scores are compared within each participant.

## Privacy

The application has no backend or analytics endpoint. Camera frames and raw
heart-rate packets are processed in browser memory and are not uploaded by the
application. Spotify authentication and playback, plus MediaPipe asset loading,
still require external network connections.

The CSV contains derived measurements, timestamps, and pseudonymous participant
numbers. It contains no images, facial landmarks, or raw ECG waveform. Exported
data is pseudonymous, not anonymous, and must be handled accordingly.

## Requirements

- Node.js 20
- Chrome or Edge for Web Bluetooth
- Spotify Developer application with a public Client ID
- Spotify Premium account for Web Playback SDK playback
- Optional Bluetooth device implementing the Heart Rate Service

The application can run without the camera or heart-rate sensor, but Spotify
playback is required for a complete study session.

## Local setup

```bash
git clone https://github.com/eybmits/vibe-shuffle.git
cd vibe-shuffle
nvm install
nvm use
cp .env.example .env
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:5173/`.

Set the public Spotify Client ID in `.env`:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
```

Add these exact redirect URIs in the Spotify Developer Dashboard:

```text
https://eybmits.github.io/vibe-shuffle/
http://127.0.0.1:5173/
```

The application uses Authorization Code with PKCE. Do not add a Spotify Client
Secret to this repository.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm test` | Run all model, catalog, selection, and export tests. |
| `npm run build` | Create the production build in `dist/`. |
| `npm run check` | Run the complete test and build gate. |
| `npm run preview` | Preview the production build. |
| `npm run paper` | Rebuild the work-in-progress PDF. |

Pushes to `main` run the test/build workflow and deploy the application through
GitHub Pages.

## Repository structure

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | User interface, study flow, sensors, Spotify, and ratings. |
| `src/expressionModel.js` | Facial baseline, expression rules, and Valence. |
| `src/physiologyModel.js` | Heart-rate parsing, HRV, baseline, and Arousal. |
| `src/songSelection.js` | Random and Vibe ranking logic. |
| `src/experimentData.js` | CSV generation and data-quality checks. |
| `src/studyCatalog.js` | Fixed 100-track study catalog. |
| `src/*.test.js` | Deterministic tests for the study logic. |
| `paper/main.tex` | Minimal work-in-progress paper title page. |
| `public/paper.pdf` | Paper title page served by the application. |

## Limitations

Vibe Shuffle is an experimental interaction system, not a validated emotion
classifier or medical device. Facial rules, physiological coefficients,
signal-quality thresholds, and the mapping from musical Energy to listener
Arousal require independent validation. The fixed catalog improves experimental
control but limits generalization.

## License

MIT. Spotify content remains subject to Spotify's terms and is streamed through
Spotify; no audio files are distributed by this repository.
