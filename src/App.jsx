import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Download,
  Gauge,
  HeartPulse,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SkipForward,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Waves,
} from "lucide-react";

const SONGS = [
  {
    id: "glass-tide",
    title: "Glass Tide",
    artist: "Mira Vale",
    mood: "calm",
    valence: 0.66,
    energy: 0.24,
    accent: "#0ea5e9",
    palette: ["#e0f2fe", "#67e8f9", "#0f766e"],
    code: "VT-01",
  },
  {
    id: "night-logic",
    title: "Night Logic",
    artist: "Kaito North",
    mood: "calm",
    valence: 0.62,
    energy: 0.38,
    accent: "#f59e0b",
    palette: ["#fff7ed", "#fed7aa", "#f59e0b"],
    code: "FS-04",
  },
  {
    id: "pulse-lane",
    title: "Pulse Lane",
    artist: "Neon Harbor",
    mood: "energetic",
    valence: 0.83,
    energy: 0.86,
    accent: "#22c55e",
    palette: ["#dcfce7", "#86efac", "#16a34a"],
    code: "EN-08",
  },
  {
    id: "after-rain",
    title: "After Rain",
    artist: "Lena Iris",
    mood: "melancholic",
    valence: 0.34,
    energy: 0.34,
    accent: "#818cf8",
    palette: ["#eef2ff", "#c7d2fe", "#6366f1"],
    code: "ML-02",
  },
  {
    id: "sun-cut",
    title: "Sun Cut",
    artist: "River Finch",
    mood: "energetic",
    valence: 0.9,
    energy: 0.62,
    accent: "#fb923c",
    palette: ["#fff7ed", "#fdba74", "#ea580c"],
    code: "HP-06",
  },
  {
    id: "low-orbit",
    title: "Low Orbit",
    artist: "Studio Sable",
    mood: "calm",
    valence: 0.52,
    energy: 0.18,
    accent: "#14b8a6",
    palette: ["#f0fdfa", "#99f6e4", "#0f766e"],
    code: "CL-03",
  },
  {
    id: "metro-kinetic",
    title: "Metro Kinetic",
    artist: "Signal House",
    mood: "energetic",
    valence: 0.7,
    energy: 0.78,
    accent: "#d946ef",
    palette: ["#fdf4ff", "#f0abfc", "#a21caf"],
    code: "EN-11",
  },
  {
    id: "steady-room",
    title: "Steady Room",
    artist: "Arden Cole",
    mood: "calm",
    valence: 0.61,
    energy: 0.42,
    accent: "#38bdf8",
    palette: ["#eff6ff", "#93c5fd", "#2563eb"],
    code: "FS-09",
  },
  {
    id: "soft-reset",
    title: "Soft Reset",
    artist: "Celia Drum",
    mood: "stressed",
    valence: 0.32,
    energy: 0.76,
    accent: "#a855f7",
    palette: ["#faf5ff", "#d8b4fe", "#7e22ce"],
    code: "SR-05",
  },
];

const PROTOCOL_BLOCKS = [
  {
    mode: "random",
    label: "Random Shuffle",
    icon: Shuffle,
    description: "Control block: tracks are selected without mood matching.",
  },
  {
    mode: "vibe",
    label: "Vibe Shuffle",
    icon: Sparkles,
    description: "Adaptive block: tracks are selected from the current Valence x Energy state.",
  },
];

const TRACKS_PER_BLOCK = 5;
const LISTENING_WINDOW_SECONDS = 18;

