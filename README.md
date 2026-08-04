# Vibe Shuffle

Vibe Shuffle is a scientific research project on baseline-relative music
selection. Its current experimental implementation runs in a browser and turns
changes relative to a listener's personal camera and cardiac references into a
reviewable next-song choice. It does not claim to diagnose a complete emotional
state. Instead, it follows a recent Valence-Arousal trajectory, assigns its
average to one of four broad regions, and selects a nearby unplayed song. A
masked study mode compares this policy with Random selection from the same
controlled pool.

- **Authors:** Felix Hajuj, Markus Baumann, Miriam Janner
- **Paper:** [`public/paper.pdf`](public/paper.pdf)
- **Live study implementation:** https://eybmits.github.io/vibe-shuffle/

## Research question

Can a transparent next-song policy based on relative Valence-Arousal changes
improve participant-rated mood fit compared with Random selection from the same
fixed track pool?

The prototype evaluates recommendation quality. It does not claim to infer an
objective or clinical emotion.

## How it works

1. MediaPipe facial blendshapes are mapped to a baseline-relative Valence score
   with transparent, rule-based heuristics after a 14-second calibration.
2. An optional Bluetooth heart-rate sensor provides heart rate and RR intervals.
   Heart rate and RMSSD are compared with a 120-second personal baseline to
   estimate Arousal.
3. The signals are fused into a sequence of relative Valence-Arousal points
   during each listening window. The arithmetic mean summarizes this trajectory.
4. Random mode uses a reproducible seeded order. Vibe mode maps the trajectory
   mean to one of four regions and selects the closest eligible unplayed track.
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
- Exploratory report focus: participant-rated mood fit

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
- Python 3 with the packages in `paper/requirements.txt` and a LaTeX
  installation when rebuilding the paper

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
| `npm run paper:figures` | Regenerate all three paper figures. |
| `npm run paper` | Regenerate the figures and rebuild `public/paper.pdf`. |

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
| `paper/main.tex` | ACM-style paper entry point. |
| `paper/sections/` | Abstract and manuscript sections. |
| `paper/figures/` | Reproducible figure scripts plus vector and PNG exports. |
| `paper/results/` | Frozen participant-level summaries used by Figure 3. |
| `paper/RESULTS_PROVENANCE.md` | Result provenance and claim boundaries. |
| `public/paper.pdf` | Rebuilt paper served by the application. |

## Limitations

Vibe Shuffle is an experimental interaction system, not a validated emotion
classifier or medical device. Its relative coordinate is a transparent
recommendation heuristic rather than a measurement of the listener's complete
emotional state. Facial rules, physiological coefficients, signal-quality
thresholds, and the mapping from musical Energy to listener Arousal require
independent validation. The fixed catalog improves experimental control but
limits generalization.

## License

MIT. Spotify content remains subject to Spotify's terms and is streamed through
Spotify; no audio files are distributed by this repository.
