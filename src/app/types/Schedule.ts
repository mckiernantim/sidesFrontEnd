/**
 * Production Scheduling Types for Sides-Ways
 * Spec: .speckit/specs/008-production-scheduling/spec.md
 *
 * These types define the data model for Hollywood production scheduling,
 * including shoot days, scenes, cast members, Day Out of Days (DOOD),
 * and related entities.
 */

// ─────────────────────────────────────────────
// Core Schedule Types
// ─────────────────────────────────────────────

/**
 * Top-level production schedule for a screenplay project.
 * Stored as encrypted JSON in the user's Firestore profile.
 */
export interface ProductionSchedule {
  id: string;
  projectId: string;
  projectTitle: string;
  userId: string;

  // Schedule metadata
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  version: number;     // Optimistic concurrency

  // Schedule content
  shootDays: ShootDay[];
  unscheduledScenes: ScheduleScene[];

  // Derived/cached data
  castMembers: CastMember[];
  locations: ScheduleLocation[];

  // User preferences
  settings: ScheduleSettings;

  // One-liner configuration
  oneLinerMode: 'ai' | 'manual' | 'mixed';
}

/**
 * A single shooting day in the production schedule.
 */
export interface ShootDay {
  id: string;
  dayNumber: number;
  date?: string;              // ISO 8601 date only (e.g. "2026-03-15")
  label?: string;             // Custom label ("Day 1 - Ranch Exteriors")

  // Location grouping
  primaryLocation: string;
  secondaryLocations: string[];

  // Scenes scheduled for this day (ordered)
  scenes: ScheduleScene[];

  // Resource summary (auto-calculated from scenes)
  castRequired: DayResource[];
  estimatedPageCount: number;
  estimatedTotalTime: number; // Sum of scene estimatedTimeInFifteenMin values

  // Notes
  notes: string;
}

/**
 * A scene as represented in the scheduling context.
 * Built from classify output with scheduling-specific metadata.
 */
export interface ScheduleScene {
  id: string;

  // From classify output (read-only reference)
  sceneNumber: string;
  sceneHeader: string;         // Full header text ("INT. KITCHEN - DAY")
  intExt: IntExt;
  location: string;            // Parsed location name
  timeOfDay: string;           // DAY, NIGHT, DAWN, DUSK, CONTINUOUS, etc.
  pageCount: number;           // Estimated page count (in 8ths)
  scriptPageStart: number;
  scriptPageEnd: number;

  // Characters in this scene (from classify character lines)
  characters: SceneCharacter[];

  // Scene content (for AI one-liner generation)
  descriptions: string[];  // Action/description lines from the script

  // One-liner
  oneLiner: string;
  oneLinerSource: 'ai' | 'manual';
  oneLinerEdited: boolean;

  // Scheduling metadata
  shootDayId?: string;
  orderInDay?: number;
  estimatedTimeInFifteenMin: number; // 15-minute increments (4 = 1 hour)

  // Scene strip color (user-editable, defaults based on intExt + timeOfDay)
  stripColor: string;

  // Flags
  isOmitted: boolean;
  needsNight: boolean;
  hasStunts: boolean;
  hasEffects: boolean;
  hasVehicles: boolean;

  // Department notes (extensible)
  departmentNotes: DepartmentNote[];
}

export type IntExt = 'INT' | 'EXT' | 'INT/EXT';

// ─────────────────────────────────────────────
// Character / Cast Types
// ─────────────────────────────────────────────

/**
 * A character's appearance in a specific scene.
 */
export interface SceneCharacter {
  characterName: string;
  castMemberId?: string;
  hasDialogue: boolean;
  isVoiceOver: boolean;
  isOffScreen: boolean;
}

/**
 * A cast member across the entire production.
 */
export interface CastMember {
  id: string;
  characterName: string;
  actorName?: string;
  castNumber?: number;
  category: CastCategory;

  // Scene appearances (auto-calculated)
  sceneNumbers: string[];
  totalScenes: number;
  totalPageCount: number;

  // DOOD status per shoot day (auto-calculated)
  dayOutOfDays: DayOutOfDaysEntry[];

  // Availability (user-entered)
  startDate?: string;
  endDate?: string;
  holdDays?: string[];
  unavailableDays?: string[];
}

export type CastCategory =
  | 'principal'
  | 'day-player'
  | 'recurring'
  | 'stunt'
  | 'background'
  | 'voice-only';

// ─────────────────────────────────────────────
// Day Out of Days (DOOD) Types
// ─────────────────────────────────────────────

/**
 * Day Out of Days entry for a single cast member on a single shoot day.
 */
