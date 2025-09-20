 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game
main
main
 main
import { getLatencyMs } from "../audio/index.js";
import { getNotesByLane, hitWindowMs } from "../chart/engine.js";
import { applyJudgement } from "./state.js";

 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

import { getLatencyMs } from "../audio";
import { getNotesByLane, hitWindowMs } from "../chart/engine";
import { applyJudgement } from "./state";
main

main
main
 main
const AUTO_MISS_GRACE_SEC = 0.12;

let notesByLaneCache = [];
let laneCursors = [];

function ensureLaneData() {
  notesByLaneCache = getNotesByLane();
  laneCursors = notesByLaneCache.map(() => 0);
}

function consumeNote(lane, index) {
  laneCursors[lane] = index + 1;
}

function settleNote(note, lane, index, judgement, nowSec, deltaMs, autoMiss = false) {
  if (!note) {
    return;
  }

  note.status = judgement === "miss" ? "miss" : "hit";
  note.judgement = judgement;
  note.autoMiss = autoMiss;
  if (judgement === "miss") {
    note.missTimeSec = nowSec;
    note.hitTimeSec = null;
    note.deltaMs = null;
  } else {
    note.hitTimeSec = nowSec;
    note.missTimeSec = null;
    note.deltaMs = deltaMs ?? 0;
  }

  consumeNote(lane, index);
  applyJudgement({ judgement, deltaMs: deltaMs ?? null });
}

function classifyJudgement(deltaMs) {
  const absDelta = Math.abs(deltaMs);
  if (absDelta <= hitWindowMs.perfect) {
    return "perfect";
  }
  if (absDelta <= hitWindowMs.great) {
    return "great";
  }
  if (absDelta <= hitWindowMs.good) {
    return "good";
  }
  return "miss";
}

/**
 * Resets internal judging cursors. Call this whenever the chart restarts.
 */
export function resetJudging() {
  ensureLaneData();
}

/**
 * Attempts to judge a hit on the provided lane using the current audio clock time.
 * @param {number} lane
 * @param {number} nowSec
 * @returns {{ judgement: "perfect"|"great"|"good"|"miss"; deltaMs: number|null; note: any; timeSec: number }|null}
 */
export function judgeHit(lane, nowSec) {
  if (!notesByLaneCache.length) {
    ensureLaneData();
  }

  const laneNotes = notesByLaneCache[lane];
  if (!laneNotes || laneNotes.length === 0) {
    return null;
  }

  let cursor = laneCursors[lane] ?? 0;
  while (cursor < laneNotes.length && laneNotes[cursor].status !== "pending") {
    cursor += 1;
  }
  laneCursors[lane] = cursor;

  if (cursor >= laneNotes.length) {
    return null;
  }

  const note = laneNotes[cursor];
  const latencyMs = getLatencyMs();
  const deltaMs = (nowSec - note.timeSec) * 1000 - latencyMs;
  const judgement = classifyJudgement(deltaMs);
  settleNote(note, lane, cursor, judgement, nowSec, deltaMs, false);

  return { judgement, deltaMs, note, timeSec: nowSec };
}

/**
 * Marks any notes that have exceeded their hit window as missed.
 * @param {number} nowSec
 * @returns {Array<{ judgement: "miss"; deltaMs: null; note: any; timeSec: number }>}
 */
export function updateAutoMisses(nowSec) {
  if (!notesByLaneCache.length) {
    ensureLaneData();
  }

  const misses = [];
  for (let lane = 0; lane < notesByLaneCache.length; lane += 1) {
    const laneNotes = notesByLaneCache[lane];
    if (!laneNotes || laneNotes.length === 0) {
      laneCursors[lane] = 0;
      continue;
    }

    let cursor = laneCursors[lane] ?? 0;

    while (cursor < laneNotes.length) {
      const note = laneNotes[cursor];
      if (note.status !== "pending") {
        cursor += 1;
        continue;
      }

      if (nowSec > note.timeSec + AUTO_MISS_GRACE_SEC) {
        settleNote(note, lane, cursor, "miss", nowSec, null, true);
        misses.push({ judgement: "miss", deltaMs: null, note, timeSec: nowSec });
        cursor = laneCursors[lane];
        continue;
      }

      break;
    }

    laneCursors[lane] = cursor;
  }

  return misses;
}

