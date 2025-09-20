 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi
import { approachSec } from "../chart/engine.js";


codex/create-web-project-skeleton-for-rhythm-game-ilfq4m
import { approachSec } from "../chart/engine.js";


codex/create-web-project-skeleton-for-rhythm-game-x1wpp6
import { approachSec } from "../chart/engine.js";


codex/create-web-project-skeleton-for-rhythm-game
import { approachSec } from "../chart/engine.js";

import { approachSec } from "../chart/engine";
main

main
main
 main
const HIT_LINE_RATIO = 0.85;
const APPROACH_DISTANCE_RATIO = 0.7;
const NOTE_HEIGHT_RATIO = 0.1;
const PENDING_COLOR = "rgba(97, 218, 251, 0.95)";
const HIT_COLOR = "rgba(144, 238, 144, 0.8)";
const MISS_COLOR = "rgba(255, 99, 132, 0.8)";
const LANE_BACKGROUND = "rgba(12, 18, 44, 0.65)";
const LANE_BORDER = "rgba(255, 255, 255, 0.12)";
const HIT_LINE_COLOR = "rgba(255, 255, 255, 0.4)";
const HIT_EFFECT_DURATION = 0.25;
const MISS_FADE_SEC = 0.4;
const HIT_FADE_SEC = 0.18;

/**
 * @typedef {{
 *  judgement: string;
 *  lane: number;
 *  startTime: number;
 * }} HitEffect
 */

/**
 * Creates and manages the gameplay canvas.
 * @param {HTMLElement} host Element that should contain the canvas.
 * @param {number} laneCount Number of lanes to render.
 */
