/**
 * FunData Types
 *
 * User activity stats displayed on the profile page.
 * "Accurate" stats are tracked incrementally in Firestore.
 * "Fun" stats are computed from the accurate ones on the backend.
 */

/** Accurate stats that are tracked and stored in Firestore */
export interface AccurateStats {
  /** Total scripts uploaded and processed */
  scriptsProcessed: number;

  /** Total lines scanned across all scripts */
  linesCrawled: number;

  /** Total scenes detected across all scripts */
  scenesFound: number;

  /** Total unique characters identified across all scripts */
  charactersDiscovered: number;

  /** Total sides PDFs generated */
  sidesCreated: number;

  /** Total pages in generated sides PDFs */
  pagesGenerated: number;

  /** Total production schedules created */
  schedulesCreated: number;

  /** Sum of (characters per scene) across all scripts — for "circles not drawn" */
  totalCharacterAppearances: number;
}

/** Fun/whimsical stats computed from the accurate ones */
export interface FunStats {
  /** Estimated minutes saved vs doing by hand (pagesGenerated × 8) */
  minutesSaved: number;

  /** Character appearances that didn't need circling (totalCharacterAppearances) */
  circlesNotDrawn: number;

  /** Stress breaks not needed (minutesSaved / 7) */
  cigarettesNotSmoked: number;
}

/** Full stats response from the /fundata API */
export interface FunDataResponse {
  success: boolean;
  stats: {
    accurate: AccurateStats;
    fun: FunStats;
    updatedAt: string | null;
  };
}
