# Vibe Shuffle

Vibe Shuffle is a browser-based research prototype for comparing random music
selection with passive, affect-adaptive selection. Every participant completes
both conditions. The interface keeps the condition hidden, collects ratings
after each track, and exports one auditable CSV row per trial.

## Recommended access

- **Run the study app:** https://eybmits.github.io/vibe-shuffle/
- **Read or clone the source:** https://github.com/eybmits/vibe-shuffle
- **Paper template (work in progress):** [`public/paper.pdf`](public/paper.pdf)

The live website is the quickest access point for an allowlisted Spotify
Premium account. The GitHub repository is the canonical access point for code,
methodology, setup instructions, and future revisions. The Moodle ZIP is a
fixed submission snapshot of the same `main` branch.

## Research question

Does Vibe Shuffle produce higher participant-rated mood fit than Random
Shuffle when both conditions use the same fixed track pool?

The software evaluates recommendation quality. It does **not** claim to infer
an objective or clinical ground-truth emotion.

## Study design

- Within-participant crossover: one Random block and one Vibe block.
- Order counterbalanced across participants:
  - Protocol 1: Random -> Vibe
  - Protocol 2: Vibe -> Random
- Five tracks per block, ten tracks per participant.
- Default listening window: 60 seconds per track; early rating is recorded.
- Required post-track responses: 7-point liking, 7-point mood fit, and a
  categorical mood self-report.
- Primary outcome: participant-rated mood fit.

See [`docs/experiment_protocol.md`](docs/experiment_protocol.md) for the exact
participant flow and proposed analysis.

## Method summary

1. **Face -> Valence.** MediaPipe Face Landmarker returns facial blendshape
   scores. A custom, FACS-inspired rule layer maps smile-, frown-, and
   tension-related evidence to continuous Valence relative to a personal facial
   baseline.
2. **Heart signal -> Arousal.** A Web Bluetooth Heart Rate Service device
   supplies HR and, when available, RR intervals. HR and RMSSD are compared with
   a 120-second personal baseline using robust median/MAD normalization.
3. **Fusion.** Face provides the horizontal Valence coordinate. Physiology
   provides the vertical Arousal base; visible motion can add positive Valence
   and upward Arousal in the implemented prototype.
4. **Windowing.** The app averages the fused state collected during the
   60-second listening window.
5. **Selection.** Random ranks all unplayed tracks by a seeded random order.
   Vibe first restricts candidates to the matching quadrant and then selects the
   unplayed track with the smallest Euclidean distance to the listener state.

All formulas, thresholds, fallbacks, and their limitations are documented in
[`docs/methodology.md`](docs/methodology.md).

## Track catalog

The runtime catalog is the static 100-track module in
[`src/studyCatalog.js`](src/studyCatalog.js): 25 tracks in each Valence/Energy
quadrant. Track features were taken from the public Kaggle Spotify Tracks
Dataset and are embedded in the source, so the app does not request Spotify
Audio Features at runtime. Both experimental conditions use this same pool.
The frozen pool contains mainstream tracks and is not instrumental-only.

Run `npm run test:catalog` to verify the count, uniqueness, feature ranges, and
quadrant balance. See [`docs/music_catalog.md`](docs/music_catalog.md) for the
construction rule and provenance.

## Privacy boundary

The application has no backend or analytics endpoint. Camera frames and raw
heart-rate packets are processed in browser memory and are not uploaded by the
application. Spotify authentication/playback and MediaPipe asset downloads do
create external network traffic. The exported CSV contains derived signal
summaries, ratings, protocol metadata, and timestamps, but no images, facial
landmarks, or raw ECG waveform.

Participant numbers and timestamps are pseudonymous, not anonymous. Remove or
transform them before publishing study data. The repository intentionally
contains no participant dataset, credentials, local build output, dependency
directory, source catalog CSV, or presentation-only material. See
[`docs/privacy_and_limitations.md`](docs/privacy_and_limitations.md).

## Requirements

