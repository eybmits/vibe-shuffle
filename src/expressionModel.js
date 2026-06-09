export const FACE_SAMPLE_INTERVAL_MS = 120;
export const FACE_EMA_ALPHA = 0.34;
export const HAPPY_MIN_SCORE = 0.24;
export const SAD_MIN_SCORE = 0.24;
export const TENSE_MIN_SCORE = 0.32;
export const EXPRESSION_SWITCH_MARGIN = 0.1;
export const MIN_SUSTAINED_SAMPLES = 3;
export const SAD_FAST_SWITCH_SCORE = 0.42;
export const SAD_FAST_SWITCH_SAMPLES = 2;

// Personal neutral baseline: a very slow EMA of the raw expression scores.
// Subtracting it makes small deviations from an individually "resting" face
// count, instead of requiring textbook-strength expressions.
export const BASELINE_EMA_ALPHA = 0.002;
export const BASELINE_DEBIAS_FACTOR = 0.9;

// Head-motion channel ("vibing"): rhythmic vertical nodding reads as positive
// engagement, overall movement raises arousal.
export const MOTION_WINDOW_MS = 3200;
export const NOD_MIN_STEP = 0.0035;
export const NOD_RATE_NORM = 2.2;
export const NOD_AMPLITUDE_NORM = 0.011;
export const MOTION_ENERGY_GAIN = 24;
export const NOD_HAPPY_BOOST = 0.42;

export const EXPRESSION_TAGS = ["happy", "relaxed", "tense", "sad_low"];

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export function expressionScore(categories, name) {
  return categories.find((category) => category.categoryName === name)?.score ?? 0;
}

export function expressionFeatures(categories) {
  const score = (name) => expressionScore(categories, name);
  const average = (...names) => names.reduce((total, name) => total + score(name), 0) / names.length;

  return {
    browDown: average("browDownLeft", "browDownRight"),
    browInnerUp: score("browInnerUp"),
    cheekSquint: average("cheekSquintLeft", "cheekSquintRight"),
    eyeSquint: average("eyeSquintLeft", "eyeSquintRight"),
    eyeWide: average("eyeWideLeft", "eyeWideRight"),
    frown: average("mouthFrownLeft", "mouthFrownRight"),
    jawOpen: score("jawOpen"),
    mouthLowerDown: average("mouthLowerDownLeft", "mouthLowerDownRight"),
    mouthPress: average("mouthPressLeft", "mouthPressRight"),
    mouthPucker: score("mouthPucker"),
    mouthRollLower: score("mouthRollLower"),
    mouthShrugLower: score("mouthShrugLower"),
    mouthStretch: average("mouthStretchLeft", "mouthStretchRight"),
    smile: average("mouthSmileLeft", "mouthSmileRight"),
  };
}

export function initialExpressionScores() {
  return {
    happy: 0,
    relaxed: 1,
    tense: 0,
    sad_low: 0,
  };
}

