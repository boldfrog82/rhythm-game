/**
 * Score awarded for each judgement tier.
 */
const JUDGEMENT_SCORES = {
  perfect: 1000,
  great: 600,
  good: 300,
  miss: 0,
};

/**
 * Accuracy weights used to compute the percentage shown to the player.
 */
const ACCURACY_WEIGHTS = {
  perfect: 1,
  great: 0.8,
  good: 0.5,
  miss: 0,
};

let score = 0;
let combo = 0;
let maxCombo = 0;
let weightedAccuracyTotal = 0;
let judgementTotal = 0;
let lastJudgement = null;
let lastDeltaMs = null;
const judgementCounts = {
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
};

/**
 * Resets all gameplay statistics to their defaults at the start of a run.
 */
export function resetState() {
  score = 0;
  combo = 0;
  maxCombo = 0;
  weightedAccuracyTotal = 0;
  judgementTotal = 0;
  lastJudgement = null;
  lastDeltaMs = null;
  judgementCounts.perfect = 0;
  judgementCounts.great = 0;
  judgementCounts.good = 0;
  judgementCounts.miss = 0;
}

/**
 * Applies the results of a note judgement to the running totals.
 * @param {{ judgement: "perfect"|"great"|"good"|"miss"; deltaMs: number|null }} result
 */
export function applyJudgement(result) {
  const { judgement, deltaMs } = result;
  if (!(judgement in JUDGEMENT_SCORES)) {
    return;
  }

  score += JUDGEMENT_SCORES[judgement];
  judgementCounts[judgement] += 1;
  weightedAccuracyTotal += ACCURACY_WEIGHTS[judgement];
  judgementTotal += 1;

  if (judgement === "miss") {
    combo = 0;
  } else {
    combo += 1;
    if (combo > maxCombo) {
      maxCombo = combo;
    }
  }

  lastJudgement = judgement;
  lastDeltaMs = typeof deltaMs === "number" && Number.isFinite(deltaMs) ? deltaMs : null;
}

/**
 * Provides an immutable snapshot of the player's statistics for UI rendering.
 * @returns {{
 *   score: number,
 *   combo: number,
 *  maxCombo: number,
 *  accuracy: number,
 *  judgementCounts: { perfect: number; great: number; good: number; miss: number },
 *  lastJudgement: string|null,
 *  lastDeltaMs: number|null
 * }}
 */
export function getStateSnapshot() {
  const accuracy = judgementTotal === 0 ? 100 : (weightedAccuracyTotal / judgementTotal) * 100;
  return {
    score,
    combo,
    maxCombo,
    accuracy,
    judgementCounts: { ...judgementCounts },
    lastJudgement,
    lastDeltaMs,
  };
}

