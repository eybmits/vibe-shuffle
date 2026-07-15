# Spotify Setup

Spotify provides licensed full-track playback through the Web Playback SDK. The
application does not download audio, read the participant's library, or request
Audio Features at runtime.

## Requirements

- Spotify Premium for every playback account.
- A Spotify Developer application.
- Every test account added under User Management while the app is in
  Development mode.
- Chrome, Edge, or another browser supported by the Web Playback SDK.

Spotify currently limits Development mode to five allowlisted users. Check the
[current quota-mode documentation](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
before planning a larger deployment.

## Developer application

Create an application in the
[Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and
enable the Web API and Web Playback SDK.

Add these exact redirect URIs:

```text
https://eybmits.github.io/vibe-shuffle/
http://127.0.0.1:5173/
```

The scheme, host, port, path, and trailing slash must match the URI sent by the
application. Spotify's current redirect-URI rules do not accept `localhost` as
a new insecure HTTP redirect; use the explicit loopback address `127.0.0.1` for
local development. See Spotify's
[redirect URI rules](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

## Environment

Copy `.env.example` to `.env` and set the public Client ID:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
```

The browser app uses Authorization Code with PKCE. A Client ID is a public app
identifier; a Client Secret is neither required nor safe in frontend code. See
Spotify's [PKCE guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow).

Requested scopes:

```text
streaming
user-read-email
user-read-private
user-read-playback-state
user-modify-playback-state
```

## Playback lifecycle

1. `Connect Spotify` starts PKCE login.
2. Spotify redirects to the exact application URL.
3. The Web Playback SDK creates a browser playback device.
4. The app transfers playback to that device and requests the selected URI.
5. The trial timer starts only after the player confirms the requested track is
   active and not paused.

The player intentionally requires a user Play action. Browser autoplay policy
and Spotify Connect state can otherwise prevent audible playback.

## Common failures

- `redirect_uri: Not matching configuration`: the requested URL is not saved
  exactly for this Client ID.
- `403`: the account is not allowlisted for the Development-mode app.
- Player ready but no audio: confirm Premium, active output device, browser tab
  audio permission, and that Spotify is not playing on another device.
- More than five study accounts: Development mode is not an appropriate
  deployment tier; request extended quota access or revise the playback plan.

The official Web Playback SDK requirements are documented in Spotify's
[Web Playback SDK guide](https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player/).
