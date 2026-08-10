# Pilot result provenance

The repository does not contain raw trial-level study data. It now contains two
small, frozen analysis tables transcribed from user-supplied reports:

- `results/pilot_summary.csv` contains the reported condition summaries,
  paired effects, confidence intervals, and tests.
- `results/participant_means.csv` contains the 15 published session-level
  means used in the paired analysis. The legacy filename is retained for
  compatibility. Identifiers are generic analysis IDs
  (`P01`--`P15`); source filenames are intentionally not included.

The session-level means were transcribed from page 2 of the supplied
two-page PDF *Vibe vs Random: Hypotheses and Results* (SHA-256
`5f7b32b1bb3199d9784e114b1c6029f4199a77297ed0bfdec8eda202f327f278`).
Their rounded means and paired differences match Table 2 and the original
paired-estimation figure in the supplied seven-page PDF *Vibe Shuffle: Testing
Transparent Affect-Adaptive Music Selection* (SHA-256
`336059514d0c8b80fc59687ab8746ab9cc2dc0478b74fd7cc041f3a9e795d7fb`).

The transcribed session-level means are rounded to one decimal place.
They reproduce the reported condition means, paired means, paired t statistics,
and t confidence intervals to rounding. Exact signed-rank results depend on the
unavailable underlying precision and tie convention, so
`results/pilot_summary.csv` preserves the values supplied in the source report.

These published session-level means support the connected pairs,
difference points, and deterministic bootstrap distribution in Figure 3. They
do not restore the underlying ten trial rows per session, sensor-quality
records, recruitment data, or administration logs. Trial-level completeness
and quality checks therefore remain outside the reproducible archive. The
archive also does not identify the code revision used during pilot data
collection; current tests and export-schema fields describe the current
implementation.
