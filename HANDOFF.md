# Vibe Shuffle handoff

This repository is the complete handoff for the Vibe Shuffle research project.
It contains the study implementation, deterministic tests, frozen analysis
summaries, reproducible figures, LaTeX source, final paper PDF, and a source
archive ready for Overleaf.

## Start on another computer

```bash
git clone https://github.com/eybmits/vibe-shuffle.git
cd vibe-shuffle
nvm install
nvm use
npm ci
npm run check
```

Create the local environment file only when running Spotify playback:

```bash
cp .env.example .env
```

Set `VITE_SPOTIFY_CLIENT_ID` to the public Client ID from the Spotify Developer
Dashboard. Never put a Spotify Client Secret in this repository. Run the local
application with `npm run dev` and open `http://127.0.0.1:5173/`.

## Handoff artifacts

| Path | Contents |
| --- | --- |
| `public/paper.pdf` | Final seven-page paper served by the website. |
| `paper/main.tex` | Canonical ACM-style LaTeX entry point. |
| `paper/sections/` | Manuscript section sources. |
| `paper/figures/` | Figure scripts plus vector and PNG outputs. |
| `paper/results/` | Frozen participant-level summaries used by Figure 3. |
| `paper/RESULTS_PROVENANCE.md` | Evidence provenance and reconstruction limits. |
| `paper/submission/Vibe_Shuffle_Paper.pdf` | Frozen submission PDF. |
| `paper/submission/Vibe_Shuffle_LaTeX_Source.zip` | Complete Overleaf-ready source package. |
| `paper/submission/SHA256SUMS.txt` | Checksums for all submission deliverables. |

Verify the frozen artifacts after cloning:

```bash
(cd paper/submission && shasum -a 256 -c SHA256SUMS.txt)
unzip -t paper/submission/Vibe_Shuffle_LaTeX_Source.zip
cmp public/paper.pdf paper/submission/Vibe_Shuffle_Paper.pdf
```

The two PDF paths are intentionally byte-identical. The ZIP contains the full
LaTeX source, generated bibliography, figure sources and exports, frozen result
tables, catalog snapshot, provenance note, and build instructions.

## Rebuild the paper

Install Python 3, the packages in `paper/requirements.txt`, and a current TeX
Live distribution with `latexmk` and the ACM `acmart` class. Then run:

```bash
python3 -m pip install -r paper/requirements.txt
npm run paper
```

This regenerates the three figures, compiles `paper/main.tex`, and replaces
`public/paper.pdf`. The frozen submission artifacts should only be replaced
deliberately and their checksums must then be regenerated.

## Scientific boundary

Vibe Shuffle studies a transparent, personal-reference-informed next-song
policy. Facial and cardiac observations are interpreted relative to personal
references, while recent-window movement cues enter separately. These signals
provide recommendation context, not an objective, complete, or clinical emotion
label. The retained
exploratory crossover includes participant/session means for 15 records, but no
raw trial rows, sensor streams, recruitment records, administration logs, or
historical collection revision. Both reported paired confidence intervals cross
zero; the available evidence does not establish that Vibe selection outperforms
Random selection. See `paper/RESULTS_PROVENANCE.md` for the exact boundary.

## Files recreated locally

The repository intentionally excludes `.env`, `node_modules/`, `dist/`, LaTeX
build output, Python caches, and temporary files. They are reproducible from the
tracked sources and should not be committed. The application stores no backend
database, audio files, camera frames, raw ECG waveform, or Spotify Client Secret.

## Before continuing work

```bash
git pull --ff-only
npm ci
npm run check
git status --short --branch
```

Pushes to `main` run the test/build workflow and publish the website through
GitHub Pages. See `README.md` for the study protocol, architecture, privacy
model, Spotify setup, and command reference.
