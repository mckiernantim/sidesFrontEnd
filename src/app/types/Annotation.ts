/**
 * Annotation Type Definitions
 *
 * Defines the data structures for the annotation system, including layers,
 * annotation items, and coordinate representations.
 *
 * These types mirror the backend Firestore structure for consistency.
 */

/**
 * Annotation Layer
 *
 * A layer is a collection of annotations for a document. Layers allow for
 * organizing annotations (e.g., "Director's Notes", "Actor Marks") and
 * controlling visibility/permissions.
 */
export interface AnnotationLayer {
  layerId: string;
  documentId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'shared' | 'public';
  permissions: Record<string, 'owner' | 'edit' | 'view'>;
  annotationCount: number;
}

/**
 * Annotation Layer Summary (for list views)
 */
export interface AnnotationLayerSummary {
  layerId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'shared' | 'public';
  annotationCount: number;
  userPermission: 'owner' | 'edit' | 'view';
}

/**
 * Annotation Types
 */
export type AnnotationType =
  | 'note'           // Text note with optional arrow
  | 'highlight'      // Highlighted region
  | 'shape'          // Rectangle, circle, arrow, etc.
  | 'textbox'        // Free-form text box
  | 'redaction';     // Redacted/censored region

/**
 * Shape Subtypes
 */
export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line';

/**
 * Annotation Style Configuration
 */
export interface AnnotationStyle {
  color: string;              // Hex color (e.g., '#FFFF00')
  opacity: number;            // 0.0 to 1.0
  strokeWidth: number;        // Pixels
  fontSize?: number;          // For text annotations
  fontFamily?: string;        // For text annotations
  fontWeight?: string;        // For text annotations (e.g., '900', 'bold')
  fillColor?: string;         // For shapes
  fillOpacity?: number;       // For shapes
  strokeDashArray?: number[]; // For dashed lines [dash, gap]
  shapeType?: ShapeType;      // For shape annotations
}

/**
 * Annotation Item
 *
 * Individual annotation on a document page. Uses normalized coordinates
 * (0-1 range) for resolution independence.
 */
export interface Annotation {
  annotationId: string;
  layerId: string;
  type: AnnotationType;

  // Position (normalized coordinates: 0.0 to 1.0)
  pageIndex: number;
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;

  // Content
  text?: string;

