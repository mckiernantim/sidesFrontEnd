/**
 * Coordinate Transformation Service
 *
 * Manages coordinate system transformations for the annotation system.
 *
 * Coordinate Systems:
 * 1. PDF Coordinates - Raw coordinates from PDF.js (bottom-left origin)
 * 2. Normalized Coordinates - Resolution-independent (0.0 to 1.0 range)
 * 3. Canvas Coordinates - Pixel coordinates for HTML5 canvas (top-left origin)
 * 4. Page-Local Coordinates - Coordinates relative to a single page
 * 5. Global Document Coordinates - Coordinates relative to entire document
 *
 * Why Normalized Coordinates?
 * - Resolution independence (works across different screen sizes/zoom levels)
 * - Easier storage (small decimal values instead of large pixel counts)
 * - Consistent across PDF dimensions
 */

import { Injectable } from '@angular/core';
import {
  Point,
  NormalizedPoint,
  CanvasPoint,
  PdfPoint,
  NormalizedBoundingBox,
  CanvasBoundingBox,
  PageDimensions,
} from '../../types/Annotation';

@Injectable({
  providedIn: 'root'
})
export class CoordinateService {
  constructor() {}

  // ─────────────────────────────────────────────
  // PDF ↔ Normalized Conversions
  // ─────────────────────────────────────────────

  /**
   * Convert PDF coordinates to normalized (0-1 range)
   * PDF uses bottom-left origin, we normalize to top-left
   *
   * @param pdfX - X coordinate from PDF.js
   * @param pdfY - Y coordinate from PDF.js (bottom-left origin)
   * @param pageWidth - Page width in PDF units
   * @param pageHeight - Page height in PDF units
   * @returns Normalized coordinates (0.0 to 1.0)
   */
  pdfToNormalized(pdfX: number, pdfY: number, pageWidth: number, pageHeight: number): NormalizedPoint {
    return {
      normalizedX: pdfX / pageWidth,
      // Flip Y-axis (PDF is bottom-left, we want top-left)
      normalizedY: 1.0 - (pdfY / pageHeight),
    };
  }

  /**
   * Convert normalized coordinates to PDF coordinates
   *
   * @param normalizedX - Normalized X (0.0 to 1.0)
   * @param normalizedY - Normalized Y (0.0 to 1.0)
   * @param pageWidth - Page width in PDF units
   * @param pageHeight - Page height in PDF units
   * @returns PDF coordinates
   */
  normalizedToPdf(normalizedX: number, normalizedY: number, pageWidth: number, pageHeight: number): PdfPoint {
    return {
      pdfX: normalizedX * pageWidth,
      // Flip Y-axis back to bottom-left origin
      pdfY: (1.0 - normalizedY) * pageHeight,
    };
  }

  // ─────────────────────────────────────────────
  // Normalized ↔ Canvas Conversions
  // ─────────────────────────────────────────────

  /**
   * Convert normalized coordinates to canvas pixel coordinates
   *
   * @param normalizedX - Normalized X (0.0 to 1.0)
   * @param normalizedY - Normalized Y (0.0 to 1.0)
   * @param canvasWidth - Canvas width in pixels
   * @param canvasHeight - Canvas height in pixels
   * @returns Canvas pixel coordinates
   */
  normalizedToCanvas(normalizedX: number, normalizedY: number, canvasWidth: number, canvasHeight: number): CanvasPoint {
    return {
      canvasX: normalizedX * canvasWidth,
      canvasY: normalizedY * canvasHeight,
    };
  }

  /**
   * Convert canvas pixel coordinates to normalized
   *
   * @param canvasX - Canvas X in pixels
   * @param canvasY - Canvas Y in pixels
   * @param canvasWidth - Canvas width in pixels
   * @param canvasHeight - Canvas height in pixels
   * @returns Normalized coordinates (0.0 to 1.0)
   */
  canvasToNormalized(canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number): NormalizedPoint {
    return {
      normalizedX: canvasX / canvasWidth,
      normalizedY: canvasY / canvasHeight,
    };
  }

  /**
   * Convert normalized bounding box to canvas bounding box
   *
   * @param box - Normalized bounding box
   * @param canvasWidth - Canvas width in pixels
   * @param canvasHeight - Canvas height in pixels
   * @returns Canvas bounding box in pixels
   */
  normalizedBoxToCanvas(box: NormalizedBoundingBox, canvasWidth: number, canvasHeight: number): CanvasBoundingBox {
    return {
      canvasX: box.normalizedX * canvasWidth,
      canvasY: box.normalizedY * canvasHeight,
      canvasWidth: box.normalizedWidth * canvasWidth,
      canvasHeight: box.normalizedHeight * canvasHeight,
    };
  }

