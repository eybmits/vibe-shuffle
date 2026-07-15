# Contributing

Vibe Shuffle is study software. A code change can also change the experimental
method, stimulus set, or exported schema, so review must cover more than whether
the interface still renders.

## Setup

```bash
nvm use
npm ci
npm run check
```

Use a topic branch and keep commits scoped. Never commit `.env`, access tokens,
participant CSVs, source datasets, generated `dist/`, or local presentation
material.

## Before review

1. Run `npm run check`.
2. Run `npm audit` after dependency changes.
3. Update `docs/methodology.md` when a formula, threshold, fallback, baseline,
   quality rule, or selection policy changes.
4. Update `docs/data_dictionary.md` and increment `export_schema_version` when
   the CSV contract changes.
5. Update `docs/experiment_protocol.md` when trial count, order, duration,
   blinding, rating, or analysis logic changes.
6. Update `docs/music_catalog.md` and its integrity test when the stimulus set
   changes.
7. Rebuild the committed paper or flowchart PDF when its source changes.

## Scientific claim boundary

- Call the facial channel a custom rule-based expression estimator, not a
  trained emotion classifier.
- Call HR/RMSSD an experimental Arousal proxy, not an emotion diagnosis.
- State that the system measures relative change from a personal baseline.
- Do not call exports anonymous; participant numbers and timestamps are
  pseudonymous.
- Do not describe an analysis as preregistered without a dated public record.

## Catalog changes

The catalog is a frozen experimental stimulus set. Do not silently replace a
track that becomes unavailable. Record a new catalog version and preserve which
version each participant received.

## Release path

`main` is the source of truth. CI and GitHub Pages both build from `main`; no
generated deployment branch is maintained.
