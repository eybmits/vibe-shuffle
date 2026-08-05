# Vibe Shuffle paper package

This folder contains the final paper artifacts:

- `Vibe_Shuffle_Paper.pdf`: rendered seven-page paper.
- `Vibe_Shuffle_main.tex`: primary LaTeX entry file for quick inspection.
- `Vibe_Shuffle_LaTeX_Source.zip`: complete compilation source, including all
  section files, bibliography, vector figures, figure scripts, result tables,
  provenance notes, and the generated bibliography file.
- `SHA256SUMS.txt`: checksums for the three deliverables.
- `SOURCE_README.md`: build instructions embedded in the source archive.

The source archive can be uploaded directly to Overleaf. With TeX Live and the
ACM `acmart` package installed, it can also be compiled locally:

```bash
latexmk -pdf -shell-escape -interaction=nonstopmode -halt-on-error main.tex
```
