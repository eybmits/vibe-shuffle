# Study Catalog

The experiment uses a frozen catalog of 100 Spotify tracks in
`src/studyCatalog.js`. Spotify is queried for playback, not for classification.

## Source

Track IDs, titles, artists, popularity, Valence, Energy, and Instrumentalness
were taken from the public
[Spotify Tracks Dataset on Kaggle](https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset).
The source dataset is not committed because the runtime needs only the 100
selected records and because the external dataset has its own distribution
terms.

These are historical feature values from the dataset snapshot, not current API
responses. Spotify Audio Features are not requested at runtime.

## Construction

The catalog was assembled once as follows:

1. remove duplicate Spotify track records;
2. prefer well-known, high-popularity tracks;
3. inspect title/artist duplicates and retain one version;
4. assign the quadrant from the dataset's unmodified Valence and Energy values;
5. freeze 25 tracks in each quadrant.

The final catalog is a curated artifact rather than the output of a committed,
fully automatic generator. This distinction matters for reproducibility: the
repository reproduces the exact study catalog, but does not claim that rerunning
an undocumented selection script would recreate the curatorial choices.

No Instrumentalness threshold is applied. The current pool contains mainstream
tracks and is **not an instrumental-only catalog**.

## Quadrant rule

| Internal tag | Listener label | Catalog rule |
| --- | --- | --- |
| `happy` | Energetic | `valence >= 0.5`, `energy >= 0.5` |
| `relaxed` | Calm | `valence >= 0.5`, `energy < 0.5` |
| `tense` | Tense | `valence < 0.5`, `energy >= 0.5` |
| `sad_low` | Melancholic | `valence < 0.5`, `energy < 0.5` |

Song Energy is treated as the catalog-side counterpart of listener Arousal. It
is not a physiological measurement.

## Runtime record

```js
{
  spotifyId: "4LRPiXqCikLlN15c3yImP7",
  title: "As It Was",
  artist: "Harry Styles",
  valence: 0.66,
  energy: 0.73,
  instrumentalness: 0,
  popularity: 95,
}
```

`buildStudyLibrary()` adds the Spotify URI and the derived quadrant. No audio,
album artwork, access token, or participant data is stored in the catalog.

## Integrity check

Run:

```bash
npm run test:catalog
```

The test requires:

- exactly 100 records;
- 100 unique Spotify IDs and title/artist pairs;
- finite Valence and Energy values on `[0,1]`;
- exactly 25 tracks in each quadrant.

Changing a track after data collection changes the experimental stimulus set.
Record such a change as a new catalog version rather than silently replacing an
entry.
