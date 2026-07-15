# Deployment

The public source and deployment configuration live on `main`:

- Repository: https://github.com/eybmits/vibe-shuffle
- Website: https://eybmits.github.io/vibe-shuffle/

The generated `dist/` directory is not committed. GitHub Actions tests and
builds the site from `main`, then publishes the build through GitHub Pages.

## Repository variable

Add the public Spotify Client ID as a GitHub Actions repository variable:

```text
VITE_SPOTIFY_CLIENT_ID
```

Do not store a Spotify Client Secret. The frontend uses PKCE and cannot protect
a secret.

## Workflows

- `.github/workflows/ci.yml`: install, test, and build on pushes and pull
  requests.
- `.github/workflows/pages.yml`: test, build, upload the Pages artifact, and
  deploy on every push to `main`.

Configure GitHub Pages with **Source: GitHub Actions**. No deployment branch is
required.

## Local release check

```bash
nvm use
npm ci
npm run check
```

Optional documentation builds:

```bash
npm run paper
npm run flowcharts
```

These require a local TeX installation. The web build does not.

## Verification

After a push:

1. confirm both GitHub Actions workflows completed successfully;
2. open `https://eybmits.github.io/vibe-shuffle/`;
3. verify the served JavaScript asset belongs to the latest deployment;
4. connect an allowlisted Premium account and perform a playback smoke test.

An HTTP 200 proves only that Pages serves the site. It does not validate Spotify
credentials, Premium entitlement, camera permission, or BLE compatibility.
