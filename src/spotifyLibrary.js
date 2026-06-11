import { DEMO_TRACKS } from "./demoTracks.js";

// Display labels follow Russell's circumplex naming; the internal tags and
// CSV values (happy/relaxed/tense/sad_low) stay stable for analysis scripts.
export const EMOTION_QUADRANTS = {
  happy: {
    label: "Energetic",
    tag: "happy",
    accent: "#34d399",
    valence: 0.82,
    energy: 0.78,
    description: "High valence, high arousal",
    palette: ["#0f2e25", "#34d399", "#a7f3d0"],
  },
  relaxed: {
    label: "Calm",
    tag: "relaxed",
    accent: "#22d3ee",
    valence: 0.72,
    energy: 0.28,
    description: "High valence, low arousal",
    palette: ["#082635", "#22d3ee", "#a5f3fc"],
  },
  tense: {
    label: "Tense",
    tag: "tense",
    accent: "#fb923c",
    valence: 0.28,
    energy: 0.74,
    description: "Low valence, high arousal",
    palette: ["#33180a", "#fb923c", "#fed7aa"],
  },
  sad_low: {
    label: "Melancholic",
    tag: "sad_low",
    accent: "#a78bfa",
    valence: 0.3,
    energy: 0.26,
    description: "Low valence, low arousal",
    palette: ["#1d1538", "#a78bfa", "#ddd6fe"],
  },
};

export function quadrantFromAxes(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5) return "happy";
  if (valence >= 0.5 && energy < 0.5) return "relaxed";
  if (valence < 0.5 && energy >= 0.5) return "tense";
  return "sad_low";
}

// The fixed curated pool: real Spotify tracks with embedded audio features
// (from src/demoTracks.js), balanced across the four valence/arousal quadrants.
// Needs no Spotify library API — playback uses the connected Web Playback SDK.
export function buildDemoLibrary() {
  return DEMO_TRACKS.map((track) => {
    const quadrant = quadrantFromAxes(track.valence, track.energy);
    const style = EMOTION_QUADRANTS[quadrant];
    return {
      id: `spotify-${track.spotifyId}`,
      spotifyId: track.spotifyId,
      spotifyUri: `spotify:track:${track.spotifyId}`,
      title: track.title,
      artist: track.artist,
      artistNames: [track.artist],
      album: "",
      albumImageUrl: null,
      durationMs: null,
      popularity: track.popularity ?? 0,
      externalUrl: `https://open.spotify.com/track/${track.spotifyId}`,
      valence: track.valence,
      energy: track.energy,
      instrumentalness: track.instrumentalness ?? 0,
      quadrant,
      categorySource: "demo_set",
      accent: style.accent,
      palette: style.palette,
    };
  });
}
