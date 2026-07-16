# Study analysis record

This directory stores the exact aggregate statistics used in the final report.
The source summary contained 15 paired participant/session rows; every row
summarized five Vibe and five Random ratings.

## Analysis unit and outcomes

- Independent unit: participant/session (`N = 15`)
- Primary outcome: mood-fit rating
- Secondary outcome: liking rating
- Difference direction: Vibe minus Random
- Reported uncertainty: two-sided 95% confidence interval
- Directional inference: one-sided paired t-test
- Sensitivity check: one-sided Wilcoxon signed-rank test with zero differences
  removed and average ranks for ties
- Standardized effect: Cohen's paired `d_z`

## Results

| Outcome | Mean difference | 95% CI | t(14) | One-sided p | Wilcoxon W+ | Wilcoxon p | dz |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mood fit | +0.56 | [-0.21, 1.33] | 1.56 | .070 | 74.0 | .088 | 0.40 |
| Liking | +0.09 | [-0.52, 0.71] | 0.32 | .375 | 58.5 | .353 | 0.08 |

The liking signed-rank value in the supplied summary was `W+ = 59`, `p = .341`.
That result rounded tied ranks before the approximation. Conventional average
ranks produce `W+ = 58.5`, `p = .353`; the interpretation is unchanged.

Machine-readable values with additional descriptive and sensitivity statistics
are available in [`statistics.json`](statistics.json).

## Data availability boundary

Participant-level means, trial exports, timestamps, and source filenames are
not published here because the available archive does not document consent for
public individual-level data sharing. This repository therefore supports an
audit of the reported aggregate values and report build, but not a complete
reanalysis from trial-level observations.

If the team confirms that data sharing is permitted, release a separately
reviewed, de-identified table with a data dictionary, exclusion log, license,
and explicit removal of participant labels, filenames, and timestamps.
