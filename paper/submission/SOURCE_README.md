# Vibe Shuffle LaTeX source

This archive contains the complete source used to render the accompanying
paper. The main entry point is `main.tex`.

## Build the paper

Install a current TeX Live distribution with the ACM `acmart` class, then run:

```bash
latexmk -pdf -shell-escape -interaction=nonstopmode -halt-on-error main.tex
```

The included `main.bbl` preserves the generated bibliography, and
`bibliography.bib` contains its BibTeX source.

## Regenerate the figures

Install the Python dependencies and run the three scripts:

```bash
python3 -m pip install -r requirements.txt
python3 figures/fig1_affect_space.py
python3 figures/fig2_relative_trajectory.py
python3 figures/fig3_pilot_evidence.py
```

Vector figures, plotting code, the shared palette, the frozen catalog snapshot
used by the plotting code, and the retained result tables are included.
`RESULTS_PROVENANCE.md` documents the evidence and reconstruction boundary.