const RATING_LABELS = {
  1: "Not at all",
  2: "Slightly",
  3: "Good match",
  4: "Very good",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const EMOTION_QUADRANTS = {
  calm: {
    label: "Calm",
    tag: "calm",
    accent: "#0ea5e9",
    description: "Positive valence, low energy",
  },
  energetic: {
    label: "Energetic",
    tag: "energetic",
    accent: "#22c55e",
    description: "Positive valence, high energy",
  },
  stressed: {
    label: "Stressed",
    tag: "stressed",
    accent: "#fb7185",
    description: "Low valence, high energy",
  },
  melancholic: {
    label: "Melancholic",
    tag: "melancholic",
    accent: "#818cf8",
    description: "Low valence, low energy",
  },
};

function emotionFromAxes(valence, energy) {
  if (valence >= 0.5 && energy >= 0.5) return EMOTION_QUADRANTS.energetic;
  if (valence >= 0.5 && energy < 0.5) return EMOTION_QUADRANTS.calm;
  if (valence < 0.5 && energy >= 0.5) return EMOTION_QUADRANTS.stressed;
  return EMOTION_QUADRANTS.melancholic;
}

function inferMood(hr, hrv) {
  const normalizedHr = clamp((hr - 58) / 46, 0, 1);
  const normalizedHrv = clamp((hrv - 28) / 63, 0, 1);
  const energy = clamp(normalizedHr * 0.72 + (1 - normalizedHrv) * 0.28, 0, 1);
  const valence = clamp(normalizedHrv * 0.78 + (1 - Math.abs(normalizedHr - 0.38) * 1.25) * 0.22, 0, 1);
  const emotion = emotionFromAxes(valence, energy);

  return {
    ...emotion,
    valence,
    energy,
  };
}

function wavePath(phase, heartRate, hrv) {
  const points = [];
  const width = 420;
  const height = 118;
  const heartPulse = clamp((heartRate - 58) / 47, 0.18, 1);
  const variability = clamp(hrv / 90, 0.34, 1);

  for (let i = 0; i <= 70; i += 1) {
    const x = (i / 70) * width;
    const rhythm = Math.sin(i * 0.52 + phase) * 15 * heartPulse;
    const recovery = Math.sin(i * 0.16 + phase * 0.55) * 18 * variability;
    const micro = Math.sin(i * 1.45 + phase * 1.4) * 4;
    const y = height / 2 + rhythm + recovery + micro;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return points.join(" ");
}

function deterministicScore(id, seed) {
  let hash = seed * 97;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  }
  return hash / 9973;
}

function rankSongs(songs, mode, mood, currentSongId, seed, recentIds) {
  return songs
    .filter((song) => song.id !== currentSongId)
    .map((song) => {
      const recentPenalty = recentIds.includes(song.id) ? 0.14 : 0;
      const distance = Math.hypot(song.valence - mood.valence, song.energy - mood.energy);
      const tagBonus = song.mood === mood.tag ? -0.18 : 0;
      const randomScore = deterministicScore(song.id, seed);
      const vibeScore = distance + tagBonus + recentPenalty + randomScore * 0.035;

      return {
        ...song,
        score: mode === "vibe" ? vibeScore : randomScore + recentPenalty,
        fit: Math.round(clamp(1 - distance, 0, 1) * 100),
      };
    })
    .sort((a, b) => a.score - b.score);
}

function createProtocolId() {
  const compactTimestamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replaceAll("T", "")
    .replaceAll("Z", "")
    .slice(0, 14);

  return `VS-${compactTimestamp}`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function ratingsToCsv(ratings) {
  const columns = [
    "protocol_id",
    "timestamp",
    "block_number",
    "block_mode",
    "track_number",
    "song_id",
    "song_title",
    "artist",
    "song_mood",
    "song_valence",
    "song_energy",
    "detected_mood",
    "detected_mood_tag",
    "detected_valence",
    "detected_energy",
    "heart_rate_bpm",
    "hrv_ms",
    "rating_1_to_4",
  ];

  const rows = ratings.map((rating) =>
    columns.map((column) => csvEscape(rating[column])).join(","),
  );

  return [columns.join(","), ...rows].join("\n");
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  return `0:${String(safeSeconds).padStart(2, "0")}`;
}

function downloadCsv(ratings, protocolId) {
  if (!ratings.length) return;

  const blob = new Blob([ratingsToCsv(ratings)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${protocolId}_vibe_shuffle_validation.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      <Icon className="size-4 text-teal-600" />
      {children}
    </div>
  );
}

function StatChip({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <Icon className="size-4 text-slate-400" />
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{detail}</div>
    </div>
  );
}

function MoodMap({ mood }) {
  const x = clamp(mood.valence * 100, 8, 92);
  const y = clamp(100 - mood.energy * 100, 8, 92);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,113,113,0.12),rgba(20,184,166,0.14)),linear-gradient(0deg,rgba(148,163,184,0.08),rgba(250,204,21,0.18))]" />
      <div className="absolute inset-5 rounded-lg border border-slate-200/70" />
      <div className="absolute left-5 right-5 top-1/2 h-px bg-slate-300/60" />
      <div className="absolute bottom-5 top-5 left-1/2 w-px bg-slate-300/60" />
      <div
        className="absolute size-5 rounded-full border-[3px] border-white shadow-[0_10px_32px_rgba(15,23,42,0.24)] transition-all duration-700"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          background: mood.accent,
          transform: "translate(-50%, -50%)",
        }}
      />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        High energy
      </span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Low energy
      </span>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Low valence
      </span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        High valence
      </span>
    </div>
  );
}

