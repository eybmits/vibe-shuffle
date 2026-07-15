const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export function deterministicScore(id, seed) {
  let hash = seed * 97;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 9973;
  }
  return hash / 9973;
}

export function rankSongs(songs, mode, mood, currentSongId, seed, playedSongIds) {
  const playedIds = new Set(playedSongIds);
  if (currentSongId) playedIds.add(currentSongId);

  const unplayed = songs.filter((song) => !playedIds.has(song.id));
  const available = unplayed.length
    ? unplayed
    : songs.filter((song) => song.id !== currentSongId);

  if (mode !== "vibe") {
    return available
      .map((song) => ({
        ...song,
        fit: null,
        score: deterministicScore(song.id, seed),
      }))
      .sort((left, right) => left.score - right.score);
  }

  const quadrantPool = available.filter((song) => song.quadrant === mood.tag);
  const pool = quadrantPool.length ? quadrantPool : available;

  return pool
    .map((song) => {
      const distance = Math.hypot(song.valence - mood.valence, song.energy - mood.energy);
      return {
        ...song,
        fit: Math.round(clamp(1 - distance) * 100),
        score: distance,
        tieBreaker: deterministicScore(song.id, seed),
      };
    })
    .sort((left, right) => left.score - right.score || left.tieBreaker - right.tieBreaker)
    .map(({ tieBreaker: _tieBreaker, ...song }) => song);
}
