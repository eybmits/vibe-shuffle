# Vibe Shuffle

Vibe Shuffle is a one-page React dashboard for a blinded music-recommendation
validation study. It compares a passive Random Shuffle block against a
mood-adaptive Vibe Shuffle block. The current prototype estimates the
participant's expression locally in the browser, reduces it to `happy` or
`sad_low`, and selects the next adaptive track from the corresponding catalog
pool.

Live demo:

https://eybmits.github.io/vibe_shuffle_site/

## What It Does

- Runs a fixed validation protocol: Random Shuffle first, then Vibe Shuffle.
- Keeps the condition hidden from the participant.
- Plays real instrumental fallback tracks immediately, without Spotify setup.
- Supports Spotify catalog generation via curated playlists or Audio Features.
- Uses local MediaPipe Face Landmarker blendshapes for expression detection.
- Requires a 1-4 mood-fit rating after every track.
- Exports session ratings as a CSV file.

## Current Prototype Status

The deployed app is ready for coauthor review as an MVP demo. It currently uses
the bundled real instrumental fallback catalog. The Spotify import path is
implemented, but a real Spotify catalog has not been generated because Spotify
credentials and playlist URLs are intentionally not committed.

The camera detector is expression detection, not identity recognition. Camera
frames stay in the browser and are not stored in the exported CSV.

## Quick Start

```bash
npm install --cache ./.npm-cache
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
```

Optional checks:

```bash
npm audit --omit=dev
npm run check:catalog-script
```

## Spotify Catalog Modes

The app reads a static catalog from `src/data/spotifyCatalog.json`.

### Curated Playlist Mode

Use this mode when Spotify Audio Features are unavailable. Spotify provides
metadata, cover art, track URIs, and playback identifiers; the category comes
from the playlist you choose.

```bash
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
SPOTIFY_CATALOG_MODE="curated" \
SPOTIFY_HAPPY_PLAYLIST_URL="https://open.spotify.com/playlist/..." \
SPOTIFY_SAD_PLAYLIST_URL="https://open.spotify.com/playlist/..." \
npm run spotify:catalog
```

Optional four-quadrant curated inputs:

```bash
SPOTIFY_RELAXED_PLAYLIST_URL="https://open.spotify.com/playlist/..."
SPOTIFY_TENSE_PLAYLIST_URL="https://open.spotify.com/playlist/..."
```

### Audio Features Mode

Use this mode only if the Spotify app still has access to the deprecated Audio
Features endpoint.

```bash
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
SPOTIFY_CATALOG_MODE="features" \
SPOTIFY_PLAYLIST_URL="https://open.spotify.com/playlist/..." \
npm run spotify:catalog
```

The generated files are:

- `src/data/spotifyCatalog.json`
- `data/spotify_catalog.csv`

## Runtime Spotify Playback

Full Spotify playback in the browser uses Authorization Code with PKCE and the
Spotify Web Playback SDK. It requires a Spotify Premium account.

```bash
VITE_SPOTIFY_CLIENT_ID="..."
VITE_SPOTIFY_REDIRECT_URI="http://localhost:5173/"
```

The redirect URI must also be registered in the Spotify Developer Dashboard.

## Documentation

- [Architecture](docs/architecture.md)
- [Experiment protocol](docs/experiment_protocol.md)
- [Spotify setup](docs/spotify_setup.md)
- [Deployment](docs/deployment.md)
- [Privacy and limitations](docs/privacy_and_limitations.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

MIT. See [LICENSE](LICENSE).
