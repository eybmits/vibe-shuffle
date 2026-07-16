# Third-party and licensing notices

The repository root [`LICENSE`](../LICENSE) applies to the Vibe Shuffle software.
The report and its typesetting dependencies have separate provenance.

## Seminar template

The report structure is based on
[`mimuc/seminar-template`](https://github.com/mimuc/seminar-template), commit
`66f41e9fc915a0b866d1567629bc5c138fd47779`. That template repository carries a
CC0 1.0 dedication. The template was adapted for this report's title, authors,
content, bibliography, figures, and precomputed character count.

## ACM class and bibliography style

- `acmart.cls` is the unmodified generated class distributed with the supplied
  seminar template: `acmart` version 2.16, dated 2025-08-27. Its upstream source
  and distribution terms are maintained by the
  [`acmart` project](https://github.com/borisveytsman/acmart).
- `ACM-Reference-Format.bst` identifies Nelson H. F. Beebe, Boris Veytsman, and
  Gerald Murray as its authors and marks the bibliography style as public
  domain in its file header.

These files are included to make `npm run paper` independent of a system-wide
`acmart` installation.

## Report content

`main.tex` declares the compiled report under Creative Commons Attribution-
ShareAlike 4.0. The authors should confirm that this is their intended report
license before the final submission or an immutable GitHub release.
