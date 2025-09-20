import chartData from "./demo.json";

/**
 * @typedef {Object} Note
 * @property {number} id Unique identifier for the note within the chart.
 * @property {number} lane Lane index the note belongs to.
 * @property {number} timeSec Scheduled hit time in seconds from song start.
 * @property {"pending"|"hit"|"miss"} status Current hit state.
 * @property {"perfect"|"great"|"good"|"miss"|null} judgement Latest judgement assigned to the note.
 * @property {number|null} deltaMs Timing delta in milliseconds (positive = late) when hit.
 * @property {number|null} hitTimeSec Exact transport time when the note was hit.
 * @property {number|null} missTimeSec Transport time when the note was marked as missed.
 * @property {boolean} autoMiss Whether the miss was triggered automatically after the window.
 */

/**
 * Hit windows in milliseconds for each judgement tier.
 * @type {{ perfect: number; great: number; good: number }}
 */
export const hitWindowMs = {
  perfect: 35,
  great: 70,
  good: 110,
};

/**
 * Number of seconds a note travels down the screen before reaching the hit line.
 */
export const approachSec = 2.0;

let chartBlueprint = null;
/** @type {Note[]} */
let notes = [];
/** @type {Note[][]} */
let notesByLane = [];
let laneCount = 0;
let loaded = false;

function createNote(id, rawNote) {
  return {
    id,
    lane: rawNote.lane,
    timeSec: Number(rawNote.t),
    status: "pending",
    judgement: null,
    deltaMs: null,
    hitTimeSec: null,
    missTimeSec: null,
    autoMiss: false,
  };
}

function rebuildNotes() {
  if (!chartBlueprint) {
    throw new Error("Chart data has not been loaded yet.");
  }

  notes = chartBlueprint.notes.map((note, index) => createNote(index, note));
  notes.sort((a, b) => a.timeSec - b.timeSec);

  notesByLane = Array.from({ length: laneCount }, () => []);
  for (const note of notes) {
    if (!notesByLane[note.lane]) {
      // Guard against malformed data that references invalid lanes.
      continue;
    }
    notesByLane[note.lane].push(note);
  }
  for (const laneNotes of notesByLane) {
    laneNotes.sort((a, b) => a.timeSec - b.timeSec);
  }
}

/**
 * Loads the bundled demo chart data and prepares note state for gameplay.
 * This should be called once during boot before accessing notes.
 * @returns {Promise<void>}
 */
export async function loadChart() {
  if (!loaded) {
    chartBlueprint = chartData;
    laneCount = chartBlueprint.lanes;
    loaded = true;
  }
  rebuildNotes();
}

/**
 * Resets all note state to its initial pending form.
 */
export function resetChartState() {
  rebuildNotes();
}

/**
 * Gets the total number of lanes for the currently loaded chart.
 * @returns {number}
 */
export function getLaneCount() {
  return laneCount;
}

/**
 * Returns the live array of note objects sorted by scheduled time.
 * @returns {Note[]}
 */
export function getNotes() {
  return notes;
}

/**
 * Returns the note collections grouped by lane for efficient judging.
 * @returns {Note[][]}
 */
export function getNotesByLane() {
  return notesByLane;
}