function SignalWave({ phase, hr, hrv, accent }) {
  const mainPath = wavePath(phase, hr, hrv);
  const shadowPath = wavePath(phase + 0.9, hr - 5, hrv + 9);

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(20,184,166,0.08),transparent)] opacity-70 animate-sweep" />
      <svg className="relative h-28 w-full" viewBox="0 0 420 118" role="img">
        <defs>
          <linearGradient id="signal-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="52%" stopColor={accent} />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
        <path
          d={shadowPath}
          fill="none"
          stroke="rgba(148, 163, 184, 0.24)"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d={mainPath}
          fill="none"
          stroke="url(#signal-gradient)"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
}

function CoverArt({ song, isPlaying }) {
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg border border-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
      style={{
        background: `linear-gradient(135deg, ${song.palette[0]} 0%, ${song.palette[1]} 52%, ${song.palette[2]} 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.78),transparent_34%),linear-gradient(120deg,rgba(255,255,255,0.28),transparent_44%,rgba(15,23,42,0.18))]" />
      <div className="absolute -left-1/4 top-0 h-full w-2/3 rotate-12 bg-white/30 blur-2xl animate-sweep" />
      <div className="absolute inset-x-8 top-10 h-px bg-white/70" />
      <div className="absolute bottom-8 left-8 right-8">
        <div className="mb-5 flex items-end gap-2">
          {[42, 68, 52, 82, 38, 72, 56].map((height, index) => (
            <span
              className="w-full rounded-full bg-white/75 shadow-sm"
              key={`${song.id}-${height}`}
              style={{
                height: `${height}px`,
                opacity: isPlaying ? 0.96 : 0.52,
                animation: isPlaying
                  ? `soft-pulse ${2.2 + index * 0.16}s ease-in-out infinite`
                  : "none",
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/60 pt-4 text-white">
          <span className="text-xs font-bold uppercase tracking-[0.22em]">{song.code}</span>
          <span className="text-xs font-bold uppercase tracking-[0.18em]">{song.mood}</span>
        </div>
      </div>
    </div>
  );
}

function RatingModal({ currentRating, nextButtonLabel, onContinue, onRate, open, song }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section
        aria-modal="true"
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.24)]"
        role="dialog"
      >
        <SectionLabel icon={BarChart3}>Rating required</SectionLabel>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          How well did this song match your mood?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          You just listened to <span className="font-semibold text-slate-700">{song.title}</span>.
          Select one rating to continue.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((score) => {
            const active = currentRating?.rating_1_to_4 === score;

            return (
              <button
                className={`rounded-lg border px-2 py-3 text-center transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
                key={score}
                onClick={() => onRate(score)}
                type="button"
              >
                <span className="block text-xl font-bold">{score}</span>
                <span className="mt-1 block text-xs font-semibold leading-tight">
                  {RATING_LABELS[score]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">1 = not at all, 4 = very good mood match.</p>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentRating}
            onClick={onContinue}
            type="button"
          >
            {nextButtonLabel}
            <SkipForward className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [signals, setSignals] = useState({ hr: 76, hrv: 61, phase: 0, tick: 0 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [protocolId, setProtocolId] = useState(() => createProtocolId());
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(SONGS[1]);
  const [history, setHistory] = useState([]);
  const [queueSeed, setQueueSeed] = useState(24);
  const [trialId, setTrialId] = useState(1);
  const [ratings, setRatings] = useState([]);
  const [protocolComplete, setProtocolComplete] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [ratingPromptOpen, setRatingPromptOpen] = useState(false);

  const mode = PROTOCOL_BLOCKS[currentBlockIndex].mode;
  const mood = useMemo(() => inferMood(signals.hr, signals.hrv), [signals.hr, signals.hrv]);
  const recentIds = useMemo(() => history.slice(-5).map((song) => song.id), [history]);
  const queue = useMemo(
    () => rankSongs(SONGS, mode, mood, currentSong.id, queueSeed, recentIds).slice(0, 4),
    [currentSong.id, mode, mood.energy, mood.tag, mood.valence, queueSeed, recentIds],
  );
  const currentRating = ratings.find((rating) => rating.trial_id === trialId);
  const totalTrials = PROTOCOL_BLOCKS.length * TRACKS_PER_BLOCK;
  const completedTrials = ratings.length;
  const progressPercent = Math.round((completedTrials / totalTrials) * 100);
  const remainingSeconds =
    LISTENING_WINDOW_SECONDS * (1 - Math.min(trackProgress, 100) / 100);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSignals((current) => {
        const nextTick = current.tick + 1;
        const drift = Math.sin(nextTick / 8) * 8 + Math.sin(nextTick / 21) * 5;
        const hrTarget = 75 + drift;
        const hrvTarget = 62 - drift * 1.2 + Math.cos(nextTick / 12) * 6;

        return {
          tick: nextTick,
          phase: current.phase + 0.38,
          hr: clamp(
            current.hr + (hrTarget - current.hr) * 0.22 + (Math.random() - 0.5) * 2.8,
            58,
            104,
          ),
          hrv: clamp(
            current.hrv + (hrvTarget - current.hrv) * 0.2 + (Math.random() - 0.5) * 3.4,
            28,
            91,
          ),
        };
      });
    }, 1200);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isPlaying || protocolComplete || ratingPromptOpen || currentRating) return undefined;

    const id = window.setInterval(() => {
      setTrackProgress((value) => {
        const nextValue = Math.min(value + 100 / (LISTENING_WINDOW_SECONDS * 4), 100);

        if (nextValue >= 100) {
          window.setTimeout(() => {
            setIsPlaying(false);
            setRatingPromptOpen(true);
          }, 0);
        }

        return nextValue;
      });
    }, 250);

    return () => window.clearInterval(id);
  }, [currentRating, isPlaying, protocolComplete, ratingPromptOpen]);

  function moveToSong(song) {
    setHistory((items) => [...items.slice(-8), currentSong]);
    setCurrentSong(song);
    setTrialId((value) => value + 1);
    setQueueSeed((value) => value + 19);
    setTrackProgress(0);
    setRatingPromptOpen(false);
    setIsPlaying(true);
  }

  function advanceProtocol() {
    if (!currentRating || protocolComplete) return;

    const nextSong = queue[0] ?? SONGS[0];
    const isLastTrackInBlock = currentTrackIndex === TRACKS_PER_BLOCK - 1;
    const isLastBlock = currentBlockIndex === PROTOCOL_BLOCKS.length - 1;

    if (isLastTrackInBlock && isLastBlock) {
      setProtocolComplete(true);
      setRatingPromptOpen(false);
      setIsPlaying(false);
      window.setTimeout(() => downloadCsv(ratings, protocolId), 0);
      return;
    }

    if (isLastTrackInBlock) {
      const nextBlock = PROTOCOL_BLOCKS[currentBlockIndex + 1];
      const transitionQueue = rankSongs(
        SONGS,
        nextBlock.mode,
        mood,
        currentSong.id,
        queueSeed + 31,
        recentIds,
      );

      setCurrentBlockIndex((value) => value + 1);
      setCurrentTrackIndex(0);
      setQueueSeed((value) => value + 31);
      moveToSong(transitionQueue[0] ?? nextSong);
      return;
    }

    setCurrentTrackIndex((value) => value + 1);
    moveToSong(nextSong);
  }

  function rateCurrentSong(score) {
    if (protocolComplete || !ratingPromptOpen) return;

    setRatings((items) => {
      const nextRating = {
        protocol_id: protocolId,
        trial_id: trialId,
        timestamp: new Date().toISOString(),
        block_number: currentBlockIndex + 1,
        block_mode: mode,
        mode,
        track_number: currentTrackIndex + 1,
        song_id: currentSong.id,
        song_title: currentSong.title,
        artist: currentSong.artist,
        song_mood: currentSong.mood,
        song_valence: currentSong.valence,
        song_energy: currentSong.energy,
        detected_mood: mood.label,
        detected_mood_tag: mood.tag,
        detected_valence: mood.valence,
        detected_energy: mood.energy,
        heart_rate_bpm: Math.round(signals.hr),
        hrv_ms: Math.round(signals.hrv),
        rating_1_to_4: score,
        score,
      };

      if (items.some((rating) => rating.trial_id === trialId)) {
        return items.map((rating) => (rating.trial_id === trialId ? nextRating : rating));
      }

      return [...items, nextRating];
    });
  }

  function resetProtocol() {
    setProtocolId(createProtocolId());
    setCurrentBlockIndex(0);
    setCurrentTrackIndex(0);
    setCurrentSong(SONGS[1]);
    setHistory([]);
    setQueueSeed(24);
    setTrialId(1);
    setRatings([]);
    setProtocolComplete(false);
    setTrackProgress(0);
    setRatingPromptOpen(false);
    setIsPlaying(true);
  }

  const nextButtonLabel = protocolComplete
    ? "Protocol complete"
    : !currentRating
      ? "Rate to continue"
      : currentBlockIndex === PROTOCOL_BLOCKS.length - 1 &&
          currentTrackIndex === TRACKS_PER_BLOCK - 1
        ? "Finish session"
        : currentTrackIndex === TRACKS_PER_BLOCK - 1
          ? "Continue"
          : "Next song";

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_38%,#eef8f4_68%,#fff8ed_100%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(20,184,166,0.12),rgba(255,255,255,0))]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-lg border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                <Radio className="size-3.5" />
                Listening session
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Vibe Shuffle
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
                Listen to each track and rate how well it fits your current mood.
              </p>
            </div>
            <div className="min-w-56 rounded-lg bg-slate-100 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Session progress</span>
                <span>{completedTrials}/{totalTrials}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.42fr_0.78fr]">
          <section className="overflow-hidden rounded-lg border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionLabel icon={Waves}>Session</SectionLabel>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Stay with the music
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The next step appears automatically when this listening window ends.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Song {completedTrials + 1}/{totalTrials}
              </div>
            </div>

            <div className="grid gap-7 xl:grid-cols-[0.74fr_1fr]">
              <CoverArt isPlaying={isPlaying} song={currentSong} />

              <div className="flex min-h-full flex-col justify-center gap-6">
                <div>
                  <div className="mb-4 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                    Now playing
                  </div>
                  <h3 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    {currentSong.title}
                  </h3>
                  <p className="mt-2 text-lg text-slate-500">{currentSong.artist}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500">
                    <span>Listening window</span>
                    <span>{ratingPromptOpen ? "Ready to rate" : formatSeconds(remainingSeconds)}</span>
                  </div>
                  <div className="mb-5 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${trackProgress}%`,
                        background: `linear-gradient(90deg, ${currentSong.accent}, ${mood.accent})`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      aria-label={isPlaying ? "Pause" : "Play"}
                      className="flex size-16 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition hover:scale-[1.03]"
                      disabled={protocolComplete || ratingPromptOpen}
                      onClick={() => setIsPlaying((value) => !value)}
                      type="button"
                    >
                      {isPlaying ? <Pause className="size-7" /> : <Play className="size-7" />}
                    </button>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                      {ratingPromptOpen ? "Please rate this song" : isPlaying ? "Playing" : "Paused"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <SectionLabel icon={BrainCircuit}>Current Mood</SectionLabel>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {mood.label}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                      {mood.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{mood.description}</p>
                </div>
                <span
                  className="mt-2 size-4 rounded-full shadow-[0_0_24px_currentColor]"
                  style={{ color: mood.accent, background: mood.accent }}
                />
              </div>

              <MoodMap mood={mood} />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <SectionLabel icon={HeartPulse}>Physiological Signals</SectionLabel>
                <span className="text-xs font-medium text-slate-400">simulated live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatChip
                  detail="heart rate"
                  icon={Activity}
                  label="BPM"
                  value={Math.round(signals.hr)}
                />
                <StatChip
                  detail="heart rate variability"
                  icon={Gauge}
                  label="HRV"
                  value={`${Math.round(signals.hrv)} ms`}
                />
              </div>
              <div className="mt-4">
                <SignalWave
                  accent={mood.accent}
                  hr={signals.hr}
                  hrv={signals.hrv}
                  phase={signals.phase}
                />
              </div>
            </section>
          </div>
        </section>

        {protocolComplete ? (
          <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <ShieldCheck className="size-4" />
                  Session complete
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Thank you for rating all songs.
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  The recorded session data is ready to save.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  onClick={() => downloadCsv(ratings, protocolId)}
                  type="button"
                >
                  <Download className="size-4" />
                  Save session data
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={resetProtocol}
                  type="button"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
              </div>
            </div>
          </section>
        ) : null}

      </div>

      <RatingModal
        currentRating={currentRating}
        nextButtonLabel={nextButtonLabel}
        onContinue={advanceProtocol}
        onRate={rateCurrentSong}
        open={ratingPromptOpen}
        song={currentSong}
      />
    </main>
  );
}
