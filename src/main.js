import "./styles/main.css";
import "./simple-game.js";

import {
  load as loadAudio,
  start as startAudio,
  pause as pauseAudio,
  stop as stopAudio,
  getTimeSec,
  isRunning,
  getLatencyMs,
} from "./audio/index.js";
import { startLatencyCalibration } from "./latency/calibrate.js";
import {
  loadChart,
  getLaneCount,
  getNotes,
  resetChartState,
} from "./chart/engine.js";
import { createCanvasRenderer } from "./ui/canvas.js";
import { createHud } from "./ui/hud.js";
import { initInput } from "./game/input.js";
import { resetJudging, updateAutoMisses } from "./game/judge.js";
import { resetState, getStateSnapshot } from "./game/state.js";

const AUDIO_URL = "/audio/demo.mp3";

const appRoot = document.querySelector("#app");
if (!appRoot) {
  throw new Error("Expected #app element to mount the main game.");
}

let canvasRenderer = null;
let notes = [];
let animationFrameId = null;
let cleanupInput = null;
let calibrationSession = null;
let audioReady = false;
let lastTransportRunning = false;

const hud = createHud({
  onStart: handleStart,
  onPause: handlePause,
  onReset: handleReset,
  onCalibrate: handleCalibrate,
  onTap: handleCalibrationTap,
});

appRoot.appendChild(hud.root);

function updateStatsDisplay() {
  hud.updateStats(getStateSnapshot());
}

function enableInput() {
  if (!cleanupInput) {
    cleanupInput = initInput(handleJudgement);
  }
}

function disableInput() {
  if (cleanupInput) {
    cleanupInput();
    cleanupInput = null;
  }
}

function ensureAnimationLoop() {
  if (animationFrameId != null) {
    return;
  }

  const step = () => {
    const nowSec = getTimeSec();

    if (canvasRenderer) {
      canvasRenderer.draw(nowSec, notes);
    }

    const running = isRunning();
    if (running) {
      const misses = updateAutoMisses(nowSec);
      if (misses.length && canvasRenderer) {
        for (const miss of misses) {
          canvasRenderer.registerHitEffect(
            miss.note.lane,
            miss.judgement,
            miss.timeSec
          );
        }
        updateStatsDisplay();
      }
    }

    if (running !== lastTransportRunning) {
      if (!running) {
        disableInput();
      }
      lastTransportRunning = running;
    }

    hud.setTransportState(running, nowSec);

    animationFrameId = window.requestAnimationFrame(step);
  };

  animationFrameId = window.requestAnimationFrame(step);
}

function handleJudgement(result) {
  if (!result) {
    return;
  }

  if (canvasRenderer) {
    canvasRenderer.registerHitEffect(result.note.lane, result.judgement, result.timeSec);
  }
  updateStatsDisplay();
}

function resetGame() {
  stopAudio();
  disableInput();
  resetState();
  resetChartState();
  resetJudging();
  notes = getNotes();
  if (canvasRenderer) {
    canvasRenderer.reset();
  }
  const nowSec = getTimeSec();
  hud.setTransportState(false, nowSec);
  hud.setJudgementMessage("Press Start to play the demo chart.");
  hud.updateLatency(getLatencyMs());
  updateStatsDisplay();
  lastTransportRunning = false;
}

async function handleStart() {
  if (!audioReady) {
    hud.setJudgementMessage("Loading audio… please wait.");
    return;
  }

  try {
    await startAudio();
    enableInput();
    hud.setJudgementMessage("Good luck!");
  } catch (error) {
    console.error("Failed to start transport", error);
    hud.setJudgementMessage("Unable to start audio playback.");
  }
}

function handlePause() {
  pauseAudio();
  disableInput();
  const nowSec = getTimeSec();
  hud.setTransportState(false, nowSec);
  hud.setJudgementMessage("Paused");
}

function handleReset() {
  resetGame();
}

const handleCalibrationKeyDown = (event) => {
  if (!calibrationSession) {
    return;
  }
  if (event.code !== "Space" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  handleCalibrationTap();
};

function setCalibrationUiActive(active) {
  hud.setCalibrationActive(active);
  if (active) {
    window.addEventListener("keydown", handleCalibrationKeyDown);
  } else {
    window.removeEventListener("keydown", handleCalibrationKeyDown);
  }
}

function handleCalibrationTap() {
  if (!calibrationSession) {
    return;
  }
  const taps = calibrationSession.recordTap();
  const total = calibrationSession.tapsRequired;
  const clamped = Math.min(taps, total);
  hud.setCalibrationStatus(`Tap in time with the clicks (${clamped}/${total})`);
  hud.setTapLabel(`Tap (Space) ${clamped}/${total}`);
}

async function handleCalibrate() {
  if (calibrationSession) {
    calibrationSession.cancel();
    return;
  }

  hud.setCalibrationStatus("Preparing calibration…");
  hud.setCalibrateButtonDisabled(true);

  try {
    const session = await startLatencyCalibration();
    calibrationSession = session;
    hud.setCalibrateButtonDisabled(false);
    hud.setCalibrateButtonLabel("Cancel Calibration");
    hud.setTapLabel(`Tap (Space) 0/${session.tapsRequired}`);
    hud.setCalibrationStatus(`Tap in time with the clicks (0/${session.tapsRequired})`);
    setCalibrationUiActive(true);

    session.promise
      .then(({ latencyMs }) => {
        hud.setCalibrationStatus(`Latency saved: ${latencyMs.toFixed(2)} ms`);
        hud.updateLatency(latencyMs);
      })
      .catch((error) => {
        if (error?.message === "Calibration cancelled") {
          hud.setCalibrationStatus("Calibration cancelled.");
        } else {
          console.error("Calibration failed", error);
          hud.setCalibrationStatus("Calibration failed. Please try again.");
        }
      })
      .finally(() => {
        calibrationSession = null;
        hud.setCalibrateButtonLabel("Latency Calibration");
        hud.setCalibrateButtonDisabled(false);
        hud.setTapLabel("Tap (Space)");
        setCalibrationUiActive(false);
      });
  } catch (error) {
    console.error("Unable to start calibration", error);
    hud.setCalibrationStatus("Unable to start calibration.");
    hud.setCalibrateButtonDisabled(false);
    setCalibrationUiActive(false);
  }
}

async function bootstrap() {
  hud.setJudgementMessage("Loading demo assets…");
  try {
    await loadChart();
    notes = getNotes();
    canvasRenderer = createCanvasRenderer(hud.canvasHost, getLaneCount());
    canvasRenderer.resize();
    resetJudging();
    resetState();
    updateStatsDisplay();
    hud.updateLatency(getLatencyMs());
    ensureAnimationLoop();

    await loadAudio(AUDIO_URL);
    audioReady = true;
    resetGame();
  } catch (error) {
    console.error("Failed to initialise game", error);
    hud.setJudgementMessage("Failed to load demo assets.");
  }
}

bootstrap();

window.addEventListener("beforeunload", () => {
  disableInput();
  if (calibrationSession) {
    try {
      calibrationSession.cancel();
    } catch (err) {
      // Ignore cancellation errors on unload.
    }
  }
});
