/**
 * Derives a shoot day's title from its scenes' locations, in shooting
 * (strip) order — spec .speckit/specs/031-schedule-cast-toggle-day-titles.
 */
import { ScheduleScene } from '../types/Schedule';

/**
 * Returns the unique run of non-blank locations in scene (shooting) order,
 * collapsing consecutive duplicates only — a later reappearance of an
 * earlier location (e.g. A → B → A) is kept, not deduplicated globally.
 */
export function locationsInShootOrder(scenes: ScheduleScene[]): string[] {
  const result: string[] = [];
  for (const scene of scenes ?? []) {
    const location = (scene.location ?? '').trim();
    if (!location) continue;
    if (result[result.length - 1] === location) continue;
    result.push(location);
  }
  return result;
}

/**
 * Builds a shoot day's display title from its scenes' locations in
 * shooting order (e.g. "KITCHEN → PARK"). Falls back to "Day {dayNumber}"
 * for an empty day or a day whose scenes all have blank locations —
 * never fabricates a location.
 */
export function buildDayTitleFromScenes(scenes: ScheduleScene[], dayNumber: number): string {
  const locations = locationsInShootOrder(scenes);
  if (locations.length === 0) return `Day ${dayNumber}`;
  return locations.join(' → ');
}
