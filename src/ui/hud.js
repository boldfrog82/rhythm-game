/**
 * Creates the HUD layout and wires up control callbacks.
 * @param {{
 *  onStart: () => void,
 *  onPause: () => void,
 *  onReset: () => void,
 *  onCalibrate: () => void,
 *  onTap: () => void
 * }} handlers
 */
export function createHud(handlers) {
  const root = document.createElement("div");
  root.className = "game-shell";
  root.innerHTML = `
    <header class="hud">
      <div class="hud__stats">
        <div class="hud__metric">
          <span class="hud__label">Score</span>
          <span class="hud__value" data-metric="score">0</span>
        </div>
        <div class="hud__metric">
          <span class="hud__label">Combo</span>
          <span class="hud__value" data-metric="combo">0</span>
        </div>
        <div class="hud__metric">
          <span class="hud__label">Max Combo</span>
          <span class="hud__value" data-metric="maxCombo">0</span>
        </div>
        <div class="hud__metric">
          <span class="hud__label">Accuracy</span>
          <span class="hud__value" data-metric="accuracy">100.0%</span>
        </div>
      </div>
      <div class="hud__controls">
        <button type="button" data-action="start">Start</button>
        <button type="button" data-action="pause">Pause</button>
        <button type="button" data-action="reset">Reset</button>
        <button type="button" data-action="calibrate">Latency Calibration</button>
        <button type="button" data-action="tap" class="hud__tap" disabled>Tap (Space)</button>
      </div>
    </header>
    <section class="hud__info">
      <p class="hud__transport">Transport: <span data-transport-state>stopped</span></p>
      <p class="hud__latency">Latency: <span data-latency>0.00</span> ms</p>
      <p class="hud__judgement" data-judgement>Press Start to play the demo chart.</p>
      <p class="hud__calibration" data-calibration-status></p>
    </section>
    <section class="hud__counts">
      <span data-count-perfect>Perfect: 0</span>
      <span data-count-great>Great: 0</span>
      <span data-count-good>Good: 0</span>
      <span data-count-miss>Miss: 0</span>
    </section>
    <div class="game-shell__canvas" data-canvas-host></div>
  `;

  const canvasHost = root.querySelector("[data-canvas-host]");
  const scoreEl = root.querySelector('[data-metric="score"]');
  const comboEl = root.querySelector('[data-metric="combo"]');
  const maxComboEl = root.querySelector('[data-metric="maxCombo"]');
  const accuracyEl = root.querySelector('[data-metric="accuracy"]');
  const transportEl = root.querySelector("[data-transport-state]");
  const latencyEl = root.querySelector("[data-latency]");
  const judgementEl = root.querySelector("[data-judgement]");
  const calibrationEl = root.querySelector("[data-calibration-status]");
  const perfectCountEl = root.querySelector("[data-count-perfect]");
  const greatCountEl = root.querySelector("[data-count-great]");
  const goodCountEl = root.querySelector("[data-count-good]");
  const missCountEl = root.querySelector("[data-count-miss]");
  const tapButton = root.querySelector('[data-action="tap"]');
  const calibrateButton = root.querySelector('[data-action="calibrate"]');

  root.querySelector('[data-action="start"]').addEventListener("click", () => {
    handlers.onStart?.();
  });

  root.querySelector('[data-action="pause"]').addEventListener("click", () => {
    handlers.onPause?.();
  });

  root.querySelector('[data-action="reset"]').addEventListener("click", () => {
    handlers.onReset?.();
  });

  calibrateButton.addEventListener("click", () => {
    handlers.onCalibrate?.();
  });

  tapButton.addEventListener("click", () => {
    handlers.onTap?.();
  });

  return {
    root,
    canvasHost,
codex/create-web-project-skeleton-for-rhythm-game-ilfq4m
    setTransportState(running, timeSec) {
      const label = running ? "running" : "paused";
      if (typeof timeSec === "number" && Number.isFinite(timeSec)) {
        transportEl.textContent = `${label} (${timeSec.toFixed(2)}s)`;
      } else {
        transportEl.textContent = label;
      }

    setTransportState(running) {
      transportEl.textContent = running ? "running" : "paused";
main
    },
    updateLatency(latencyMs) {
      latencyEl.textContent = latencyMs.toFixed(2);
    },
    updateStats(state) {
      scoreEl.textContent = state.score.toString();
      comboEl.textContent = state.combo.toString();
      maxComboEl.textContent = state.maxCombo.toString();
      accuracyEl.textContent = `${state.accuracy.toFixed(1)}%`;
      perfectCountEl.textContent = `Perfect: ${state.judgementCounts.perfect}`;
      greatCountEl.textContent = `Great: ${state.judgementCounts.great}`;
      goodCountEl.textContent = `Good: ${state.judgementCounts.good}`;
      missCountEl.textContent = `Miss: ${state.judgementCounts.miss}`;

      if (state.lastJudgement) {
        const deltaText =
          typeof state.lastDeltaMs === "number"
            ? ` (${state.lastDeltaMs.toFixed(1)} ms)`
            : "";
        judgementEl.textContent = `${state.lastJudgement.toUpperCase()}${deltaText}`;
      }
    },
    setJudgementMessage(message) {
      judgementEl.textContent = message;
    },
    setCalibrationStatus(message) {
      calibrationEl.textContent = message ?? "";
    },
    setCalibrationActive(active) {
      tapButton.disabled = !active;
      tapButton.classList.toggle("hud__tap--active", active);
    },
    setTapLabel(label) {
      tapButton.textContent = label;
    },
    setCalibrateButtonDisabled(disabled) {
      calibrateButton.disabled = disabled;
    },
    setCalibrateButtonLabel(label) {
      calibrateButton.textContent = label;
    },
  };
}