- Node.js 20 (see [`.nvmrc`](.nvmrc)).
- A modern browser. Chrome or Edge is required for Web Bluetooth.
- A Spotify Developer app and public Client ID.
- A Spotify Premium account for Web Playback SDK playback.
- In Spotify Development mode, every account must be on the app allowlist;
  Spotify currently limits this mode to five users.
- Optional: a BLE sensor exposing the standard Heart Rate Service with RR
  intervals for HRV, such as a compatible chest strap.

The app can run without camera or heart-rate sensor, but Spotify playback is
required for a study session.

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

Add both of these exact redirect URIs in the Spotify Developer Dashboard:

```text
https://eybmits.github.io/vibe-shuffle/
http://127.0.0.1:5173/
```

Spotify no longer accepts `http://localhost:...` as a new redirect URI. The app
uses Authorization Code with PKCE, so no Client Secret belongs in this project.
See [`docs/spotify_setup.md`](docs/spotify_setup.md).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local app at `127.0.0.1:5173`. |
| `npm test` | Run data, expression, physiology, catalog, and selection tests. |
| `npm run build` | Build the production site into `dist/`. |
| `npm run check` | Run the complete test and production-build gate. |
| `npm run preview` | Serve the production build locally. |
| `npm run paper` | Rebuild `public/paper.pdf` with `latexmk`. |
| `npm run flowcharts` | Rebuild `docs/flowcharts.pdf` with `latexmk`. |

The web application requires only `npm ci`, `npm test`, and `npm run build`.
LaTeX is optional and needed only to regenerate the committed PDFs.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/App.jsx` | Participant UI, Spotify, camera/BLE hooks, protocol, ratings, export. |
| `src/expressionModel.js` | Blendshape features, expression rules, baseline, Valence. |
| `src/physiologyModel.js` | BLE parsing, RR filtering, HRV, baseline, Arousal, fusion. |
| `src/songSelection.js` | Pure Random/Vibe ranking logic. |
| `src/experimentData.js` | Selection audit helpers, CSV schema, quality flags. |
| `src/studyCatalog.js` | Fixed 100-track catalog with embedded features. |
| `src/*.test.js` | Deterministic unit and contract tests. |
| `docs/` | Methodology, protocol, data dictionary, privacy, setup, deployment. |
| `paper/` | Minimal ACM LaTeX template for the work-in-progress paper. |
| `public/paper.pdf` | Work-in-progress paper template included in the deployed site. |

## Documentation

- [`docs/methodology.md`](docs/methodology.md): exact signal and selection model.
- [`docs/architecture.md`](docs/architecture.md): runtime modules and data flow.
- [`docs/experiment_protocol.md`](docs/experiment_protocol.md): blinded study flow.
- [`docs/data_dictionary.md`](docs/data_dictionary.md): exported fields and units.
- [`docs/music_catalog.md`](docs/music_catalog.md): catalog provenance.
- [`docs/privacy_and_limitations.md`](docs/privacy_and_limitations.md): claim boundary.
- [`docs/spotify_setup.md`](docs/spotify_setup.md): authentication and playback.
- [`docs/troubleshooting.md`](docs/troubleshooting.md): common runtime failures.
- [`docs/deployment.md`](docs/deployment.md): deployment from `main`.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): review and scientific-change rules.

## Deployment

Every push to `main` runs CI and deploys the tested production build through
GitHub Actions. The Spotify Client ID is stored as the public repository
variable `VITE_SPOTIFY_CLIENT_ID`; no secret is required. See
[`docs/deployment.md`](docs/deployment.md).

## Scope and limitations

Vibe Shuffle is an experimental interaction system, not a validated emotion
classifier, medical device, or catalogue-scale recommender. Facial weights,
physiological Arousal coefficients, RR-quality thresholds, and the mapping from
song Energy to listener Arousal are transparent engineering choices that require
independent validation. The fixed catalog improves experimental control but
limits generalization.

## License

MIT, see [`LICENSE`](LICENSE). Spotify content remains subject to Spotify's
terms and is streamed by Spotify; no audio files are distributed here.