  // Style
  style: AnnotationStyle;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Point in various coordinate systems
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Normalized Point (0.0 to 1.0 range)
 */
export interface NormalizedPoint {
  normalizedX: number;
  normalizedY: number;
}

/**
 * Canvas Point (pixel coordinates)
 */
export interface CanvasPoint {
  canvasX: number;
  canvasY: number;
}

/**
 * PDF Point (raw PDF coordinates from PDF.js)
 */
export interface PdfPoint {
  pdfX: number;
  pdfY: number;
}

/**
 * Bounding Box (normalized coordinates)
 */
export interface NormalizedBoundingBox {
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
}

/**
 * Bounding Box (canvas pixel coordinates)
 */
export interface CanvasBoundingBox {
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Page Dimensions
 */
export interface PageDimensions {
  pageIndex: number;
  width: number;
  height: number;
}

/**
 * Batch Operation Types
 */
export interface AnnotationBatchOperation {
  action: 'create' | 'update' | 'delete';
  annotationId?: string;
  annotation?: Partial<Annotation>;
  updates?: Partial<Annotation>;
}

/**
 * API Request/Response Types
 */

export interface CreateLayerRequest {
  layer: {
    documentId: string;
    name?: string;
    visibility?: 'private' | 'shared' | 'public';
    permissions?: Record<string, 'owner' | 'edit' | 'view'>;
  };
}

export interface CreateLayerResponse {
  success: boolean;
  layerId: string;
  layer: AnnotationLayer;
  message: string;
}

export interface ListLayersResponse {
  success: boolean;
  layers: AnnotationLayerSummary[];
  count: number;
}

export interface GetLayerResponse {
  success: boolean;
  layer: AnnotationLayer;
}

export interface CreateAnnotationRequest {
  documentId: string;
  annotation: Partial<Annotation>;
}

export interface CreateAnnotationResponse {
  success: boolean;
  annotationId: string;
  annotation: Annotation;
  message: string;
}

export interface ListAnnotationsResponse {
  success: boolean;
  annotations: Annotation[];
  count: number;
}

export interface UpdateAnnotationRequest {
  documentId: string;
  layerId: string;
  updates: Partial<Annotation>;
}

export interface UpdateAnnotationResponse {
  success: boolean;
  annotationId: string;
  message: string;
}

export interface BatchOperationsRequest {
  documentId: string;
  operations: AnnotationBatchOperation[];
}

export interface BatchOperationsResponse {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  deleted: number;
}

/**
 * Annotation Tool State
 */
export interface AnnotationToolState {
  activeTool: AnnotationType | null;
  activeLayerId: string | null;
  selectedAnnotationIds: string[];
  isDrawing: boolean;
  drawingStart: CanvasPoint | null;
  drawingCurrent: CanvasPoint | null;
}

/**
 * Annotation Canvas State
 */
export interface AnnotationCanvasState {
  zoom: number;
  panOffset: Point;
  cursorMode: 'select' | 'pan' | 'draw';
  hoveredAnnotationId: string | null;
}

/**
 * Preset Text Box Configuration
 */
export interface TextBoxPreset {
  id: string;
  name: string;
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  normalizedX: number;
  normalizedY: number;
  normalizedWidth?: number;
  normalizedHeight?: number;
  defaultText: string;
  style: AnnotationStyle;
  isSceneMarker?: boolean;
}

/**
 * Predefined Text Box Presets
 */
export const DEFAULT_TEXT_BOX_PRESETS: TextBoxPreset[] = [
  {
    id: 'series-name',
    name: 'Series Name',
    position: 'top-left',
    normalizedX: 0.05,
    normalizedY: 0.05,
    normalizedWidth: 0.3,
    normalizedHeight: 0.05,
    defaultText: 'Series Name',
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 0,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'character-name',
    name: 'Character Name',
    position: 'top-right',
    normalizedX: 0.65,
    normalizedY: 0.05,
    normalizedWidth: 0.3,
    normalizedHeight: 0.05,
    defaultText: 'Character Name',
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 0,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'legal-disclaimer',
    name: 'Legal Disclaimer',
    position: 'bottom-center',
    normalizedX: 0.1,
    normalizedY: 0.95,
    normalizedWidth: 0.8,
    normalizedHeight: 0.04,
    defaultText: 'Performers are not required to learn or memorize lines in advance of their interview.',
    style: {
      color: '#666666',
      opacity: 1.0,
      strokeWidth: 0,
      fontSize: 10,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'scene-marker-1',
    name: 'Scene 1',
    position: 'top-center',
    normalizedX: 0.4,
    normalizedY: 0.15,
    normalizedWidth: 0.2,
    normalizedHeight: 0.05,
    defaultText: 'Scene 1',
    isSceneMarker: true,
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'scene-marker-2',
    name: 'Scene 2',
    position: 'top-center',
    normalizedX: 0.4,
    normalizedY: 0.15,
    normalizedWidth: 0.2,
    normalizedHeight: 0.05,
    defaultText: 'Scene 2',
    isSceneMarker: true,
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'scene-marker-3',
    name: 'Scene 3',
    position: 'top-center',
    normalizedX: 0.4,
    normalizedY: 0.15,
    normalizedWidth: 0.2,
    normalizedHeight: 0.05,
    defaultText: 'Scene 3',
    isSceneMarker: true,
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
    },
  },
  {
    id: 'scene-marker-4',
    name: 'Scene 4',
    position: 'top-center',
    normalizedX: 0.4,
    normalizedY: 0.15,
    normalizedWidth: 0.2,
    normalizedHeight: 0.05,
    defaultText: 'Scene 4',
    isSceneMarker: true,
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
    },
  },
];

/**
 * Color Palette for Annotations
 */
export const DEFAULT_ANNOTATION_COLORS = [
  '#FFFF00', // Yellow (highlight)
  '#FF0000', // Red (important)
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#000000', // Black (redaction)
];

/**
 * Default Annotation Styles by Type
 */
export const DEFAULT_ANNOTATION_STYLES: Record<AnnotationType, AnnotationStyle> = {
  note: {
    color: '#000000',
    opacity: 1.0,
    strokeWidth: 3,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
  },
  highlight: {
    color: '#FFFF00',
    opacity: 0.3,
    strokeWidth: 0,
  },
  shape: {
    color: '#FF0000',
    opacity: 0.0,
    strokeWidth: 3,
    fillColor: 'transparent',
    fillOpacity: 0.0,
    shapeType: 'rectangle',
  },
  textbox: {
    color: '#000000',
    opacity: 1.0,
    strokeWidth: 1,
    fontSize: 16,
    fontFamily: "'Courier Prime', monospace",
    fontWeight: '900',
  },
  redaction: {
    color: '#000000',
    opacity: 1.0,
    strokeWidth: 0,
    fillColor: '#000000',
    fillOpacity: 1.0,
  },
};
