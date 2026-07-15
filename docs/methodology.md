# Computational Methodology

This document describes the implementation in source-code terms. It separates
measured quantities, custom mappings, quality rules, and known limitations.

## Coordinate system

The listener is represented by `(V, A)`:

- `V`: Valence, from 0 (negative expression evidence) to 1 (positive evidence).
- `A`: Arousal, from 0 (below personal activation baseline) to 1 (above it).

Songs are represented by Spotify-derived `(valence, energy)` values. The system
uses song Energy as the catalog-side counterpart of listener Arousal. Both axes
split at 0.5:

| Quadrant | Rule |
| --- | --- |
| Energetic (`happy`) | `V >= 0.5`, `A >= 0.5` |
| Calm (`relaxed`) | `V >= 0.5`, `A < 0.5` |
| Tense (`tense`) | `V < 0.5`, `A >= 0.5` |
| Melancholic (`sad_low`) | `V < 0.5`, `A < 0.5` |

This is a recommendation coordinate, not an objective emotion label.

## Facial signal and Valence

### Measurement

The camera is sampled at a target interval of 120 ms. MediaPipe Face Landmarker
returns 52 blendshape activations. `expressionFeatures()` reduces the values
used by the prototype to symmetric or single features including `smile`,
`cheekSquint`, `frown`, `browDown`, `browInnerUp`, `mouthPress`, `eyeWide`, and
mouth-shape measures.

MediaPipe does not output Happy, Sad, Tense, or Valence. Those are produced by
the custom rule layer in `scoreExpressionFeatures()`.

### Rule scores

The Happy rule is shown here because it illustrates the mapping:

```text
H = clip[0,1](
      2.55 * max(0, smile - 0.08)
    + 0.75 * cheekSquint
    + 0.35 * max(0, smile - frown)
    - 0.55 * frown
    - 0.25 * mouthLowerDown
)
```

Sad and Tense use the documented features and gates in
`src/expressionModel.js`. Relaxed is the fallback when no active score passes
its threshold. The feature directions are FACS-inspired; the exact weights and
thresholds are heuristic prototype parameters, not coefficients learned from a
labelled affect dataset.

### Baseline and temporal stabilization

- A 14-second camera calibration snapshots the participant's current smoothed
  Happy/Sad/Tense scores as the neutral reference.
- A slow running exponential average continues adapting that reference.
- Ninety percent of the baseline score is subtracted from each active score.
- Per-frame scores use exponential smoothing (`alpha = 0.34`).
- A new discrete tag normally needs three sustained samples and a 0.10 margin.

If no face is detected, Valence is exactly 0.5.

### Valence mapping

For window-mean scores `H`, `S`, and `T`:

```text
V = clip[0.05,0.95](0.5 + 1.05 * (H - 0.55*S - 0.45*T))
```

Visible movement and rhythmic nodding currently add to the Happy score. This is
an explicit exploratory assumption that movement with the music indicates
positive engagement; it is a potential confound and is logged through the
camera-derived Arousal channel.

## Cardiac signal and Arousal

### BLE measurement

`parseHeartRateMeasurement()` implements the Bluetooth Heart Rate Measurement
packet format. It reads BPM and every RR interval present in the notification.
RR is converted from 1/1024-second units to milliseconds.

### RR quality filter

An RR interval is accepted when it is finite, lies in 300-2000 ms, and differs
by no more than 30% from the previous accepted interval. The export records
accepted, rejected, and total counts plus `rr_artifact_rate`.

These are transparent plausibility rules. They cannot distinguish a motion
artifact from a real abrupt rhythm change because the app receives processed RR
intervals rather than a raw ECG waveform.

RMSSD is calculated as:

```text
RMSSD = sqrt(mean((RR[i+1] - RR[i])^2))
```

At least 20 accepted RR intervals are required before HRV can drive the final
physiological Arousal value. The 20-interval threshold is a prototype quality
criterion, not a clinical standard.

### Personal baseline

The sensor baseline lasts 120 seconds. Baseline centers are medians. Personal
spread is the scaled median absolute deviation (MAD), with lower bounds of
4 BPM for HR and 6 ms for RMSSD:

```text
spread = max(1.4826 * median(abs(x - median(x))), floor)
```

The normalized changes are:

```text
z_hr    = (window median HR - baseline median HR) / baseline HR spread
z_rmssd = (baseline median RMSSD - window RMSSD) / baseline RMSSD spread
```

Thus, higher-than-baseline HR and lower-than-baseline RMSSD both produce
positive Arousal evidence. These are robust z-like scores; the method does not
fit a Gaussian distribution.

### Arousal mapping

The deadband/cap function is:

```text
D(z) = 0                                      if abs(z) <= 0.25
D(z) = sign(z) * min(abs(z) - 0.25, 3)       otherwise
```

The implemented physiological Arousal value is:

```text
A_phys = clip[0,1](0.5 + 0.18 * (0.75*D(z_hr) + 0.35*D(z_rmssd)))
```

When RMSSD alone indicates higher Arousal while HR is at or below baseline, its
weight is multiplied by 0.2. This conservative conflict rule prevents a noisy
short RMSSD window from dominating a calm HR signal. SDNN and cardiac coherence
are exported as diagnostics but do not drive Arousal.

The live display uses an 8-second rolling window and may temporarily use HR
alone (`fast_hr`). The saved trial summary uses the full 60-second window and
requires adequate RR quality for `hr_rmssd`.

## Fusion and window average

- Face sets Valence.
- A usable ECG sets the Arousal base.
- Camera movement above its neutral 0.5 level adds upward Arousal.
- Without usable ECG, the camera motion channel supplies upward-only Arousal.
- Without face, Valence is 0.5.
- Without either usable signal, the listener position is `(0.5, 0.5)`.

While music plays, the application appends fused `(V, A)` positions whenever
the live fused signal changes. The final trial position is the arithmetic mean
of all valid positions in that 60-second buffer. Sampling is event-driven rather
than fixed-rate and the mean is not time-weighted; `mood_position_sample_count`
is exported so this limitation can be audited.

## Song selection

All songs heard earlier in the current session, including the current song, are
excluded. Random and Vibe use the same catalog.

- **Random:** sort every remaining track by a deterministic pseudorandom score
  derived from the session seed.
- **Vibe:** keep remaining tracks in the listener's quadrant, then calculate

```text
d(song, listener) = sqrt((song_valence - V)^2 + (song_energy - A)^2)
```

  and select the smallest distance. The session seed is used only to break an
  exact distance tie. If a quadrant is exhausted, Vibe falls back to all
  remaining tracks.

The first track uses the current setup-time signal. Later tracks use the mean
position from the just-finished trial. Selection target, distance, quadrant
match, and source are exported for audit.

## Claim boundary

The system estimates baseline-relative expression and autonomic proxies. It has
no objective emotional ground truth, and its custom constants have not been
validated as an affect classifier. The experimental question is whether this
transparent adaptive policy improves perceived mood fit relative to Random,
not whether it diagnoses a participant's true emotion.
