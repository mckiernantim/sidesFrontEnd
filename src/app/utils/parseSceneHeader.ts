/**
 * Scene Header Parser for Production Scheduling
 * Spec: .speckit/specs/008-production-scheduling/spec.md
 *
 * Parses classified scene header strings (e.g. "INT. COFFEE SHOP - DAY")
 * into structured data for the scheduling system.
 */

import { IntExt, getDefaultStripColor } from '../types/Schedule';

/**
 * Result of parsing a scene header string.
 */
export interface ParsedSceneHeader {
  intExt: IntExt;
  location: string;
  timeOfDay: string;
  isOmitted: boolean;
  needsNight: boolean;
  stripColor: string;
}

/**
 * Regex patterns for INT/EXT detection.
 * Ordered from most specific (INT./EXT.) to least specific (INT/EXT).
 * Non-capturing groups used for performance.
 */
const INT_EXT_PATTERNS: { pattern: RegExp; type: IntExt }[] = [
  // Combined forms (must check first — they contain both INT and EXT)
  { pattern: /^INT\.?\s*\/\s*EXT\.?\s+/i,    type: 'INT/EXT' },
  { pattern: /^EXT\.?\s*\/\s*INT\.?\s+/i,    type: 'INT/EXT' },
  { pattern: /^I\s*\/\s*E\.?\s+/i,           type: 'INT/EXT' },
  { pattern: /^E\s*\/\s*I\.?\s+/i,           type: 'INT/EXT' },
  // Single forms
  { pattern: /^INT\.?\s+/i,                   type: 'INT' },
  { pattern: /^EXT\.?\s+/i,                   type: 'EXT' },
];

/**
 * Time-of-day keywords that indicate night shooting is required.
 */
const NIGHT_KEYWORDS = /^(night|evening|dusk|midnight|pre-dawn|late\s+night)$/i;

/**
 * Keywords indicating the scene is omitted.
 */
const OMITTED_PATTERN = /^omit(ted)?$/i;

/**
 * Parses a scene header string into structured data.
 *
 * Handles standard Hollywood screenplay header formats:
 * - "INT. KITCHEN - DAY"
 * - "EXT. DOWNTOWN LOS ANGELES - NIGHT"
 * - "INT./EXT. CAR - CONTINUOUS"
 * - "I/E HOUSE - DAY"
 * - "OMITTED"
 * - "ESTABLISHING SHOT"
 * - "INT. COFFEE SHOP - DAY (FLASHBACK)"
 *
 * @param headerText - The full scene header text from classify output
 * @returns Parsed header with intExt, location, timeOfDay, and derived flags
 */
export function parseSceneHeader(headerText: string): ParsedSceneHeader {
  const trimmed = headerText.trim();

  // Handle omitted scenes
  if (OMITTED_PATTERN.test(trimmed)) {
    return {
      intExt: 'INT',
      location: 'OMITTED',
      timeOfDay: '',
      isOmitted: true,
      needsNight: false,
      stripColor: '#9CA3AF', // Gray for omitted
    };
  }

  // Try to match INT/EXT patterns
  let intExt: IntExt = 'INT'; // Default
  let remainder = trimmed;
  let matched = false;

  for (const { pattern, type } of INT_EXT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      intExt = type;
      remainder = trimmed.slice(match[0].length);
      matched = true;
      break;
    }
  }

  // If no INT/EXT match, treat entire text as location
  // (handles "ESTABLISHING SHOT", "MONTAGE", "INTERCUT", etc.)
  if (!matched) {
    return {
      intExt: 'INT',
      location: trimmed,
      timeOfDay: '',
      isOmitted: false,
      needsNight: false,
      stripColor: '#9CA3AF', // Gray for special headers
    };
  }

  // Split remainder on " - " to separate location from time of day.
  // Use the LAST occurrence of " - " since locations can contain dashes
  // (e.g. "GRAND CENTRAL - PLATFORM 9 - DAY" → location="GRAND CENTRAL - PLATFORM 9", time="DAY")
  const { location, timeOfDay } = splitLocationAndTime(remainder);

  // Determine if this requires night shooting
  const needsNight = NIGHT_KEYWORDS.test(timeOfDay.trim());

  // Get default strip color
  const stripColor = getDefaultStripColor(intExt, timeOfDay);

  return {
    intExt,
    location: location.trim(),
    timeOfDay: timeOfDay.trim(),
    isOmitted: false,
    needsNight,
    stripColor,
  };
}

/**
 * Splits the remainder (after INT/EXT prefix) into location and time of day.
 * Uses the last " - " separator to handle locations with dashes.
 *
 * Also handles parenthetical modifiers like "(FLASHBACK)", "(CONTINUOUS)",
 * stripping them from the time of day for cleaner data.
 *
 * @param remainder - Text after INT/EXT prefix
 * @returns Object with location and timeOfDay strings
 */
function splitLocationAndTime(remainder: string): { location: string; timeOfDay: string } {
  // Find the last " - " separator
  const lastDashIndex = remainder.lastIndexOf(' - ');

  if (lastDashIndex === -1) {
    // No dash separator — treat entire text as location
    return { location: remainder.trim(), timeOfDay: '' };
  }

  const location = remainder.slice(0, lastDashIndex).trim();
  let timeOfDay = remainder.slice(lastDashIndex + 3).trim();

  // Strip trailing parenthetical modifiers from time of day
  // e.g. "DAY (FLASHBACK)" → "DAY", "NIGHT (CONTINUOUS)" → "NIGHT"
  // But preserve the core time of day value
  const parenMatch = timeOfDay.match(/^(\S+)\s*\(.*\)\s*$/);
  if (parenMatch) {
    timeOfDay = parenMatch[1];
  }

  return { location, timeOfDay };
}

/**
 * Extracts unique location names from an array of scene headers.
 * Groups by normalized location name (ignoring INT/EXT and time of day).
 *
 * @param headers - Array of scene header strings
 * @returns Array of unique location names
 */
export function extractUniqueLocations(headers: string[]): string[] {
  const locationSet = new Set<string>();

  for (const header of headers) {
    const parsed = parseSceneHeader(header);
    if (parsed.location && parsed.location !== 'OMITTED') {
      locationSet.add(parsed.location);
    }
  }

  return Array.from(locationSet).sort();
}
