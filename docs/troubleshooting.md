# Troubleshooting

## Spotify redirect mismatch

For the public site, save this exact URI in the Spotify Developer Dashboard:

```text
https://eybmits.github.io/vibe-shuffle/
```

For local development, use:

```text
http://127.0.0.1:5173/
```

Do not substitute `localhost`, remove the trailing slash, change the port, or
add a query string. The dashboard entry and requested URI must match exactly.

## Spotify 403 or account not approved

The signed-in account must have Premium and must be listed under User Management
for a Development-mode app. Sign out of the app and reconnect after changing the
allowlist.

## Play pressed but no sound

1. Wait for the Spotify player to report connected and ready.
2. Confirm the browser tab is not muted.
3. Confirm Spotify is not actively playing on another device.
4. Reconnect Spotify and press Play again.
5. Check the in-app playback notice.

The trial timer should remain stopped until the SDK confirms that the requested
track is active and unpaused. If the timer advances without audible playback,
record the browser, OS, account tier, and console error as a defect.

## Rating does not open

The prompt opens after 60 seconds of confirmed playback or immediately after
`Rate now`. It requires liking, mood fit, and mood self-report before the next
trial can start.

## Camera unavailable

- Use HTTPS on the public site or the loopback local address.
- Allow camera permission for the site and reload after changing it.
- Close other applications holding the camera.
- Try Chrome or Edge if the browser does not expose a compatible camera API.

The study can run without a camera. Valence then remains 0.5 and the exported
row is flagged accordingly.

## Heart-rate sensor unavailable

- Use Chrome or Edge on a platform with Web Bluetooth.
- Use HTTPS or `http://127.0.0.1`.
- Confirm the sensor exposes the standard `heart_rate` service.
- Disconnect the sensor from other applications before pairing.
- Wear and moisten a chest strap as recommended by its manufacturer.

A BPM-only device cannot provide RMSSD. The app labels this `bpm_only`; the
full HR/RMSSD Arousal mapping remains unavailable. Use the built-in mock sensor
only for software testing, never as participant physiology.

## Baseline remains low quality

The 120-second baseline requires valid heart-rate packets and enough accepted RR
intervals. Check contact, reduce movement, and restart calibration. Inspect
accepted/rejected RR counts and artifact rate. The app does not invent HRV when
the device omits RR data.

## GitHub Pages shows an old version

Open the repository Actions page and verify the latest `Deploy GitHub Pages`
run completed. Then hard-refresh or use a private browser window. Deployment is
built from `main`; there is no manually maintained `gh-pages` branch.

## Build fails

Use Node 20 and install from the committed lockfile:

```bash
nvm use
rm -rf node_modules
npm ci
npm run check
```

Do not delete `package-lock.json` or replace `npm ci` with an unreviewed
dependency update when reproducing the submitted version.
