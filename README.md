# rhythm-game
Web rhythm game: hit notes in time with music

## Demo assets
- Static files in the `public` directory are served directly by Vite. The demo tone lives at `/audio/demo.mp3`,
  and `scripts/generate-demo-audio.js` writes it from an embedded Base64 payload before each dev server or build
  so the binary asset stays out of source control while still being copied verbatim into the production bundle.
- Sample charts live under `src/chart`. Add new beatmaps there using valid JSON to have them bundled with the app source.

## Timing & Latency
- Gameplay timing is driven entirely by the Web Audio clock (`AudioContext.currentTime`). The transport in
  `src/audio/transport.js` controls playback for the built-in demo track and is the single source of truth
  for rendering, judgment, and scheduling.
- When you add new audio, drop the files in `public/audio` (or any subdirectory inside `public`). Reference
  them by URL (for example, `/audio/my-track.ogg`) so Vite serves them at the root path and copies them to
  `dist/` unchanged during builds.
- To calibrate latency, open the app, press **Start calibration**, then tap the **Tap** button (or press the
  space bar) in time with the metronome clicks. After eight taps the app stores the median offset in
  `localStorage` under `userLatencyMs`, and the helpers in `src/latency/calibrate.js` expose it to the rest of
  the game.
