/**
 * Character-to-Scene Map Builder for Production Scheduling
 * Spec: .speckit/specs/008-production-scheduling/spec.md
 *
 * Extracts character appearances per scene from the classify output.
 * Uses the existing Line interface and scene header data from the
 * scan-classify pipeline.
 */

import { Line } from '../types/Line';
import { SceneCharacter } from '../types/Schedule';

/**
 * A scene reference used for building the character map.
 * Matches the structure from classify output's firstAndLastLinesOfScenes.
 */
export interface SceneRef {
  sceneNumberText?: string;
  sceneNumber?: string | number;
  text?: string;            // Scene header text
  index?: number;           // First line index (startLine)
  lastLine?: number;        // Last line index
  characters?: string[];    // Pre-built character list from classify (if available)
}

/**
 * Result of building the character-scene map.
 * Contains per-scene characters and a deduplicated cast list.
 */
export interface CharacterSceneMapResult {
  /** Map of sceneNumber → array of SceneCharacter appearances */
  sceneCharacterMap: Map<string, SceneCharacter[]>;
  /** Deduplicated list of all unique character names across the script */
  allCharacters: string[];
}

/**
 * Minimum xPos threshold for character names in standard screenplay format.
 * Character names are centered at ~252 xPos. Lines below 200 are typically
 * descriptions, scene headers, or misclassified elements.
 *
 * This filters out misclassified lines like "THE MAIN ROOM", "KITCHEN", etc.
 * that classify may label as 'character' due to ALL CAPS formatting.
 */
const MIN_CHARACTER_XPOS = 200;

/**
 * Known non-character patterns that are sometimes misclassified.
 * These are ALL CAPS location descriptors, inserts, and transitions.
 */
const NON_CHARACTER_PATTERNS = [
  /^(THE\s+)?(MAIN\s+ROOM|LIVING\s+ROOM|BEDROOM|BATHROOM|KITCHEN|HALLWAY|CLOSET|FRONT\s+DOOR|BACK\s+DOOR|STAIRWELL|STAIRS|ATTIC|BASEMENT|GARAGE|PORCH|BACKYARD|FRONT\s+YARD)/i,
  /^(UP|DOWN)\s+(THE\s+)?(STAIRS|HALLWAY|STREET|ROAD|PATH)/i,
  /^INSERT\s*[-–—:]/i,
  /^(BACK\s+TO\s+SCENE|FLASHBACK|MONTAGE|INTERCUT|ESTABLISHING\s+SHOT)/i,
  /^(THE\s+END|FADE\s+(IN|OUT)|CUT\s+TO|DISSOLVE\s+TO)/i,
  /^(THREE|TWO|ONE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s+(MONTHS?|WEEKS?|DAYS?|YEARS?|HOURS?)\s+(LATER|EARLIER|AGO|BEFORE)/i,
  /^(FOUND|STOP|LOCKED|BEEP|BANG|CRASH|BOOM|SLAM|CLICK)/i,
  /^(SECOND|FIRST|THIRD)\s+(FLOOR|STORY|LEVEL)/i,
  /^[\w\s]+'S\s+(POV|BEDROOM|HOUSE|CAR|OFFICE|ROOM)/i,
  /^DOORBELL\s+(CHIME|RING)/i,
];

/**
 * V.O. / O.S. / CONT'D extension patterns on character names.
 */
const VO_PATTERN = /\(V\.?O\.?\)/i;
const OS_PATTERN = /\(O\.?S\.?\)/i;
const CONTD_PATTERN = /\(CONT['']?D\)/i;

/**
 * Strips extensions like (V.O.), (O.S.), (CONT'D) from a character name.
 * Returns the clean character name.
 */
export function cleanCharacterName(rawText: string): string {
  return rawText
    .replace(VO_PATTERN, '')
    .replace(OS_PATTERN, '')
    .replace(CONTD_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines if a classified "character" line is actually a real character
 * (not a misclassified location, insert, or parenthetical).
 */
export function isRealCharacter(line: Line): boolean {
  // Must be classified as 'character'
  if (line.category !== 'character') return false;

  // Position check: character names are centered (xPos >= 200)
  if (line.xPos < MIN_CHARACTER_XPOS) return false;

  const text = line.text.trim();

  // Reject empty lines
  if (!text) return false;

  // Reject parentheticals that got misclassified
  if (text.startsWith('(') && text.endsWith(')')) return false;

  // Reject known non-character patterns
  for (const pattern of NON_CHARACTER_PATTERNS) {
    if (pattern.test(text)) return false;
  }

  return true;
}

/**
 * Builds a map of scene numbers → character appearances from classified lines.
 *
 * This is the core function that bridges the scan-classify output to the
 * scheduling system. It:
 * 1. Iterates all classified lines
 * 2. Filters to real character lines (by category, position, and pattern)
 * 3. Maps each character to their scene appearances
 * 4. Detects V.O., O.S. status per appearance
 * 5. Deduplicates within each scene
 *
 * @param allLines - All classified lines from scan-classify output
 * @param scenes - Scene references from firstAndLastLinesOfScenes
 * @returns CharacterSceneMapResult with per-scene characters and full cast list
 */
export function buildCharacterSceneMap(
  allLines: Line[],
  scenes: SceneRef[]
): CharacterSceneMapResult {
  const sceneCharacterMap = new Map<string, SceneCharacter[]>();
  const allCharacterNames = new Set<string>();

  // Build a lookup: for each line index, what scene does it belong to?
  const lineToScene = buildLineToSceneIndex(scenes);

  for (const line of allLines) {
    if (!isRealCharacter(line)) continue;

    // Determine which scene this character line belongs to
    const sceneNumber = lineToScene.get(line.index);
    if (!sceneNumber) continue;

    const rawName = line.text.trim();
    const cleanName = cleanCharacterName(rawName);
    const isVO = VO_PATTERN.test(rawName);
    const isOS = OS_PATTERN.test(rawName);

    // Add to character set
    allCharacterNames.add(cleanName);

    // Get or create the scene's character array
    if (!sceneCharacterMap.has(sceneNumber)) {
      sceneCharacterMap.set(sceneNumber, []);
    }
    const sceneChars = sceneCharacterMap.get(sceneNumber)!;

    // Check if this character already exists in this scene
    const existing = sceneChars.find(c => c.characterName === cleanName);
    if (existing) {
      // Update flags (e.g., character appears both as V.O. and on-screen)
      existing.hasDialogue = true; // Any appearance with dialogue
      if (!isVO) existing.isVoiceOver = false; // If they appear on-screen too, not VO-only
      if (!isOS) existing.isOffScreen = false;
    } else {
      sceneChars.push({
        characterName: cleanName,
        hasDialogue: true,
        isVoiceOver: isVO,
        isOffScreen: isOS,
      });
    }
  }

  return {
    sceneCharacterMap,
    allCharacters: Array.from(allCharacterNames).sort(),
  };
}

/**
 * Builds a Map of line index → scene number for fast lookup.
 * Each line index maps to the scene it belongs to.
 */
function buildLineToSceneIndex(scenes: SceneRef[]): Map<number, string> {
  const map = new Map<number, string>();

  for (const scene of scenes) {
    const sceneNum = String(scene.sceneNumberText || scene.sceneNumber || '');
    if (!sceneNum) continue;

    const startLine = scene.index ?? 0;
    const endLine = scene.lastLine ?? startLine;

    for (let i = startLine; i <= endLine; i++) {
      map.set(i, sceneNum);
    }
  }

  return map;
}
