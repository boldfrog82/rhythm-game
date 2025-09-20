import "./styles/main.css";
import {
  load,
  start,
  pause,
  stop,
  getTimeSec,
  isRunning,
  getLatencyMs,
} from "./audio";
import { startLatencyCalibration } from "./latency/calibrate";
import { createCanvasRenderer } from "./ui/canvas";
import { createHud } from "./ui/hud";
import { initInput } from "./game/input";
import {
  loadChart,
  getLaneCount,
  getNotes,
  resetChartState,
} from "./chart/engine";
import { resetState, getStateSnapshot } from "./game/state";
import { resetJudging, updateAutoMisses } from "./game/judge";

const app = document.querySelector("#app");

let hud = null;
let canvasRenderer = null;
let cleanupInput = null;
let calibrationSession = null;

function updateHudStats() {
  hud.updateStats(getStateSnapshot());
}

function resetGameState() {
  resetChartState();
  resetJudging();
  resetState();
  canvasRenderer?.reset();
  updateHudStats();
  hud.setJudgementMessage("Press Start to play the demo chart.");
}

function handleJudgement(result) {
  if (!result) {
    return;
  }

  const state = getStateSnapshot();
  hud.updateStats(state);
  const effectTime =
    result.timeSec ?? result.note.hitTimeSec ?? result.note.missTimeSec ?? getTimeSec();
  canvasRenderer.registerHitEffect(result.note.lane, result.judgement, effectTime);
}

async function handleStart() {
  try {
    await start();
    hud.setTransportState(true);
  } catch (error) {
    hud.setJudgementMessage(`Start failed: ${error?.message ?? error}`);
  }
}

function handlePause() {
  pause();
  hud.setTransportState(false);
}

function handleReset() {
  stop();
  hud.setTransportState(false);
  resetGameState();
}

function updateTransportState() {
  hud.setTransportState(isRunning());
}

function handleAutoMisses(nowSec) {
  const misses = updateAutoMisses(nowSec);
  if (misses.length > 0) {
    for (const miss of misses) {
      canvasRenderer.registerHitEffect(miss.note.lane, miss.judgement, miss.timeSec);
    }
    hud.updateStats(getStateSnapshot());
  }
}

function handleTap() {
  if (!calibrationSession) {
    return;
  }

  const recorded = calibrationSession.recordTap();
  hud.setCalibrationStatus(
    `Captured tap ${Math.min(recorded, calibrationSession.tapsRequired)}/${calibrationSession.tapsRequired}`
  );
  if (recorded >= calibrationSession.tapsRequired) {
    hud.setTapLabel("Calculating…");
    hud.setCalibrationActive(false);
  }
}

async function handleCalibrate() {
  if (calibrationSession) {
    return;
  }

  hud.setCalibrateButtonDisabled(true);
  hud.setCalibrateButtonLabel("Preparing…");
  hud.setCalibrationStatus("Preparing metronome…");
  hud.setTapLabel("Tap (Space)");

  try {
    const session = await startLatencyCalibration();
    calibrationSession = session;
    hud.setCalibrationStatus(
      `Tap along with ${session.tapsRequired} ticks (space bar or Tap button).`
    );
    hud.setCalibrateButtonLabel("Calibrating…");
    hud.setCalibrationActive(true);
    session.promise
      .then(({ latencyMs }) => {
        hud.setCalibrationStatus(`Latency saved: ${latencyMs.toFixed(2)} ms`);
        hud.setCalibrateButtonLabel("Latency Calibration");
        hud.setCalibrateButtonDisabled(false);
        hud.setCalibrationActive(false);
        hud.setTapLabel("Tap (Space)");
        calibrationSession = null;
        hud.updateLatency(getLatencyMs());
      })
      .catch((err) => {
        hud.setCalibrationStatus(err?.message ?? "Calibration cancelled.");
        hud.setCalibrateButtonLabel("Latency Calibration");
        hud.setCalibrateButtonDisabled(false);
        hud.setCalibrationActive(false);
        hud.setTapLabel("Tap (Space)");
        calibrationSession = null;
      });
  } catch (error) {
    hud.setCalibrationStatus(`Calibration failed: ${error?.message ?? error}`);
    hud.setCalibrateButtonLabel("Latency Calibration");
    hud.setCalibrateButtonDisabled(false);
    hud.setCalibrationActive(false);
  }
}

function setupSpacebarTap() {
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " ") {
      if (calibrationSession) {
        event.preventDefault();
        handleTap();
      }
    }
  });
}

function gameLoop() {
  const nowSec = getTimeSec();
  handleAutoMisses(nowSec);
  canvasRenderer.draw(nowSec, getNotes());
  requestAnimationFrame(gameLoop);
}

async function bootstrap() {
  if (!app) {
    throw new Error("App container not found");
  }

  hud = createHud({
    onStart: handleStart,
    onPause: handlePause,
    onReset: handleReset,
    onCalibrate: handleCalibrate,
    onTap: handleTap,
  });
  app.innerHTML = "";
  app.appendChild(hud.root);

  await load("/audio/demo.mp3");
  await loadChart();

  canvasRenderer = createCanvasRenderer(hud.canvasHost, getLaneCount());
  canvasRenderer.resize();

  resetGameState();
  hud.updateLatency(getLatencyMs());
  updateTransportState();

  cleanupInput = initInput(handleJudgement);
  setupSpacebarTap();

  requestAnimationFrame(gameLoop);
}

bootstrap().catch((error) => {
  if (hud) {
    hud.setJudgementMessage(`Bootstrap failed: ${error?.message ?? error}`);
  } else if (app) {
    app.textContent = `Bootstrap failed: ${error?.message ?? error}`;
  }
  console.error(error);
});

window.addEventListener("beforeunload", () => {
  cleanupInput?.();
});

