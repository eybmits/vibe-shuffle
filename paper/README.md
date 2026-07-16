# Final project report

This directory contains the LaTeX source and publication figures for:

> **Vibe Shuffle: Testing Transparent Affect-Adaptive Music Selection**
> Felix Hajuj, Markus Baumann, and Miriam Janner, 2026

The compiled report is available at [`public/paper.pdf`](../public/paper.pdf).
The report follows the supplied seminar template and contains 24,481 characters
without spaces, using the template's original TeXcount definition.

## Build

From the repository root:

```bash
npm run paper
```

This runs `latexmk` in `paper/`, writes temporary files to `paper/build/`, and
copies the final PDF to `public/paper.pdf`. The supplied ACM class and
bibliography style are included locally so the report does not depend on a
system-wide `acmart` installation. A working TeX distribution with `latexmk`
is still required.

## Source layout

| Path | Purpose |
| --- | --- |
| `main.tex` | Template setup, title, authors, abstract, and document shell |
| `content.tex` | Complete report body |
| `bibliography.bib` | Referenced research and project sources |
| `chars.txt` | Reproducibly precomputed character count |
| `figures/pipeline_overview.*` | Signal pipeline plus the actual 100-track Valence–Energy map from `src/studyCatalog.js` |
| `figures/study_results.*` | Paired estimation figure for the user study |
| `analysis/statistics.json` | Exact aggregate statistics used by the report |
| `THIRD_PARTY_NOTICES.md` | Template provenance and separate licensing notices |

## Character count

The original template defines the length as TeXcount's word total plus its
character total, minus one:

```bash
expr $(texcount -1 -sum -merge content.tex) + \
  $(texcount -1 -sum -merge -char content.tex) - 1
```

Expected result: `24481`.

## Analysis and data availability

The independent unit is the participant/session (`N = 15`), and each condition
mean summarizes five ratings. The report includes the paired differences,
confidence intervals, directional tests, effect sizes, and a tie-corrected
Wilcoxon sensitivity analysis. See [`analysis/README.md`](analysis/README.md).

Participant-labelled exports and source filenames are not committed. The
available archive does not establish consent for public individual-level data
sharing. Aggregate statistics and de-identified figures are included; a fuller
release requires an explicit consent and anonymization decision by the team.

## Before submission

The exact contribution split, recruitment/demographic/ethics information,
sensor hardware and study environment, and uniqueness of repeated `P1` source
labels still require confirmation. The
[reporting checklist](../docs/REPORTING_CHECKLIST.md) records each open item.

The report describes study software commit `bb92969` (the last `main` commit
before this documentation integration). Future implementation changes should
not be described as if they were present during the reported data collection.
