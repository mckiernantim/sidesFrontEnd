/**
 * Pure scene-strip sort comparators for the schedule builder.
 * Spec: .speckit/specs/030-one-liner-sort/spec.md
 *
 * These helpers only reorder — they never clone or modify scene fields,
 * so one-liner text/source/edited flags and all other scene data are
 * byte-identical before and after any sort (SC-003).
 */
import { ScheduleScene } from '../types/Schedule';

export type SceneSortMode = 'script' | 'intExt' | 'location' | 'timeOfDay';

/**
 * UI metadata for the sort mode buttons, shared by the unscheduled-pool
 * toolbar, per-day sort control, and "Sort all days" header action so the
 * labels in contracts/one-liner-sort-ui.md stay in exactly one place.
 */
export interface SceneSortModeOption {
  mode: SceneSortMode;
  label: string;
}

export const SCENE_SORT_MODE_OPTIONS: SceneSortModeOption[] = [
  { mode: 'script', label: 'Script order' },
  { mode: 'intExt', label: 'INT / EXT' },
  { mode: 'location', label: 'Location' },
  { mode: 'timeOfDay', label: 'Time of day' },
];

// ─────────────────────────────────────────────
// Script order (chronological)
// ─────────────────────────────────────────────

interface ParsedSceneNumber {
  numeric: number | null;
  suffix: string;
}

/**
 * Splits a scene number into a leading numeric part and trailing suffix
 * (e.g. "12B" → { numeric: 12, suffix: "B" }). Scene numbers with no
 * numeric prefix (e.g. "A12") return numeric: null so callers can fall
 * back to scriptPageStart per the spec's edge-case rule.
 */
function parseSceneNumber(raw: string | undefined): ParsedSceneNumber {
  const trimmed = (raw ?? '').trim();
  const match = /^(\d+)\s*(.*)$/.exec(trimmed);
  if (!match) {
    return { numeric: null, suffix: trimmed };
  }
  return { numeric: parseInt(match[1], 10), suffix: match[2] };
}

function compareScriptOrder(a: ScheduleScene, b: ScheduleScene): number {
  const parsedA = parseSceneNumber(a.sceneNumber);
  const parsedB = parseSceneNumber(b.sceneNumber);

  if (parsedA.numeric !== null && parsedB.numeric !== null) {
    if (parsedA.numeric !== parsedB.numeric) {
      return parsedA.numeric - parsedB.numeric;
    }
    return parsedA.suffix.localeCompare(parsedB.suffix);
  }

  if (a.scriptPageStart !== b.scriptPageStart) {
    return a.scriptPageStart - b.scriptPageStart;
  }

  return (a.sceneNumber ?? '').localeCompare(b.sceneNumber ?? '');
}

// ─────────────────────────────────────────────
// INT / EXT
// ─────────────────────────────────────────────

const INT_EXT_RANK: Record<string, number> = {
  INT: 0,
  'INT/EXT': 1,
  EXT: 2,
};

function intExtRank(value: string | undefined): number {
  return INT_EXT_RANK[value ?? ''] ?? 3;
}

function compareIntExt(a: ScheduleScene, b: ScheduleScene): number {
  const diff = intExtRank(a.intExt) - intExtRank(b.intExt);
  return diff !== 0 ? diff : compareScriptOrder(a, b);
}

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

function compareLocation(a: ScheduleScene, b: ScheduleScene): number {
  const locationA = (a.location ?? '').trim();
  const locationB = (b.location ?? '').trim();

  if (locationA === '' && locationB === '') return compareScriptOrder(a, b);
  if (locationA === '') return 1; // empty last
  if (locationB === '') return -1;

  const diff = locationA.localeCompare(locationB);
  return diff !== 0 ? diff : compareScriptOrder(a, b);
}

// ─────────────────────────────────────────────
// Time of day
// ─────────────────────────────────────────────

const TIME_OF_DAY_RANK: Record<string, number> = {
  DAY: 0,
  DAWN: 1,
  DUSK: 2,
  NIGHT: 3,
  CONTINUOUS: 4,
};

function timeOfDayRank(value: string | undefined): number {
  const normalized = (value ?? '').trim().toUpperCase();
  return TIME_OF_DAY_RANK[normalized] ?? 5;
}

function compareTimeOfDay(a: ScheduleScene, b: ScheduleScene): number {
  const diff = timeOfDayRank(a.timeOfDay) - timeOfDayRank(b.timeOfDay);
  return diff !== 0 ? diff : compareScriptOrder(a, b);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

const COMPARATORS: Record<SceneSortMode, (a: ScheduleScene, b: ScheduleScene) => number> = {
  script: compareScriptOrder,
  intExt: compareIntExt,
  location: compareLocation,
  timeOfDay: compareTimeOfDay,
};

/**
 * Returns a new, stably-sorted array of scenes for the given mode.
 * Never mutates the input array or the scene objects it contains
 * (Array.prototype.sort is guaranteed stable per ES2019+; scene
 * references are copied as-is, not cloned, so identity/one-liner
 * fields are untouched).
 */
export function sortScheduleScenes(
  scenes: ScheduleScene[],
  mode: SceneSortMode
): ScheduleScene[] {
  return [...scenes].sort(COMPARATORS[mode]);
}