export function createCanvasRenderer(host, laneCount) {
  const canvas = document.createElement("canvas");
  canvas.id = "game";
  canvas.className = "game-canvas";
  host.appendChild(canvas);

  /** @type {CanvasRenderingContext2D|null} */
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D context for gameplay canvas.");
  }

  let lastWidth = 0;
  let lastHeight = 0;
  let lastDpr = 0;
  let firstVisibleIndex = 0;
  /** @type {HitEffect[]} */
  const hitEffects = [];

  function ensureSize() {
    const cssWidth = host.clientWidth;
    const cssHeight = host.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    if (!cssWidth || !cssHeight) {
      return;
    }

    if (cssWidth !== lastWidth || cssHeight !== lastHeight || dpr !== lastDpr) {
      canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
      canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastWidth = cssWidth;
      lastHeight = cssHeight;
      lastDpr = dpr;
    }
  }

  function drawLaneBackgrounds(width, height) {
    const laneWidth = width / laneCount;
    ctx.fillStyle = LANE_BACKGROUND;
    ctx.strokeStyle = LANE_BORDER;

    for (let lane = 0; lane < laneCount; lane += 1) {
      const x = lane * laneWidth;
      ctx.fillRect(x, 0, laneWidth, height);
      ctx.strokeRect(x + 0.5, 0.5, laneWidth - 1, height - 1);
    }
  }

  function drawHitLine(width, height) {
    const y = height * HIT_LINE_RATIO;
    ctx.strokeStyle = HIT_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  function drawPendingNote(note, width, height, nowSec) {
    const laneWidth = width / laneCount;
    const laneX = laneWidth * note.lane;
    const noteWidth = laneWidth * 0.7;
    const x = laneX + (laneWidth - noteWidth) / 2;
    const travelDistance = height * APPROACH_DISTANCE_RATIO;
    const hitLineY = height * HIT_LINE_RATIO;
    const spawnY = hitLineY - travelDistance;
    const ratio = 1 - (note.timeSec - nowSec) / approachSec;

    const y = spawnY + ratio * travelDistance;
    if (y < spawnY - 20 || y > hitLineY + 40) {
      return;
    }

    const noteHeight = Math.max(12, noteWidth * NOTE_HEIGHT_RATIO * 1.5);
    ctx.fillStyle = PENDING_COLOR;
    ctx.fillRect(x, y - noteHeight / 2, noteWidth, noteHeight);
  }

  function drawResolvedNote(note, width, height, nowSec) {
    const laneWidth = width / laneCount;
    const laneX = laneWidth * note.lane;
    const noteWidth = laneWidth * 0.7;
    const x = laneX + (laneWidth - noteWidth) / 2;
    const hitLineY = height * HIT_LINE_RATIO;
    const baseY = hitLineY;

    if (note.status === "hit") {
      const age = nowSec - (note.hitTimeSec ?? nowSec);
      if (age > HIT_FADE_SEC) {
        return;
      }
      const alpha = 1 - age / HIT_FADE_SEC;
      ctx.fillStyle = `rgba(144, 238, 144, ${alpha.toFixed(3)})`;
      const heightScale = 1 + 0.5 * (1 - alpha);
      const noteHeight = Math.max(12, noteWidth * NOTE_HEIGHT_RATIO * heightScale);
      ctx.fillRect(x, baseY - noteHeight / 2, noteWidth, noteHeight);
      return;
    }

    const age = nowSec - (note.missTimeSec ?? note.timeSec);
    if (age > MISS_FADE_SEC) {
      return;
    }
    const alpha = 1 - age / MISS_FADE_SEC;
    ctx.fillStyle = `rgba(255, 99, 132, ${alpha.toFixed(3)})`;
    const noteHeight = Math.max(12, noteWidth * NOTE_HEIGHT_RATIO * 1.2);
    ctx.fillRect(x, baseY - noteHeight / 2, noteWidth, noteHeight);
  }

  function drawHitEffects(width, height, nowSec) {
    const laneWidth = width / laneCount;
    for (let i = hitEffects.length - 1; i >= 0; i -= 1) {
      const effect = hitEffects[i];
      const elapsed = nowSec - effect.startTime;
      if (elapsed > HIT_EFFECT_DURATION) {
        hitEffects.splice(i, 1);
        continue;
      }

      const intensity = 1 - elapsed / HIT_EFFECT_DURATION;
      const laneCenterX = laneWidth * effect.lane + laneWidth / 2;
      const hitLineY = height * HIT_LINE_RATIO;
      const radius = laneWidth * (0.2 + 0.35 * (1 - intensity));

      let color = HIT_COLOR;
      if (effect.judgement === "great") {
        color = "rgba(173, 216, 230, 0.75)";
      } else if (effect.judgement === "good") {
        color = "rgba(255, 206, 86, 0.75)";
      } else if (effect.judgement === "miss") {
        color = MISS_COLOR;
      }

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.globalAlpha = intensity;
      ctx.arc(laneCenterX, hitLineY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function pruneInvisibleNotes(notes, nowSec) {
    while (
      firstVisibleIndex < notes.length &&
      notes[firstVisibleIndex].timeSec < nowSec - (approachSec + 0.5)
    ) {
      firstVisibleIndex += 1;
    }
  }

  function renderNotes(notes, width, height, nowSec) {
    pruneInvisibleNotes(notes, nowSec);

    for (let i = firstVisibleIndex; i < notes.length; i += 1) {
      const note = notes[i];
      if (note.status === "pending") {
        if (note.timeSec - nowSec > approachSec + 0.5) {
          break;
        }
        drawPendingNote(note, width, height, nowSec);
      } else {
        drawResolvedNote(note, width, height, nowSec);
      }
    }
  }

  function clear(width, height) {
    ctx.clearRect(0, 0, width, height);
  }

  /**
   * Renders the canvas at the provided audio time.
   * @param {number} nowSec
   * @param {Array<any>} notes
   */
  function draw(nowSec, notes) {
    ensureSize();
    if (!canvas.width || !canvas.height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    clear(width, height);
    drawLaneBackgrounds(width, height);
    renderNotes(notes, width, height, nowSec);
    drawHitLine(width, height);
    drawHitEffects(width, height, nowSec);
  }

  /**
   * Records a short-lived hit effect to play back on the canvas.
   * @param {number} lane
   * @param {string} judgement
   * @param {number} nowSec
   */
  function registerHitEffect(lane, judgement, nowSec) {
    hitEffects.push({ lane, judgement, startTime: nowSec });
  }

  function resetView() {
    firstVisibleIndex = 0;
    hitEffects.length = 0;
    ensureSize();
  }

  window.addEventListener("resize", () => {
    lastWidth = 0;
    lastHeight = 0;
  });

  return {
    canvas,
    draw,
    registerHitEffect,
    resize: ensureSize,
    reset: resetView,
  };
}

