# rhythm-game
Web rhythm game: hit notes in time with music

codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game

codex/create-web-project-skeleton-for-rhythm-game
main
main
main
main
## Mini Rhythm Game
- The landing page includes a self-contained four-lane "Mini Rhythm Game" demo that you can play instantly.
- Use the on-screen lane buttons or the **A / S / K / L** keys to hit the falling notes while the metronome clicks.
- Score, combo, and judgement feedback appear above the lanes, and you can restart the mini-game without
  affecting the full canvas renderer.

## Development
- Install dependencies with `npm install`.
- Run `npm run dev` to start the Vite dev server.
- Run `npm run build` to create a production build, and `npm run preview` to serve the built output locally.

 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game


main
main
main
main
 main
## Demo assets
- Static files in the `public` directory are served directly by Vite. The demo tone lives at `/audio/demo.mp3`,
  and `scripts/generate-demo-audio.js` writes it from an embedded Base64 payload before each dev server or build
  so the binary asset stays out of source control while still being copied verbatim into the production bundle.
- Sample charts live under `src/chart`. Add new beatmaps there using valid JSON to have them bundled with the app source.

 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game

odex/create-web-project-skeleton-for-rhythm-game
ain
main
main
 main
## Controls
- **Gameplay lanes:** press **A / S / K / L** to hit the four columns.
- **Transport:** use the Start, Pause, and Reset buttons in the HUD to control playback.
- **Latency calibration:** click **Latency Calibration** then tap the on-screen button (or press the **Space** bar) in time with the metronome to measure your offset.

Judgement windows (symmetric around the note time, after subtracting your saved latency):
- Perfect ≤ 35 ms
- Great ≤ 70 ms
- Good ≤ 110 ms
- Miss > 110 ms

 codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game


ain
ain
main
main
main
## Timing & Latency
- Gameplay timing is driven entirely by the Web Audio clock (`AudioContext.currentTime`). The transport in
  `src/audio/transport.js` controls playback for the built-in demo track and is the single source of truth
  for rendering, judgment, and scheduling.
- When you add new audio, drop the files in `public/audio` (or any subdirectory inside `public`). Reference
  them by URL (for example, `/audio/my-track.ogg`) so Vite serves them at the root path and copies them to
  `dist/` unchanged during builds.
codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

odex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game

codex/create-web-project-skeleton-for-rhythm-game
main
main
main
main
- To calibrate latency, open the app, press **Latency Calibration**, then tap the **Tap (Space)** button (or press the
  space bar) in time with the metronome clicks. After eight taps the app stores the median offset in
  `localStorage` under `userLatencyMs`, and the helpers in `src/latency/calibrate.js` expose it to the rest of
  the game.

codex/create-web-project-skeleton-for-rhythm-game-dd6gmi

codex/create-web-project-skeleton-for-rhythm-game-ilfq4m

codex/create-web-project-skeleton-for-rhythm-game-x1wpp6

codex/create-web-project-skeleton-for-rhythm-game


- To calibrate latency, open the app, press **Start calibration**, then tap the **Tap** button (or press the
  space bar) in time with the metronome clicks. After eight taps the app stores the median offset in
  `localStorage` under `userLatencyMs`, and the helpers in `src/latency/calibrate.js` expose it to the rest of
  the game.
main
main
main
main
main