export interface DayOutOfDaysEntry {
  shootDayId: string;
  dayNumber: number;
  date?: string;
  status: DOODStatus;
}

/**
 * DOOD status codes (industry standard):
 * SW  = Start Work (first day)
 * W   = Work (regular day)
 * WF  = Work Finish (last day)
 * SWF = Start Work Finish (only works one day)
 * H   = Hold (contracted but not working)
 * R   = Rehearsal
 * T   = Travel
 * WD  = Work Drop/Pickup (non-consecutive)
 * ''  = Not working this day
 */
export type DOODStatus = 'SW' | 'W' | 'WF' | 'SWF' | 'H' | 'R' | 'T' | 'WD' | '';

// ─────────────────────────────────────────────
// Location Types
// ─────────────────────────────────────────────

/**
 * A unique shooting location derived from scene headers.
 */
export interface ScheduleLocation {
  id: string;
  name: string;
  fullHeaders: string[];
  intExt: IntExt[];
  sceneCount: number;
  totalPageCount: number;

  // User-entered production details
  address?: string;
  contactName?: string;
  contactPhone?: string;
  permitRequired?: boolean;
  notes?: string;
}

// ─────────────────────────────────────────────
// Resource & Department Types
// ─────────────────────────────────────────────

/**
 * Resource tracking for a shoot day.
 */
export interface DayResource {
  castMemberId: string;
  characterName: string;
  actorName?: string;
  castNumber?: number;
  doodStatus: DOODStatus;
  scenes: string[];
}

/**
 * Department-specific note attached to a scene.
 */
export interface DepartmentNote {
  department: Department;
  note: string;
  requiresPrep: boolean;
  estimatedCost?: number;
}

export type Department =
  | 'props'
  | 'hair-makeup'
  | 'wardrobe'
  | 'vehicles'
  | 'special-equipment'
  | 'stunts'
  | 'vfx'
  | 'sfx'
  | 'background'
  | 'animals'
  | 'locations'
  | 'art'
  | 'camera'
  | 'sound'
  | 'other';

// ─────────────────────────────────────────────
// Settings Types
// ─────────────────────────────────────────────

/**
 * User preferences for scheduling.
 */
export interface ScheduleSettings {
  defaultDayLength: number;       // Target page count per day (default: 5 pages)
  showOmittedScenes: boolean;
  autoCalculateDOOD: boolean;
  exportFormat: 'xlsx' | 'csv';
  startDate?: string;
  sixDayWeeks: boolean;
  dayOffDay: 'sunday' | 'saturday';
}

// ─────────────────────────────────────────────
// Scene Strip Color Defaults
// ─────────────────────────────────────────────

/**
 * Default color mapping for scene strips based on INT/EXT and time of day.
 * Users can override per-scene via ScheduleScene.stripColor.
 */
export const DEFAULT_STRIP_COLORS: Record<string, string> = {
  'INT-DAY':    '#3B82F6', // Blue
  'INT-NIGHT':  '#EAB308', // Yellow
  'EXT-DAY':    '#22C55E', // Green
  'EXT-NIGHT':  '#F97316', // Orange
  'INT/EXT-DAY':   '#8B5CF6', // Purple
  'INT/EXT-NIGHT': '#EC4899', // Pink
};

/**
 * Returns the default strip color for a scene based on INT/EXT and time of day.
 */
export function getDefaultStripColor(intExt: IntExt, timeOfDay: string): string {
  const isNight = /night|evening|dusk/i.test(timeOfDay);
  const key = `${intExt}-${isNight ? 'NIGHT' : 'DAY'}`;
  return DEFAULT_STRIP_COLORS[key] || '#9CA3AF'; // Gray fallback
}

// ─────────────────────────────────────────────
// Utility: Format 15-min increments to readable time
// ─────────────────────────────────────────────

/**
 * Formats a 15-minute increment count into a human-readable time string.
 * @param increments - Number of 15-minute increments
 * @returns Formatted string like "1h 30m", "45m", "2h 0m"
 */
export function formatFifteenMinIncrements(increments: number): string {
  if (increments <= 0) return '0m';
  const hours = Math.floor(increments / 4);
  const minutes = (increments % 4) * 15;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// ─────────────────────────────────────────────
// Factory: Default Schedule Settings
// ─────────────────────────────────────────────

/**
 * Returns a default ScheduleSettings object.
 */
export function getDefaultScheduleSettings(): ScheduleSettings {
  return {
    defaultDayLength: 5,
    showOmittedScenes: false,
    autoCalculateDOOD: true,
    exportFormat: 'xlsx',
    sixDayWeeks: true,
    dayOffDay: 'sunday',
  };
}
