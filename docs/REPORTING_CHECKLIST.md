# Physiological-computing reporting checklist

This checklist records what the current repository and study archive establish,
what the final report documents, and what the project team must still confirm.
It is informed by the supplied heart-rate, HCI brain-signal, and proxy-based
sensing reporting standards.

Primary references:

- Quigley et al. (2024), [heart-rate and HRV publication guidelines](https://doi.org/10.1111/psyp.14604)
- Putze et al. (2022), [HCI experiment reporting with brain signals](https://doi.org/10.1145/3490554)
- Fiedler et al. (2020), [proxy-based sensing reporting guidance](https://doi.org/10.31234/osf.io/f6qcy)

## Status table

| Reporting item | Status | Current documentation or required action |
| --- | --- | --- |
| Research question and intended construct | Documented | Recommendation utility is evaluated through participant-rated mood fit; no objective emotion claim. |
| Observable signals versus inferred state | Documented | Camera blendshapes/movement and device-produced BPM/RR are separated from derived Valence–Arousal estimates. |
| Sensor brand, model, modality, and placement | Missing | Confirm the exact wearable, ECG-versus-PPG derivation, placement/contact, and vendor processing. |
| Camera, browser, display, audio, and room setup | Missing | Recover the webcam/computer, browser version, headphones or speakers, volume policy, room conditions, and collection location. |
| Sampling, windows, and baselines | Documented | Approx. 120 ms face target, 14 s facial calibration, 120 s cardiac baseline, 8 s live cardiac window, and up to 60 s per trial. |
| RR artifact handling | Documented | 300–2,000 ms range, >30% successive-change rejection, no interpolation, and minimum 20 accepted intervals. |
| Signal loss and fallback counts | Not available in summary | Preserve raw trial exports and report artifact rates, missing periods, sensor fallbacks, and exclusions by condition. |
| HRV interpretation and respiration | Documented limitation | RMSSD is secondary baseline-relative evidence; respiration was not recorded and no RSA/vagal claim is made. |
| Facial mapping and validation | Documented limitation | Rules and constants are empirical and were not validated against labelled affect data. |
| Adaptation decision logic | Documented | Matching quadrant followed by nearest unplayed song; Random uses a deterministic seeded ranking. |
| Stimuli and exposure | Documented | Frozen 100-track catalog, five tracks per block, up to 60 s, and early rating recorded. |
| Counterbalancing and blinding | Documented | Two block orders and participant-facing label masking; not double blind. |
| Recruitment and participant flow | Missing | Confirm recruitment channel, compensation, inclusion/exclusion criteria, withdrawals, and whether all 15 sessions are unique participants. |
| Demographics and physiological covariates | Missing | Report what was collected for age, gender/sex, health, medication, activity, caffeine, nicotine, alcohol, and fitness. Do not reconstruct absent data. |
| Consent and ethics review | Missing | Add the consent procedure and ethics-review or exemption status from the team's records. |
| Analysis unit and statistical method | Documented | N = 15 paired participant/session means; confidence intervals, directional paired t-tests, Wilcoxon sensitivity checks, and paired effects. |
| Trial-level data availability | Restricted pending confirmation | Aggregate statistics and de-identified plots are public; individual exports require a consent/anonymization decision. |
| Code and report availability | Documented | Application source, report source, aggregate statistics, and final PDF are in this repository. |
| Contribution statement | Requires author confirmation | The current statement reflects verifiable repository evidence but the exact division of work must be confirmed by all three authors. |

## Required pre-submission confirmations

1. Confirm the contribution split among Markus Baumann, Felix Hajuj, and Miriam
   Janner.
2. Add recruitment, demographics, compensation, inclusion/exclusion criteria,
   consent, and ethics-review information where records exist.
3. Add the exact heart sensor, sensing modality, placement/contact, webcam,
   playback setup, and room conditions.
4. Verify that the three source labels beginning with `P1` represent distinct
   people rather than repeated sessions from one participant.
5. State whether every inference constant and threshold was fixed before the
   15-participant study; label any post-result tuning as exploratory.

Missing information should remain explicitly marked as unavailable rather than
being filled with plausible but unverified details.
