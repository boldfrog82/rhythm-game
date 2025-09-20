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
codex/create-web-project-skeleton-for-rhythm-game
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


const app = document.querySelector("#app");

app.innerHTML = `
  <main class="app">
    <header class="app__header">
      <h1>Rhythm Game</h1>
      <p>Web Audio transport driven by the demo tone at <code>/audio/demo.mp3</code>.</p>
    </header>
    <section class="panel panel--transport">
      <h2>Transport</h2>
      <p class="panel__description">
        Control playback using the Web Audio clock. This transport is the single source of truth
        for gameplay timing.
      </p>
      <div class="button-row">
        <button id="startBtn" type="button">Start</button>
        <button id="pauseBtn" type="button">Pause</button>
        <button id="resetBtn" type="button">Reset</button>
      </div>
      <p class="status-line">State: <span id="transportState">loading…</span></p>
      <p class="status-line">Debug clock: <span id="timeReadout">0.000</span> s</p>
    </section>
    <section class="panel panel--latency">
      <h2>Latency calibration</h2>
      <p class="panel__description">
        Tap with the metronome to measure and store your personal input latency so judgment and rendering can compensate.
      </p>
      <div class="button-row">
        <button id="calibrateBtn" type="button">Start calibration</button>
        <button id="tapBtn" type="button" disabled>Tap</button>
      </div>
      <p class="status-line">Saved latency: <span id="latencyReadout">0.00</span> ms</p>
      <p id="calibrationStatus" class="status-message"></p>
    </section>
  </main>
`;

const startButton = app.querySelector("#startBtn");
const pauseButton = app.querySelector("#pauseBtn");
const resetButton = app.querySelector("#resetBtn");
const calibrateButton = app.querySelector("#calibrateBtn");
const tapButton = app.querySelector("#tapBtn");
const transportStateEl = app.querySelector("#transportState");
const clockEl = app.querySelector("#timeReadout");
const latencyEl = app.querySelector("#latencyReadout");
const calibrationStatusEl = app.querySelector("#calibrationStatus");

function updateTransportState() {
  transportStateEl.textContent = isRunning() ? "running" : "stopped";
}

function refreshLatencyDisplay() {
  const latency = getLatencyMs();
  latencyEl.textContent = latency.toFixed(2);
}

function renderClock() {
  const time = getTimeSec();
  clockEl.textContent = time.toFixed(3);
  requestAnimationFrame(renderClock);
}

async function bootstrap() {
  try {
    await load("/audio/demo.mp3");
    transportStateEl.textContent = "stopped";
  } catch (error) {
    transportStateEl.textContent = "load failed";
    calibrationStatusEl.textContent = `Audio load error: ${error?.message ?? error}`;
    console.error(error);
    return;
  }

  refreshLatencyDisplay();
  updateTransportState();
  renderClock();

  startButton.addEventListener("click", async () => {
    try {
      await start();
      updateTransportState();
    } catch (error) {
      calibrationStatusEl.textContent = `Start failed: ${error?.message ?? error}`;
      console.error(error);
    }
  });

  pauseButton.addEventListener("click", () => {
    pause();
    updateTransportState();
  });

  resetButton.addEventListener("click", () => {
    stop();
    updateTransportState();
  });

  let calibrationSession = null;

  calibrateButton.addEventListener("click", async () => {
    if (calibrationSession) {
      return;
    }

    calibrateButton.disabled = true;
    tapButton.disabled = true;
    calibrationStatusEl.textContent = "Preparing metronome…";

    try {
      const session = await startLatencyCalibration();
      calibrationSession = session;
      calibrateButton.textContent = "Calibrating";
      calibrationStatusEl.textContent = `Tap along with ${session.tapsRequired} ticks (space bar or the Tap button).`;
      tapButton.disabled = false;
      tapButton.focus();

      session.promise
        .then(({ latencyMs }) => {
          calibrationStatusEl.textContent = `Latency saved: ${latencyMs.toFixed(2)} ms`;
          calibrateButton.textContent = "Recalibrate";
          calibrateButton.disabled = false;
          tapButton.disabled = true;
          calibrationSession = null;
          refreshLatencyDisplay();
        })
        .catch((err) => {
          calibrationStatusEl.textContent = err?.message ?? "Calibration cancelled.";
          calibrateButton.textContent = "Start calibration";
          calibrateButton.disabled = false;
          tapButton.disabled = true;
          calibrationSession = null;
        });
    } catch (error) {
      calibrationStatusEl.textContent = `Calibration failed: ${error?.message ?? error}`;
      calibrateButton.textContent = "Start calibration";
      calibrateButton.disabled = false;
      tapButton.disabled = true;
      console.error(error);
    }
  });

  const handleTap = () => {
    if (!calibrationSession) {
      return;
    }
    const recorded = calibrationSession.recordTap();
    if (recorded < calibrationSession.tapsRequired) {
      calibrationStatusEl.textContent = `Captured tap ${recorded}/${calibrationSession.tapsRequired}`;
    } else {
      calibrationStatusEl.textContent = "Calculating median latency…";
    }
  };

  tapButton.addEventListener("click", handleTap);

main
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key === " ") {
      if (calibrationSession) {
        event.preventDefault();
        handleTap();
      }
    }
  });
}

codex/create-web-project-skeleton-for-rhythm-game
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


bootstrap();
main