export function scoreExpressionFeatures(features) {
  const browDown = features.browDown ?? 0;
  const browInnerUp = features.browInnerUp ?? 0;
  const cheekSquint = features.cheekSquint ?? 0;
  const eyeWide = features.eyeWide ?? 0;
  const jawOpen = features.jawOpen ?? 0;
  const mouthPress = features.mouthPress ?? 0;
  const mouthStretch = features.mouthStretch ?? 0;
  const smile = features.smile ?? 0;
  const frown = features.frown ?? 0;
  const mouthLowerDown = features.mouthLowerDown ?? 0;
  const mouthPucker = features.mouthPucker ?? 0;
  const mouthRollLower = features.mouthRollLower ?? 0;
  const mouthShrugLower = features.mouthShrugLower ?? 0;
  const lowSmile = Math.max(0, 0.12 - smile);

  const happy = clamp(
    Math.max(0, smile - 0.08) * 2.55 +
      cheekSquint * 0.75 +
      Math.max(0, smile - frown) * 0.35 -
      frown * 0.55 -
      mouthLowerDown * 0.25,
  );

  const sadMouthCue = Math.max(
    frown * 1.1,
    mouthLowerDown * 1.35,
    mouthRollLower * 1,
    mouthPucker * 0.75,
    mouthShrugLower * 0.75,
  );
  const sadSupport =
    browInnerUp * 0.7 +
    frown * 0.7 +
    mouthLowerDown * 0.6 +
    mouthRollLower * 0.4 +
    mouthShrugLower * 0.4 +
    mouthPucker * 0.25;
  const lowValenceMouthCue =
    lowSmile >= 0.08 &&
    (mouthLowerDown >= 0.035 || mouthRollLower >= 0.035 || mouthPucker >= 0.024) &&
    (browInnerUp >= 0.025 ||
      frown >= 0.02 ||
      mouthShrugLower >= 0.02 ||
      mouthPucker >= 0.02);
  const sadGate =
    smile <= 0.16 &&
    (frown >= 0.055 ||
      lowValenceMouthCue ||
      (sadMouthCue >= 0.055 && sadSupport >= 0.045));
  const sadBase =
    sadMouthCue * 2.4 +
    browInnerUp * 0.35 +
    mouthLowerDown * 0.9 +
    mouthRollLower * 0.45 +
    lowSmile * 0.22 -
    smile * 0.72 -
    cheekSquint * 0.2;
  const sadLow = clamp(sadGate ? sadBase : sadBase * 0.25);

  const tense = clamp(
    browDown * 1.95 +
      mouthPress * 1.55 +
      eyeWide * 0.48 +
      jawOpen * 0.45 +
      mouthStretch * 0.35 -
      smile * 0.42 -
      frown * 0.2,
  );

  const activeMax = Math.max(happy, sadLow, tense);
  const relaxed = clamp(1 - activeMax * 1.35 + Math.max(0, 0.11 - activeMax) * 1.5);

  return {
    happy,
    relaxed,
    tense,
    sad_low: sadLow,
  };
}

export function classifyExpressionScores(
  scores,
  previousTag = "relaxed",
  candidate = { tag: "relaxed", count: 0 },
) {
  const activeScores = [
    ["happy", scores.happy >= HAPPY_MIN_SCORE ? scores.happy : 0],
    ["tense", scores.tense >= TENSE_MIN_SCORE ? scores.tense : 0],
    ["sad_low", scores.sad_low >= SAD_MIN_SCORE ? scores.sad_low : 0],
  ].sort((a, b) => b[1] - a[1]);
  const [topTag, topScore] = activeScores[0];
  const secondScore = activeScores[1]?.[1] ?? 0;
  const proposedTag =
    topScore > 0 && topScore >= secondScore + EXPRESSION_SWITCH_MARGIN ? topTag : "relaxed";

  if (proposedTag === previousTag) {
    return {
      candidate: { tag: proposedTag, count: 0 },
      tag: previousTag,
    };
  }

  const nextCandidate =
    candidate.tag === proposedTag
      ? { tag: proposedTag, count: candidate.count + 1 }
      : { tag: proposedTag, count: 1 };

  const requiredSamples =
    proposedTag === "sad_low" && topScore >= SAD_FAST_SWITCH_SCORE
      ? SAD_FAST_SWITCH_SAMPLES
      : MIN_SUSTAINED_SAMPLES;

  return {
    candidate: nextCandidate,
    tag: nextCandidate.count >= requiredSamples ? proposedTag : previousTag,
  };
}

function dominantWindowTag(scores) {
  const activeScores = [
    ["happy", scores.happy >= HAPPY_MIN_SCORE ? scores.happy : 0],
    ["tense", scores.tense >= TENSE_MIN_SCORE ? scores.tense : 0],
    ["sad_low", scores.sad_low >= SAD_MIN_SCORE ? scores.sad_low : 0],
  ].sort((a, b) => b[1] - a[1]);
  const [topTag, topScore] = activeScores[0];

  return topScore > 0 ? topTag : "relaxed";
}

