# Privacy and Limitations

## Data boundary

Vibe Shuffle has no application backend, analytics integration, remote study
database, or upload endpoint. The application code processes camera frames and
Bluetooth heart-rate notifications in browser memory.

The following external traffic still occurs:

- GitHub Pages serves the application.
- MediaPipe model/WASM assets are downloaded from configured CDNs.
- Spotify handles authentication, playback, and playback-state APIs.

The application does not send raw camera frames, facial landmarks, raw
heart-rate packets, or exported study rows to those services. This statement is
based on the current source architecture; it is not a formal security audit.
Browser extensions, modified builds, and provider-side telemetry are outside
the repository's control.

## Camera

MediaPipe Face Landmarker runs `detectForVideo()` in the page and returns facial
blendshape activations. The custom rule layer derives Happy, Sad, and Tense
display scores and Valence. No image, video, identity embedding, or landmark
coordinate is written to the CSV.

This is expression estimation, not identity recognition, microexpression
measurement, clinical affect diagnosis, or a trained emotion classifier. Face
movement depends on lighting, pose, occlusion, culture, intentional expression,
and individual morphology. Facial display is not emotional ground truth.

The 14-second calibration and slow running baseline make the score relative to
the participant's observed resting display. Consequently, an emotion already
present during calibration can be absorbed into the reference.

## Heart rate and HRV

The optional sensor connects through the Bluetooth Heart Rate Service. The app
receives BPM and, when provided by the device, RR intervals. It does not receive
a raw ECG waveform and therefore cannot independently verify R peaks or
distinguish all movement artifacts from real rhythm changes.

RR intervals outside 300-2000 ms or more than 30% from the previous accepted
interval are rejected. At least 20 accepted RR intervals are required for the
full HR/RMSSD estimate. These are engineering quality rules, not clinical
standards.

The 120-second baseline supplies personal medians and robust MAD-based spread.
Higher relative HR and lower relative RMSSD raise Arousal; the inverse changes
lower it. HR and HRV are affected by posture, respiration, fitness, medication,
illness, movement, and sensor contact. They do not identify a specific emotion
or its Valence.

The live panel uses an 8-second window and may temporarily show HR-only
Arousal. Trial export and Vibe selection summarize the actual listening window,
up to 60 seconds. Short windows make HRV noisy, so results should be interpreted
as exploratory trends rather than clinical autonomic estimates.

## Fusion assumptions

- Facial expression supplies Valence.
- Usable HR/RMSSD supplies the baseline-relative Arousal base.
- Visible movement and rhythmic nodding currently add positive Valence evidence
  and upward Arousal.
- Without a detected face, Valence is 0.5.
- Without usable physiology, motion can raise but not lower Arousal.
- With neither usable channel, the listener position is `(0.5, 0.5)`.

The movement assumption is a potential confound: dancing can indicate enjoyment,
but it can also reflect task behavior, restlessness, or movement unrelated to
music. It is logged as `expression_motion_arousal` and should be ablated in a
future validation study.

## No emotional ground truth

The current system is a transparent rule-based estimator of baseline-relative
signals. It was not trained against self-reported affect and does not establish a
participant's true emotion.

The experimental question is narrower: does this adaptive policy improve the
participant's rating of song-to-mood fit compared with Random? Asking for a mood
before every selection would provide self-report but would also replace the
implicit interaction being tested. A separate model-validation study could pair
many signal windows with validated self-report instruments and train or calibrate
the mapping before testing recommendation performance.

## Exported data

The CSV is created locally only after a participant or experimenter downloads
it. It contains derived expression scores, HR/HRV summaries, song and condition
metadata, ratings, participant number, protocol ID, and timestamps. It contains
no raw media or waveform.

Participant numbers and timestamps make the export pseudonymous, not anonymous.
Store files under an approved study procedure, restrict access, and remove or
transform direct timing information before public release. This source
repository intentionally contains no participant CSV files.

## Music and Spotify

- The fixed catalog improves experimental control but limits generalization.
- The catalog is mainstream and not instrumental-only.
- Song Energy is treated as listener-Arousal compatibility; those constructs
  are related but not identical.
- Dataset features are a historical snapshot and may not match current Spotify
  metadata.
- Tracks can become unavailable by account or market.
- Full-track browser playback requires Spotify Premium and an eligible
  allowlisted account.

## Intended use

Vibe Shuffle is research software for an exploratory HCI validation study. It is
not a medical device, diagnostic system, safety-critical recommender, or
validated general-purpose emotion recognizer.
