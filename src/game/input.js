codex/create-web-project-skeleton-for-rhythm-game-ilfq4m
import { getTimeSec } from "../audio/index.js";
import { judgeHit } from "./judge.js";


codex/create-web-project-skeleton-for-rhythm-game-x1wpp6
import { getTimeSec } from "../audio/index.js";
import { judgeHit } from "./judge.js";


codex/create-web-project-skeleton-for-rhythm-game
import { getTimeSec } from "../audio/index.js";
import { judgeHit } from "./judge.js";

import { getTimeSec } from "../audio";
import { judgeHit } from "./judge";
main

main
main
const KEY_TO_LANE = {
  KeyA: 0,
  KeyS: 1,
  KeyK: 2,
  KeyL: 3,
  a: 0,
  s: 1,
  k: 2,
  l: 3,
};

/**
 * Hooks keyboard listeners that translate key presses into lane hits.
 * @param {(result: { judgement: string; deltaMs: number|null; note: any }|null) => void} onJudgement
 * @returns {() => void} cleanup function
 */
export function initInput(onJudgement) {
  const handleKeyDown = (event) => {
    if (event.repeat) {
      return;
    }

    const lane = KEY_TO_LANE[event.code] ?? KEY_TO_LANE[event.key];
    if (lane === undefined) {
      return;
    }

    event.preventDefault();
    const nowSec = getTimeSec();
    const result = judgeHit(lane, nowSec);
    if (result) {
      onJudgement?.(result);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}

