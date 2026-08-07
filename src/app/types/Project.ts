/**
 * Project Types for Sides-Ways Scheduling Projects feature.
 * Spec: .speckit/specs/027-scheduling-projects/spec.md
 * Data model: .speckit/specs/027-scheduling-projects/data-model.md
 */

// ─────────────────────────────────────────────
// Project Metadata (Firestore: projects/{projectId})
// ─────────────────────────────────────────────

/**
 * Project metadata stored in Firestore.
 * Never contains screenplay content — content lives in GCS.
 */
export interface Project {
  id: string;
  userId: string;
  title: string;
  originalname: string;
  sceneCount: number;
  pageCount: number;
  characterCount: number;
  contentPath: string;
  contentBytes: number;
  contentVersion: number;
  optInAt: string;       // ISO 8601 — when the user acknowledged storage (FR-009)
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}

// ─────────────────────────────────────────────
// SavedScene (Firestore: savedScenes/{sceneId})
// ─────────────────────────────────────────────

/**
 * Self-contained saved scene snapshot.
 * Survives deletion of any project it originated from.
 */
export interface SavedScene {
  id: string;
  userId: string;
  sceneNumber: string;
  sceneHeader: string;
  sourceTitle: string;
  characters: string[];
  pageCount: number;
  compressedContent: string;  // gzip+base64 of the scene's Line[]
  _compressed: boolean;       // always true (mirrors scheduleCompression.js convention)
  createdAt: string;          // ISO 8601
}

// ─────────────────────────────────────────────
// ProjectContent — alias for the stored ClassifiedScriptOutput shape
// ─────────────────────────────────────────────

/**
 * The full classified script output as delivered by the upload/scan pipeline.
 * Used as the content type for GET /project/:id responses.
 * Matches the shape the upload flow puts into UploadService / PdfService.
 */
export interface ProjectContent {
  title: string;
  originalname: string;
  createdAt: string;
  allLines: unknown[];
  individualPages: unknown[];
  allChars: string[];
  firstAndLastLinesOfScenes: unknown[];
  pdfMetadata?: unknown;
  warnings?: unknown[];
  scanSummary?: unknown;
  aiValidated?: boolean;
}