export function expressionStateFromTag(tag, scores, facePresent = true, energy = 0.5) {
  const confidence = clamp(scores[tag] ?? 0);

  if (!facePresent) {
    return {
      confidence: 0,
      energy: 0.5,
      facePresent: false,
      scores,
      tag: "relaxed",
      valence: 0.5,
    };
  }

  if (tag === "happy") {
    return {
      confidence,
      energy,
      facePresent,
      scores,
      tag,
      valence: clamp(0.58 + confidence * 0.36, 0.55, 0.95),
    };
  }

  if (tag === "tense") {
    return {
      confidence,
      energy,
      facePresent,
      scores,
      tag,
      valence: clamp(0.38 - confidence * 0.18, 0.12, 0.45),
    };
  }

  if (tag === "sad_low") {
    return {
      confidence,
      energy,
      facePresent,
      scores,
      tag,
      valence: clamp(0.42 - confidence * 0.28, 0.06, 0.45),
    };
  }

  return {
    confidence,
    energy,
    facePresent,
    scores,
    tag: "relaxed",
    valence: 0.5,
  };
}

export function summarizeHeadMotion(samples) {
  if (samples.length < 4) return { movement: 0, nodding: 0 };

  let speedSum = 0;
  let reversals = 0;
  let reversalAmplitudeSum = 0;
  let lastDirection = 0;

  for (let index = 1; index < samples.length; index += 1) {
    const dx = samples[index].x - samples[index - 1].x;
    const dy = samples[index].y - samples[index - 1].y;
    speedSum += Math.hypot(dx, dy);

    if (Math.abs(dy) >= NOD_MIN_STEP) {
      const direction = Math.sign(dy);
      if (lastDirection && direction !== lastDirection) {
        reversals += 1;
        reversalAmplitudeSum += Math.abs(dy);
      }
      lastDirection = direction;
    }
  }

  const steps = samples.length - 1;
  const seconds = Math.max(0.4, (samples.at(-1).timestamp - samples[0].timestamp) / 1000);
  const movement = clamp((speedSum / steps) * MOTION_ENERGY_GAIN);
  const reversalRate = reversals / seconds;
  const meanAmplitude = reversals ? reversalAmplitudeSum / reversals : 0;
  const nodding = clamp(reversalRate / NOD_RATE_NORM) * clamp(meanAmplitude / NOD_AMPLITUDE_NORM);

  return { movement, nodding: clamp(nodding) };
}

export function createExpressionTrackerState() {
  return {
    baselineScores: { happy: 0, sad_low: 0, tense: 0 },
    candidate: { tag: "relaxed", count: 0 },
    motionSamples: [],
    smoothedScores: initialExpressionScores(),
    tag: "relaxed",
  };
}

function debiasActiveScores(rawScores, baselineScores) {
  const happy = clamp(rawScores.happy - baselineScores.happy * BASELINE_DEBIAS_FACTOR);
  const tense = clamp(rawScores.tense - baselineScores.tense * BASELINE_DEBIAS_FACTOR);
  const sadLow = clamp(rawScores.sad_low - baselineScores.sad_low * BASELINE_DEBIAS_FACTOR);
  const activeMax = Math.max(happy, tense, sadLow);

  return {
    happy,
    relaxed: clamp(1 - activeMax * 1.35 + Math.max(0, 0.11 - activeMax) * 1.5),
    tense,
    sad_low: sadLow,
  };
}