  /**
   * Convert canvas bounding box to normalized bounding box
   *
   * @param box - Canvas bounding box
   * @param canvasWidth - Canvas width in pixels
   * @param canvasHeight - Canvas height in pixels
   * @returns Normalized bounding box (0.0 to 1.0 range)
   */
  canvasBoxToNormalized(box: CanvasBoundingBox, canvasWidth: number, canvasHeight: number): NormalizedBoundingBox {
    return {
      normalizedX: box.canvasX / canvasWidth,
      normalizedY: box.canvasY / canvasHeight,
      normalizedWidth: box.canvasWidth / canvasWidth,
      normalizedHeight: box.canvasHeight / canvasHeight,
    };
  }

  // ─────────────────────────────────────────────
  // Global Document Coordinate Transformations
  // ─────────────────────────────────────────────

  /**
   * Convert page-local normalized coordinates to global document coordinates
   *
   * Global Y = (pageIndex * pageHeight) + (normalizedY * pageHeight)
   *
   * @param normalizedX - Normalized X on page
   * @param normalizedY - Normalized Y on page
   * @param pageIndex - Zero-based page index
   * @param pageHeight - Height of a single page in pixels
   * @returns Global document coordinates in pixels
   */
  pageLocalToGlobal(normalizedX: number, normalizedY: number, pageIndex: number, pageHeight: number, pageWidth: number): Point {
    return {
      x: normalizedX * pageWidth,
      y: (pageIndex * pageHeight) + (normalizedY * pageHeight),
    };
  }

  /**
   * Convert global document coordinates to page-local normalized coordinates
   *
   * @param globalX - Global X coordinate in pixels
   * @param globalY - Global Y coordinate in pixels
   * @param pageHeight - Height of a single page in pixels
   * @param pageWidth - Width of a single page in pixels
   * @returns Page index and normalized coordinates
   */
  globalToPageLocal(globalX: number, globalY: number, pageHeight: number, pageWidth: number): {
    pageIndex: number;
    normalizedX: number;
    normalizedY: number;
  } {
    const pageIndex = Math.floor(globalY / pageHeight);
    const pageLocalY = globalY % pageHeight;

    return {
      pageIndex,
      normalizedX: globalX / pageWidth,
      normalizedY: pageLocalY / pageHeight,
    };
  }

  /**
   * Get the page index for a given global Y coordinate
   *
   * @param globalY - Global Y coordinate in pixels
   * @param pageHeight - Height of a single page in pixels
   * @returns Zero-based page index
   */
  getPageIndexForGlobalY(globalY: number, pageHeight: number): number {
    return Math.floor(globalY / pageHeight);
  }

  /**
   * Get the global Y offset for a given page index
   *
   * @param pageIndex - Zero-based page index
   * @param pageHeight - Height of a single page in pixels
   * @returns Global Y offset in pixels
   */
  getGlobalYOffsetForPage(pageIndex: number, pageHeight: number): number {
    return pageIndex * pageHeight;
  }

  // ─────────────────────────────────────────────
  // Zoom & Pan Transformations
  // ─────────────────────────────────────────────

  /**
   * Apply zoom transformation to canvas coordinates
   *
   * @param canvasX - Canvas X coordinate
   * @param canvasY - Canvas Y coordinate
   * @param zoom - Zoom factor (1.0 = 100%, 2.0 = 200%, etc.)
   * @returns Zoomed coordinates
   */
  applyZoom(canvasX: number, canvasY: number, zoom: number): CanvasPoint {
    return {
      canvasX: canvasX * zoom,
      canvasY: canvasY * zoom,
    };
  }

  /**
   * Apply pan offset to canvas coordinates
   *
   * @param canvasX - Canvas X coordinate
   * @param canvasY - Canvas Y coordinate
   * @param panX - Pan offset X
   * @param panY - Pan offset Y
   * @returns Panned coordinates
   */
  applyPan(canvasX: number, canvasY: number, panX: number, panY: number): CanvasPoint {
    return {
      canvasX: canvasX + panX,
      canvasY: canvasY + panY,
    };
  }

  /**
   * Apply both zoom and pan transformations
   *
   * @param canvasX - Canvas X coordinate
   * @param canvasY - Canvas Y coordinate
   * @param zoom - Zoom factor
   * @param panX - Pan offset X
   * @param panY - Pan offset Y
   * @returns Transformed coordinates
   */
  applyZoomAndPan(canvasX: number, canvasY: number, zoom: number, panX: number, panY: number): CanvasPoint {
    return {
      canvasX: (canvasX * zoom) + panX,
      canvasY: (canvasY * zoom) + panY,
    };
  }

  /**
   * Reverse zoom and pan transformations (screen to canvas)
   *
   * @param screenX - Screen X coordinate
   * @param screenY - Screen Y coordinate
   * @param zoom - Zoom factor
   * @param panX - Pan offset X
   * @param panY - Pan offset Y
   * @returns Canvas coordinates before zoom/pan
   */
  screenToCanvas(screenX: number, screenY: number, zoom: number, panX: number, panY: number): CanvasPoint {
    return {
      canvasX: (screenX - panX) / zoom,
      canvasY: (screenY - panY) / zoom,
    };
  }

  // ─────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────

