# Privacy And Limitations

## Camera Privacy

Expression detection runs locally in the browser. The app does not upload,
store, or export camera frames.

The app uses [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
blendshapes to estimate expression. This is not identity recognition and should
not be presented as biometric identification, clinical affect diagnosis, or
validated microexpression detection.

## Exported Data

The CSV stores derived experimental data:

- track metadata
- hidden condition label
- detected expression state
- derived Valence/Energy estimates
- expression confidence
- window-average expression scores
- rating

It does not contain images, video, or face landmarks.

## Expression API Scope

The current implementation stays local-only: camera frames do not leave the
browser. Cloud emotion APIs such as
[AWS Rekognition](https://docs.aws.amazon.com/rekognition/latest/dg/faces.html)
are therefore out of scope because they require sending images or frames to an
external service.

[Hume Expression Measurement](https://dev.hume.ai/docs/expression-measurement/overview)
is also not used for this prototype because its legacy API is being sunset, with
the last listed API-use/download date on June 14, 2026. The project keeps
MediaPipe Face Landmarker as the defensible browser-local signal source.

## Spotify Limitations

Spotify Audio Features are deprecated and may be blocked for newer apps. The
curated playlist mode avoids this endpoint, but its categories are human-curated
playlist labels rather than measured Valence/Energy features.

Spotify full-track playback requires Spotify Premium and an authenticated user.

## Jamendo Catalog Limitations

The Jamendo catalog path uses real instrumental tracks and keeps license URLs and
download-permission flags. Valence and Energy are inferred from Jamendo
musicinfo tags, speed labels, and waveform peaks. These annotations are
reproducible and useful for the experiment, but they are still heuristic music
emotion labels rather than externally validated ground truth.

## Scientific Limitations

This is an MVP validation dashboard, not a validated affect-recognition system.
The expression classifier estimates `happy`, `relaxed`, `tense`, and `sad_low`.
It should be treated as an experimental signal source.

The bundled fallback catalog is useful for demos, but the final study should use
the generated Jamendo catalog or another licensed source aligned with the
experimental design.
