const BPM = 120;
const LANES = 4;
const BEAT_INTERVAL_SEC = 60 / BPM;
const TOTAL_BEATS = 32;
const LEAD_IN_BEATS = 4;
const APPROACH_SEC = 1.8;
const SCHEDULE_AHEAD_SEC = 0.2;
const AUTO_REMOVE_DELAY_SEC = 0.6;
const HIT_WINDOWS_MS = {
  perfect: 35,
  great: 70,
  good: 110,
};
const SCORE_VALUES = {
  perfect: 1000,
  great: 600,
  good: 300,
};
const KEY_TO_LANE = {
  KeyA: 0,
  KeyS: 1,
  KeyK: 2,
  KeyL: 3,
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Returns the currently configured user latency offset in milliseconds, if any.
 * @returns {number}
 */
function getLatencyMs() {
  try {
    const stored = window.localStorage?.getItem("userLatencyMs");
    const parsed = stored != null ? Number(stored) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    console.warn("Latency setting unavailable", error);
    return 0;
  }
}

/**
 * Generates a simple cycling chart at 120 BPM.
 * @returns {Array<{ id: number; lane: number; timeSec: number }>}
 */
function generateChart() {
  const notes = [];
  let lane = 0;
  for (let i = 0; i < TOTAL_BEATS; i += 1) {
    const timeSec = (LEAD_IN_BEATS + i) * BEAT_INTERVAL_SEC;
    notes.push({ id: i, lane, timeSec });
    lane = (lane + 1) % LANES;
  }
  return notes;
}

function createNoteElement() {
  const el = document.createElement("div");
  el.className = "note";
  return el;
}

function classifyJudgement(deltaMs) {
  const absDelta = Math.abs(deltaMs);
  if (absDelta <= HIT_WINDOWS_MS.perfect) {
    return "perfect";
  }
  if (absDelta <= HIT_WINDOWS_MS.great) {
    return "great";
  }
  if (absDelta <= HIT_WINDOWS_MS.good) {
    return "good";
  }
  return null;
}

function playClick(time) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "square";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.4, time + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

function init() {
  const miniGame = document.querySelector("#mini-game");
  if (!miniGame) {
    return;
  }

  const scoreEl = miniGame.querySelector("[data-role=score]");
  const comboEl = miniGame.querySelector("[data-role=combo]");
  const feedbackEl = miniGame.querySelector("[data-role=feedback]");
  const startBtn = miniGame.querySelector("#mini-start");
  const resetBtn = miniGame.querySelector("#mini-reset");
  const laneEls = Array.from(miniGame.querySelectorAll(".lane"));

  if (!scoreEl || !comboEl || !feedbackEl || laneEls.length !== LANES) {
    console.warn("Mini-game markup incomplete; skipping setup.");
    return;
  }

  const laneNoteContainers = laneEls.map((laneEl) => {
    let container = laneEl.querySelector(".lane__notes");
    if (!container) {
      container = document.createElement("div");
      container.className = "lane__notes";
      laneEl.prepend(container);
    }
    return container;
  });

  const state = {
    running: false,
    notes: [],
    startCtxTime: 0,
    nextTickTime: 0,
    rafId: null,
    score: 0,
    combo: 0,
    feedbackTimeout: null,
  };

  function setFeedback(message, judgement) {
    if (state.feedbackTimeout) {
      window.clearTimeout(state.feedbackTimeout);
      state.feedbackTimeout = null;
    }
    feedbackEl.textContent = message;
    feedbackEl.dataset.state = judgement ?? "";
    if (message) {
      state.feedbackTimeout = window.setTimeout(() => {
        feedbackEl.textContent = "";
        feedbackEl.dataset.state = "";
      }, 700);
    }
  }

  function updateHud() {
    scoreEl.textContent = state.score.toString();
    comboEl.textContent = state.combo.toString();
  }

  function resetNotes() {
    state.notes.forEach((note) => {
      if (note.element && note.element.parentElement) {
        note.element.parentElement.removeChild(note.element);
      }
    });
    state.notes = [];
    laneNoteContainers.forEach((container) => {
      container.innerHTML = "";
    });

    const chart = generateChart();
    state.notes = chart.map((noteData) => {
      const element = createNoteElement();
      element.dataset.lane = String(noteData.lane);
      element.style.top = "-18%";
      laneNoteContainers[noteData.lane].appendChild(element);
      return {
        ...noteData,
        status: "pending",
        element,
        resolvedTime: null,
      };
    });
  }

  function applyJudgement(note, judgement, deltaMs) {
    if (!note || note.status !== "pending") {
      return;
    }

    const nowSec = audioContext.currentTime - state.startCtxTime;
    note.status = judgement === "miss" ? "miss" : "hit";
    note.judgement = judgement;
    note.deltaMs = deltaMs ?? null;
    note.resolvedTime = nowSec;
    note.element.classList.add("note--resolved");
    note.element.classList.add(`note--${judgement}`);

    if (judgement === "miss") {
      state.combo = 0;
      setFeedback("MISS", judgement);
    } else {
      state.combo += 1;
      state.score += SCORE_VALUES[judgement] ?? 0;
      setFeedback(judgement.toUpperCase(), judgement);
    }
    updateHud();
  }

  function updateNotes(nowSec) {
    const autoMissThreshold = (HIT_WINDOWS_MS.good + 40) / 1000;
    let hasPending = false;

    for (const note of state.notes) {
      if (!note.element || note.removed) {
        continue;
      }

      const timeUntil = note.timeSec - nowSec;
      const progress = 1 - timeUntil / APPROACH_SEC;
      const yPercent = Math.min(Math.max(progress * 100, -18), 115);
      note.element.style.top = `${yPercent}%`;

      if (note.status === "pending" && timeUntil < -autoMissThreshold) {
        applyJudgement(note, "miss", null);
      }

      if (note.status === "pending") {
        hasPending = true;
      }

      if (note.status !== "pending") {
        const reference = note.resolvedTime ?? note.timeSec;
        if (nowSec - reference > AUTO_REMOVE_DELAY_SEC) {
          note.element.classList.add("note--gone");
          if (nowSec - reference > AUTO_REMOVE_DELAY_SEC + 0.2) {
            note.element.remove();
            note.removed = true;
          }
        }
      }
    }

    if (!hasPending && state.running) {
      stopGame();
    }
  }

  function scheduleMetronome(ctxNow) {
    if (!state.running) {
      return;
    }

    while (state.nextTickTime < ctxNow + SCHEDULE_AHEAD_SEC) {
      playClick(state.nextTickTime);
      state.nextTickTime += BEAT_INTERVAL_SEC;
    }
  }

  function loop() {
    if (!state.running) {
      return;
    }

    const ctxNow = audioContext.currentTime;
    const nowSec = ctxNow - state.startCtxTime;
    scheduleMetronome(ctxNow);
    updateNotes(nowSec);
    state.rafId = window.requestAnimationFrame(loop);
  }

  function startGame() {
    if (state.running) {
      return;
    }

    audioContext.resume().then(() => {
      resetNotes();
      state.score = 0;
      state.combo = 0;
      updateHud();
      setFeedback("", "");
      state.running = true;
      state.startCtxTime = audioContext.currentTime;
      state.nextTickTime = state.startCtxTime;
      updateNotes(0);
      state.rafId = window.requestAnimationFrame(loop);
    });
  }

  function stopGame() {
    state.running = false;
    if (state.rafId != null) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  function resetGame() {
    stopGame();
    state.score = 0;
    state.combo = 0;
    state.nextTickTime = 0;
    updateHud();
    resetNotes();
    setFeedback("READY", "ready");
    state.notes.forEach((note) => {
      note.element.style.top = "-18%";
    });
  }

  function handleHit(lane) {
    if (!state.running) {
      return;
    }

    const nowSec = audioContext.currentTime - state.startCtxTime;
    const latencyMs = getLatencyMs();
    let bestNote = null;
    let bestDelta = Infinity;

    for (const note of state.notes) {
      if (note.lane !== lane || note.status !== "pending") {
        continue;
      }
      const deltaMs = (nowSec - note.timeSec) * 1000 - latencyMs;
      const judgement = classifyJudgement(deltaMs);
      if (!judgement) {
        if (deltaMs > HIT_WINDOWS_MS.good) {
          break;
        }
        continue;
      }

      const absDelta = Math.abs(deltaMs);
      if (absDelta < bestDelta) {
        bestDelta = absDelta;
        bestNote = { note, judgement, deltaMs };
      }
    }

    if (bestNote) {
      applyJudgement(bestNote.note, bestNote.judgement, bestNote.deltaMs);
    }
  }

  laneEls.forEach((laneEl) => {
    const laneIndex = Number(laneEl.dataset.lane);
    const button = laneEl.querySelector(".hit-btn");
    if (button) {
      button.addEventListener("click", () => handleHit(laneIndex));
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }
    const lane = KEY_TO_LANE[event.code];
    if (lane == null) {
      return;
    }
    event.preventDefault();
    handleHit(lane);
  });

  startBtn?.addEventListener("click", startGame);
  resetBtn?.addEventListener("click", resetGame);

  resetGame();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