  /**
   * Clamp normalized coordinates to valid range (0.0 to 1.0)
   *
   * @param normalizedX - Normalized X
   * @param normalizedY - Normalized Y
   * @returns Clamped coordinates
   */
  clampNormalized(normalizedX: number, normalizedY: number): NormalizedPoint {
    return {
      normalizedX: Math.max(0.0, Math.min(1.0, normalizedX)),
      normalizedY: Math.max(0.0, Math.min(1.0, normalizedY)),
    };
  }

  /**
   * Clamp normalized bounding box to valid range
   *
   * @param box - Normalized bounding box
   * @returns Clamped bounding box
   */
  clampNormalizedBox(box: NormalizedBoundingBox): NormalizedBoundingBox {
    const clampedStart = this.clampNormalized(box.normalizedX, box.normalizedY);
    const clampedEnd = this.clampNormalized(
      box.normalizedX + box.normalizedWidth,
      box.normalizedY + box.normalizedHeight
    );

    return {
      normalizedX: clampedStart.normalizedX,
      normalizedY: clampedStart.normalizedY,
      normalizedWidth: clampedEnd.normalizedX - clampedStart.normalizedX,
      normalizedHeight: clampedEnd.normalizedY - clampedStart.normalizedY,
    };
  }

  /**
   * Check if normalized coordinates are within valid range
   *
   * @param normalizedX - Normalized X
   * @param normalizedY - Normalized Y
   * @returns True if coordinates are valid (0.0 to 1.0)
   */
  isValidNormalized(normalizedX: number, normalizedY: number): boolean {
    return normalizedX >= 0.0 && normalizedX <= 1.0 &&
           normalizedY >= 0.0 && normalizedY <= 1.0;
  }

  /**
   * Calculate distance between two points
   *
   * @param p1 - First point
   * @param p2 - Second point
   * @returns Euclidean distance
   */
  distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a point is inside a bounding box
   *
   * @param point - Point to check
   * @param box - Bounding box
   * @returns True if point is inside box
   */
  isPointInBox(point: CanvasPoint, box: CanvasBoundingBox): boolean {
    return point.canvasX >= box.canvasX &&
           point.canvasX <= box.canvasX + box.canvasWidth &&
           point.canvasY >= box.canvasY &&
           point.canvasY <= box.canvasY + box.canvasHeight;
  }

  /**
   * Check if two bounding boxes overlap
   *
   * @param box1 - First bounding box
   * @param box2 - Second bounding box
   * @returns True if boxes overlap
   */
  doBoxesOverlap(box1: CanvasBoundingBox, box2: CanvasBoundingBox): boolean {
    return !(
      box1.canvasX + box1.canvasWidth < box2.canvasX ||
      box2.canvasX + box2.canvasWidth < box1.canvasX ||
      box1.canvasY + box1.canvasHeight < box2.canvasY ||
      box2.canvasY + box2.canvasHeight < box1.canvasY
    );
  }

  /**
   * Create a bounding box from two points (e.g., drag start and end)
   *
   * @param start - Start point
   * @param end - End point
   * @returns Bounding box
   */
  createBoxFromPoints(start: CanvasPoint, end: CanvasPoint): CanvasBoundingBox {
    const minX = Math.min(start.canvasX, end.canvasX);
    const minY = Math.min(start.canvasY, end.canvasY);
    const maxX = Math.max(start.canvasX, end.canvasX);
    const maxY = Math.max(start.canvasY, end.canvasY);

    return {
      canvasX: minX,
      canvasY: minY,
      canvasWidth: maxX - minX,
      canvasHeight: maxY - minY,
    };
  }

  /**
   * Round coordinates to specified decimal places
   * Useful for reducing storage size and avoiding floating-point precision issues
   *
   * @param value - Value to round
   * @param decimals - Number of decimal places (default: 4)
   * @returns Rounded value
   */
  round(value: number, decimals: number = 4): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Round normalized coordinates to specified decimal places
   *
   * @param normalizedX - Normalized X
   * @param normalizedY - Normalized Y
   * @param decimals - Number of decimal places (default: 4)
   * @returns Rounded coordinates
   */
  roundNormalized(normalizedX: number, normalizedY: number, decimals: number = 4): NormalizedPoint {
    return {
      normalizedX: this.round(normalizedX, decimals),
      normalizedY: this.round(normalizedY, decimals),
    };
  }

  /**
   * Round normalized bounding box to specified decimal places
   *
   * @param box - Normalized bounding box
   * @param decimals - Number of decimal places (default: 4)
   * @returns Rounded bounding box
   */
  roundNormalizedBox(box: NormalizedBoundingBox, decimals: number = 4): NormalizedBoundingBox {
    return {
      normalizedX: this.round(box.normalizedX, decimals),
      normalizedY: this.round(box.normalizedY, decimals),
      normalizedWidth: this.round(box.normalizedWidth, decimals),
      normalizedHeight: this.round(box.normalizedHeight, decimals),
    };
  }
}
