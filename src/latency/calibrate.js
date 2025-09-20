codex/create-web-project-skeleton-for-rhythm-game-ilfq4m
import { getAudioContext } from "../audio/transport.js";


codex/create-web-project-skeleton-for-rhythm-game-x1wpp6
import { getAudioContext } from "../audio/transport.js";


codex/create-web-project-skeleton-for-rhythm-game
import { getAudioContext } from "../audio/transport.js";

import { getAudioContext } from "../audio/transport";
main

main
main
const STORAGE_KEY = "userLatencyMs";
const DEFAULT_TAPS = 8;
const INTERVAL_MS = 500;
const START_DELAY_MS = 500;

function computeMedian(values) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scheduleTick(ctx, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.setValueAtTime(1000, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.25, time + 0.01);
  gain.gain.linearRampToValueAtTime(0, time + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.1);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

export function getLatencyMs() {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return safeNumber(stored, 0);
}

export function setLatencyMs(value) {
  if (typeof window === "undefined") {
    return;
  }

  const numeric = safeNumber(value, 0);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(numeric));
  } catch (err) {
    // Ignore storage failures (e.g., private mode).
  }
}

export async function startLatencyCalibration(options = {}) {
  const ctx = getAudioContext();
  await ctx.resume();

  const tapsRequired = options.tapsRequired ?? DEFAULT_TAPS;
  const intervalSec = (options.intervalMs ?? INTERVAL_MS) / 1000;
  const startDelaySec = (options.startDelayMs ?? START_DELAY_MS) / 1000;

  const startTime = ctx.currentTime + startDelaySec;
  const tickTimes = [];
  for (let i = 0; i < tapsRequired; i += 1) {
    const tickTime = startTime + i * intervalSec;
    tickTimes.push(tickTime);
    scheduleTick(ctx, tickTime);
  }

  let resolvePromise;
  let rejectPromise;
  const offsets = [];

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const recordTap = () => {
    if (offsets.length >= tickTimes.length) {
      return offsets.length;
    }

    const tapTime = ctx.currentTime;
    const tickTime = tickTimes[offsets.length];
    const offsetMs = (tapTime - tickTime) * 1000;
    offsets.push(offsetMs);

    if (offsets.length === tickTimes.length) {
      const median = computeMedian(offsets);
      setLatencyMs(median);
      resolvePromise({ latencyMs: median, offsets: [...offsets] });
    }

    return offsets.length;
  };

  const cancel = () => {
    if (offsets.length >= tickTimes.length) {
      return;
    }
    rejectPromise?.(new Error("Calibration cancelled"));
  };

  return {
    tapsRequired,
    recordTap,
    cancel,
    getTapsRecorded: () => offsets.length,
    promise,
  };
}