export function updateExpressionTracker(tracker, categories, headPose = null) {
  const features = expressionFeatures(categories);
  const rawScores = scoreExpressionFeatures(features);

  const baselineScores = tracker.baselineScores ?? { happy: 0, sad_low: 0, tense: 0 };
  const nextBaselineScores = {
    happy: baselineScores.happy * (1 - BASELINE_EMA_ALPHA) + rawScores.happy * BASELINE_EMA_ALPHA,
    sad_low:
      baselineScores.sad_low * (1 - BASELINE_EMA_ALPHA) + rawScores.sad_low * BASELINE_EMA_ALPHA,
    tense: baselineScores.tense * (1 - BASELINE_EMA_ALPHA) + rawScores.tense * BASELINE_EMA_ALPHA,
  };
  const debiasedScores = debiasActiveScores(rawScores, baselineScores);

  const now = headPose?.timestamp ?? Date.now();
  const motionSamples = headPose
    ? [...(tracker.motionSamples ?? []), { timestamp: now, x: headPose.x, y: headPose.y }].filter(
        (sample) => now - sample.timestamp <= MOTION_WINDOW_MS,
      )
    : (tracker.motionSamples ?? []);
  const { movement, nodding } = summarizeHeadMotion(motionSamples);

  // Rhythmic nodding while listening reads as positive engagement.
  const boostedScores = {
    ...debiasedScores,
    happy: clamp(debiasedScores.happy + nodding * NOD_HAPPY_BOOST),
  };

  const smoothedScores = Object.fromEntries(
    EXPRESSION_TAGS.map((tag) => [
      tag,
      tracker.smoothedScores[tag] * (1 - FACE_EMA_ALPHA) + boostedScores[tag] * FACE_EMA_ALPHA,
    ]),
  );
  const classification = classifyExpressionScores(
    smoothedScores,
    tracker.tag,
    tracker.candidate,
  );
  const energy = clamp(0.5 + movement * 0.3 + nodding * 0.25, 0.5, 0.95);
  const expression = expressionStateFromTag(classification.tag, smoothedScores, true, energy);

  return {
    expression,
    sample: {
      confidence: expression.confidence,
      energy: expression.energy,
      facePresent: true,
      scores: smoothedScores,
      tag: expression.tag,
      timestamp: now,
      valence: expression.valence,
    },
    status: "ready",
    tracker: {
      ...tracker,
      baselineScores: nextBaselineScores,
      candidate: classification.candidate,
      motionSamples,
      smoothedScores,
      tag: classification.tag,
    },
  };
}

export function summarizeExpressionSamples(samples, fallbackExpression = null) {
  if (!samples.length) {
    const fallbackScores = fallbackExpression?.scores ?? initialExpressionScores();
    const fallbackTag = fallbackExpression?.tag ?? "relaxed";

    return {
      confidence: fallbackExpression?.confidence ?? fallbackScores[fallbackTag] ?? 0,
      energy: fallbackExpression?.energy ?? expressionStateFromTag(fallbackTag, fallbackScores).energy,
      facePresent: Boolean(fallbackExpression?.facePresent),
      mean_happy: fallbackScores.happy ?? 0,
      mean_relaxed: fallbackScores.relaxed ?? 1,
      mean_tense: fallbackScores.tense ?? 0,
      mean_sad_low: fallbackScores.sad_low ?? 0,
      sampleCount: 0,
      tag: fallbackTag,
      valence:
        fallbackExpression?.valence ?? expressionStateFromTag(fallbackTag, fallbackScores).valence,
    };
  }

  const meanScores = Object.fromEntries(
    EXPRESSION_TAGS.map((tag) => [
      tag,
      samples.reduce((total, sample) => total + (sample.scores?.[tag] ?? 0), 0) / samples.length,
    ]),
  );
  const tag = dominantWindowTag(meanScores);
  const meanEnergy =
    samples.reduce((total, sample) => total + (Number(sample.energy) || 0.5), 0) / samples.length;
  const windowState = expressionStateFromTag(
    tag,
    meanScores,
    samples.some((sample) => sample.facePresent),
    clamp(meanEnergy),
  );
  const confidence = windowState.confidence;

  return {
    confidence,
    energy: windowState.energy,
    facePresent: windowState.facePresent,
    mean_happy: meanScores.happy,
    mean_relaxed: meanScores.relaxed,
    mean_tense: meanScores.tense,
    mean_sad_low: meanScores.sad_low,
    sampleCount: samples.length,
    tag,
    valence: windowState.valence,
  };
}
