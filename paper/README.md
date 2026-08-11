# Vibe Shuffle paper

The paper uses the repository's existing ACM template and a fixed section
layout:

- `sections/abstract.tex`
- `sections/introduction.tex`
- `sections/background.tex`
- `sections/related-work.tex`
- `sections/methodology.tex`
- `sections/experimental-section.tex`
- `sections/evaluation.tex`
- `sections/conclusion.tex`

Run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r paper/requirements.txt
npm run paper
```

This regenerates all three vector figures, compiles `paper/main.tex`, and copies
the final PDF to `public/paper.pdf`.

## Figure provenance

- Figure 1(a--b) adapts the arrangement and labels in Helmholz, Meyer, and
  Robra-Bissantz's simplified presentation of Russell and Thayer. Every shape
  and label is newly rendered; no source pixels are reused. Figure 1(c) is an
  original, data-free schematic of the qualitative frequency-distribution
  distinction discussed by Balaji et al. It does not reconstruct their curves,
  observations, or session data.
- Figure 2 is original to Vibe Shuffle and documents the implemented
  reference-relative facial and cardiac paths, recent-window movement cues,
  trajectory, and selection path. Its trajectory is
  illustrative; the candidate ranking, distances, played-track exclusion, and
  selected track are repository-derived.
- Figure 3 independently redraws the original paired-estimation display using
  the 15 published participant/session means in
  `results/participant_means.csv` and the reported inferential summary in
  `results/pilot_summary.csv`. It preserves the original comparison while
  improving hierarchy, spacing, and legibility in a compact four-square 2x2
  layout. No trial-level values are reconstructed.

Balaji et al.'s 2025 HRV-coherence study is cited as literature context. Its
Figure 7 is not reproduced, digitized, or adapted: the article's CC BY-NC-ND
4.0 license does not permit distributing a modified version without separate
permission.

## Claim boundary

Vibe Shuffle combines within-session proxy observations for a transparent
recommendation rule. It does not infer objective emotion, provide a clinical
measurement, or establish that adaptive selection is superior to Random
selection.
