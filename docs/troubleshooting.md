# Troubleshooting

## No Audio

- Click `Start session`; browser audio requires a user gesture.
- Check system volume and browser tab mute state.
- If using Spotify playback, confirm Spotify Premium and successful login.
- If using the fallback catalog, confirm the direct MP3 URLs are reachable.

## Rating Does Not Appear

The rating modal appears after the listening window finishes. The current
window is 18 seconds. The next track cannot start until a rating is selected.

## Camera Blocked

- Allow camera permission in the browser.
- Reload the page after changing browser permissions.
- The app can start without camera access; it records a temporary fallback
  expression state until the camera is enabled.

## Spotify Catalog Script Fails

`Missing SPOTIFY_CLIENT_ID` means credentials are not set.

Create an ignored `.env` file or export variables in the shell:

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

If Audio Features mode returns `403`, switch to curated mode:

```bash
SPOTIFY_CATALOG_MODE=curated
SPOTIFY_HAPPY_PLAYLIST_URL=...
SPOTIFY_SAD_PLAYLIST_URL=...
```

## GitHub Pages Shows An Old Build

GitHub Pages and CDN caches can lag behind the latest push. Verify the HTML:

```bash
curl -L https://eybmits.github.io/vibe_shuffle_site/ | grep assets
```

Then hard-refresh the browser.
