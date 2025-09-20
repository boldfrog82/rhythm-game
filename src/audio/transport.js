const AudioContextClass =
  typeof window !== "undefined"
    ? window.AudioContext || window.webkitAudioContext
    : null;

let audioCtx = null;
let audioBuffer = null;
let bufferSource = null;
let isTransportRunning = false;
let pausedTime = 0;
let timeOffset = 0;
let loadedUrl = null;
let loadPromise = null;

function ensureAudioContext() {
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this environment.");
  }

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    timeOffset = -audioCtx.currentTime;
  }

  return audioCtx;
}

function disposeSource() {
  if (bufferSource) {
    bufferSource.onended = null;
    try {
      bufferSource.stop();
    } catch (err) {
      // Swallow errors for already-stopped sources.
    }
    bufferSource.disconnect();
    bufferSource = null;
  }
}

function createSource(ctx) {
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.onended = () => {
    if (!isTransportRunning) {
      return;
    }

    isTransportRunning = false;
    bufferSource = null;
    pausedTime = 0;
    timeOffset = -ctx.currentTime;
  };
  return source;
}

export async function load(url) {
  const ctx = ensureAudioContext();

  if (loadPromise && url === loadedUrl) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio asset: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    audioBuffer = decoded;
    loadedUrl = url;
    pausedTime = 0;
    timeOffset = -ctx.currentTime;
    return audioBuffer;
  })();

  return loadPromise;
}

export async function start() {
  const ctx = ensureAudioContext();
  if (!audioBuffer) {
    throw new Error("No audio loaded. Call load() before start().");
  }
  if (isTransportRunning) {
    return;
  }

  await ctx.resume();

  let startPosition = pausedTime;
  if (startPosition < 0 || startPosition >= audioBuffer.duration) {
    startPosition = 0;
  }

  bufferSource = createSource(ctx);
  timeOffset = startPosition - ctx.currentTime;
  bufferSource.start(0, startPosition);
  isTransportRunning = true;
}

export function pause() {
  if (!audioCtx || !isTransportRunning) {
    return;
  }

  pausedTime = audioCtx.currentTime + timeOffset;
  isTransportRunning = false;
  disposeSource();
}

export function stop() {
  if (!audioCtx) {
    return;
  }

  disposeSource();
  pausedTime = 0;
  timeOffset = -audioCtx.currentTime;
  isTransportRunning = false;
}

export function getTimeSec() {
  if (!audioCtx) {
    return 0;
  }

  return isTransportRunning ? audioCtx.currentTime + timeOffset : pausedTime;
}

export function isRunning() {
  return isTransportRunning;
}

export function getAudioContext() {
  return ensureAudioContext();
}

