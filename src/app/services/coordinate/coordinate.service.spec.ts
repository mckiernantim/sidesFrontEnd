/**
 * Unit Tests for CoordinateService
 *
 * Tests all coordinate transformation functions to ensure accuracy
 * across different coordinate systems.
 */

import { TestBed } from '@angular/core/testing';
import { CoordinateService } from './coordinate.service';
import {
  NormalizedBoundingBox,
  CanvasBoundingBox,
  CanvasPoint,
} from '../../types/Annotation';

describe('CoordinateService', () => {
  let service: CoordinateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // PDF ↔ Normalized Conversions
  // ─────────────────────────────────────────────

  describe('pdfToNormalized', () => {
    it('should convert PDF coordinates to normalized (0-1 range)', () => {
      const result = service.pdfToNormalized(100, 200, 400, 800);
      expect(result.normalizedX).toBeCloseTo(0.25);
      expect(result.normalizedY).toBeCloseTo(0.75); // Flipped Y-axis
    });

    it('should handle origin (0,0) correctly', () => {
      const result = service.pdfToNormalized(0, 0, 400, 800);
      expect(result.normalizedX).toBe(0);
      expect(result.normalizedY).toBe(1.0); // Bottom-left becomes top-left
    });

    it('should handle max coordinates correctly', () => {
      const result = service.pdfToNormalized(400, 800, 400, 800);
      expect(result.normalizedX).toBe(1.0);
      expect(result.normalizedY).toBe(0); // Top becomes bottom after flip
    });
  });

  describe('normalizedToPdf', () => {
    it('should convert normalized to PDF coordinates', () => {
      const result = service.normalizedToPdf(0.25, 0.75, 400, 800);
      expect(result.pdfX).toBe(100);
      expect(result.pdfY).toBe(200);
    });

    it('should be inverse of pdfToNormalized', () => {
      const original = { pdfX: 150, pdfY: 300 };
      const normalized = service.pdfToNormalized(original.pdfX, original.pdfY, 400, 800);
      const back = service.normalizedToPdf(normalized.normalizedX, normalized.normalizedY, 400, 800);
      expect(back.pdfX).toBeCloseTo(original.pdfX);
      expect(back.pdfY).toBeCloseTo(original.pdfY);
    });
  });

  // ─────────────────────────────────────────────
  // Normalized ↔ Canvas Conversions
  // ─────────────────────────────────────────────

  describe('normalizedToCanvas', () => {
    it('should convert normalized to canvas pixel coordinates', () => {
      const result = service.normalizedToCanvas(0.5, 0.5, 800, 600);
      expect(result.canvasX).toBe(400);
      expect(result.canvasY).toBe(300);
    });

    it('should handle edge coordinates', () => {
      const topLeft = service.normalizedToCanvas(0, 0, 800, 600);
      expect(topLeft.canvasX).toBe(0);
      expect(topLeft.canvasY).toBe(0);

      const bottomRight = service.normalizedToCanvas(1, 1, 800, 600);
      expect(bottomRight.canvasX).toBe(800);
      expect(bottomRight.canvasY).toBe(600);
    });
  });

  describe('canvasToNormalized', () => {
    it('should convert canvas pixels to normalized', () => {
      const result = service.canvasToNormalized(400, 300, 800, 600);
      expect(result.normalizedX).toBe(0.5);
      expect(result.normalizedY).toBe(0.5);
    });

    it('should be inverse of normalizedToCanvas', () => {
      const original = { normalizedX: 0.75, normalizedY: 0.25 };
      const canvas = service.normalizedToCanvas(original.normalizedX, original.normalizedY, 800, 600);
      const back = service.canvasToNormalized(canvas.canvasX, canvas.canvasY, 800, 600);
      expect(back.normalizedX).toBeCloseTo(original.normalizedX);
      expect(back.normalizedY).toBeCloseTo(original.normalizedY);
    });
  });

  describe('normalizedBoxToCanvas', () => {
    it('should convert normalized bounding box to canvas', () => {
      const box: NormalizedBoundingBox = {
        normalizedX: 0.25,
        normalizedY: 0.5,
        normalizedWidth: 0.5,
        normalizedHeight: 0.25,
      };

      const result = service.normalizedBoxToCanvas(box, 800, 600);

      expect(result.canvasX).toBe(200);
      expect(result.canvasY).toBe(300);
      expect(result.canvasWidth).toBe(400);
      expect(result.canvasHeight).toBe(150);
    });
  });

  describe('canvasBoxToNormalized', () => {
    it('should convert canvas bounding box to normalized', () => {
      const box: CanvasBoundingBox = {
        canvasX: 200,
        canvasY: 300,
        canvasWidth: 400,
        canvasHeight: 150,
      };

      const result = service.canvasBoxToNormalized(box, 800, 600);

      expect(result.normalizedX).toBe(0.25);
      expect(result.normalizedY).toBe(0.5);
      expect(result.normalizedWidth).toBe(0.5);
      expect(result.normalizedHeight).toBe(0.25);
    });
  });

  // ─────────────────────────────────────────────
  // Global Document Coordinate Transformations
  // ─────────────────────────────────────────────

  describe('pageLocalToGlobal', () => {
    it('should convert page-local to global coordinates', () => {
      // Page 0, middle of page
      const page0 = service.pageLocalToGlobal(0.5, 0.5, 0, 1000, 800);
      expect(page0.x).toBe(400);
      expect(page0.y).toBe(500);

      // Page 2, top of page
      const page2 = service.pageLocalToGlobal(0.5, 0.0, 2, 1000, 800);
      expect(page2.x).toBe(400);
      expect(page2.y).toBe(2000);
    });
  });

  describe('globalToPageLocal', () => {
    it('should convert global to page-local coordinates', () => {
      const result = service.globalToPageLocal(400, 2500, 1000, 800);
      expect(result.pageIndex).toBe(2);
      expect(result.normalizedX).toBe(0.5);
      expect(result.normalizedY).toBe(0.5);
    });

    it('should handle page boundaries correctly', () => {
      // Exactly at page boundary
      const result = service.globalToPageLocal(400, 2000, 1000, 800);
      expect(result.pageIndex).toBe(2);
      expect(result.normalizedY).toBe(0);
    });
  });

  describe('getPageIndexForGlobalY', () => {
    it('should return correct page index for global Y', () => {
      expect(service.getPageIndexForGlobalY(500, 1000)).toBe(0);
      expect(service.getPageIndexForGlobalY(1500, 1000)).toBe(1);
      expect(service.getPageIndexForGlobalY(2500, 1000)).toBe(2);
    });

    it('should handle exact page boundaries', () => {
      expect(service.getPageIndexForGlobalY(0, 1000)).toBe(0);
      expect(service.getPageIndexForGlobalY(1000, 1000)).toBe(1);
      expect(service.getPageIndexForGlobalY(2000, 1000)).toBe(2);
    });
  });

  describe('getGlobalYOffsetForPage', () => {
    it('should return correct global Y offset', () => {
      expect(service.getGlobalYOffsetForPage(0, 1000)).toBe(0);
      expect(service.getGlobalYOffsetForPage(1, 1000)).toBe(1000);
      expect(service.getGlobalYOffsetForPage(5, 1000)).toBe(5000);
    });
  });

  // ─────────────────────────────────────────────
  // Zoom & Pan Transformations
  // ─────────────────────────────────────────────

  describe('applyZoom', () => {
    it('should apply zoom transformation', () => {
      const result = service.applyZoom(100, 200, 2.0);
      expect(result.canvasX).toBe(200);
      expect(result.canvasY).toBe(400);
    });
  });

  describe('applyPan', () => {
    it('should apply pan offset', () => {
      const result = service.applyPan(100, 200, 50, -25);
      expect(result.canvasX).toBe(150);
      expect(result.canvasY).toBe(175);
    });
  });

  describe('applyZoomAndPan', () => {
    it('should apply zoom then pan', () => {
      const result = service.applyZoomAndPan(100, 200, 2.0, 50, -25);
      expect(result.canvasX).toBe(250); // (100 * 2) + 50
      expect(result.canvasY).toBe(375); // (200 * 2) - 25
    });
  });

  describe('screenToCanvas', () => {
    it('should reverse zoom and pan transformations', () => {
      const original = { x: 100, y: 200 };
      const zoomed = service.applyZoomAndPan(original.x, original.y, 2.0, 50, -25);
      const back = service.screenToCanvas(zoomed.canvasX, zoomed.canvasY, 2.0, 50, -25);
      expect(back.canvasX).toBeCloseTo(original.x);
      expect(back.canvasY).toBeCloseTo(original.y);
    });
  });

  // ─────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────

  describe('clampNormalized', () => {
    it('should clamp coordinates to 0.0-1.0 range', () => {
      const result1 = service.clampNormalized(-0.5, 1.5);
      expect(result1.normalizedX).toBe(0.0);
      expect(result1.normalizedY).toBe(1.0);

      const result2 = service.clampNormalized(0.5, 0.7);
      expect(result2.normalizedX).toBe(0.5);
      expect(result2.normalizedY).toBe(0.7);
    });
  });

  describe('isValidNormalized', () => {
    it('should return true for valid normalized coordinates', () => {
      expect(service.isValidNormalized(0.5, 0.5)).toBe(true);
      expect(service.isValidNormalized(0.0, 1.0)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(service.isValidNormalized(-0.1, 0.5)).toBe(false);
      expect(service.isValidNormalized(0.5, 1.1)).toBe(false);
      expect(service.isValidNormalized(1.5, -0.5)).toBe(false);
    });
  });

  describe('distance', () => {
    it('should calculate Euclidean distance', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(service.distance(p1, p2)).toBe(5);
    });

    it('should return 0 for same point', () => {
      const p = { x: 100, y: 200 };
      expect(service.distance(p, p)).toBe(0);
    });
  });

  describe('isPointInBox', () => {
    it('should return true if point is inside box', () => {
      const point: CanvasPoint = { canvasX: 250, canvasY: 350 };
      const box: CanvasBoundingBox = {
        canvasX: 200,
        canvasY: 300,
        canvasWidth: 100,
        canvasHeight: 100,
      };
      expect(service.isPointInBox(point, box)).toBe(true);
    });

    it('should return false if point is outside box', () => {
      const point: CanvasPoint = { canvasX: 150, canvasY: 250 };
      const box: CanvasBoundingBox = {
        canvasX: 200,
        canvasY: 300,
        canvasWidth: 100,
        canvasHeight: 100,
      };
      expect(service.isPointInBox(point, box)).toBe(false);
    });

    it('should return true for point on box edge', () => {
      const point: CanvasPoint = { canvasX: 200, canvasY: 300 };
      const box: CanvasBoundingBox = {
        canvasX: 200,
        canvasY: 300,
        canvasWidth: 100,
        canvasHeight: 100,
      };
      expect(service.isPointInBox(point, box)).toBe(true);
    });
  });

  describe('doBoxesOverlap', () => {
    it('should return true for overlapping boxes', () => {
      const box1: CanvasBoundingBox = {
        canvasX: 100,
        canvasY: 100,
        canvasWidth: 100,
        canvasHeight: 100,
      };
      const box2: CanvasBoundingBox = {
        canvasX: 150,
        canvasY: 150,
        canvasWidth: 100,
        canvasHeight: 100,
      };
      expect(service.doBoxesOverlap(box1, box2)).toBe(true);
    });

    it('should return false for non-overlapping boxes', () => {
      const box1: CanvasBoundingBox = {
        canvasX: 100,
        canvasY: 100,
        canvasWidth: 50,
        canvasHeight: 50,
      };
      const box2: CanvasBoundingBox = {
        canvasX: 200,
        canvasY: 200,
        canvasWidth: 50,
        canvasHeight: 50,
      };
      expect(service.doBoxesOverlap(box1, box2)).toBe(false);
    });
  });

  describe('createBoxFromPoints', () => {
    it('should create correct box from two points', () => {
      const start: CanvasPoint = { canvasX: 100, canvasY: 200 };
      const end: CanvasPoint = { canvasX: 300, canvasY: 400 };
      const box = service.createBoxFromPoints(start, end);

      expect(box.canvasX).toBe(100);
      expect(box.canvasY).toBe(200);
      expect(box.canvasWidth).toBe(200);
      expect(box.canvasHeight).toBe(200);
    });

    it('should handle points in reverse order', () => {
      const start: CanvasPoint = { canvasX: 300, canvasY: 400 };
      const end: CanvasPoint = { canvasX: 100, canvasY: 200 };
      const box = service.createBoxFromPoints(start, end);

      expect(box.canvasX).toBe(100);
      expect(box.canvasY).toBe(200);
      expect(box.canvasWidth).toBe(200);
      expect(box.canvasHeight).toBe(200);
    });
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(service.round(0.123456, 2)).toBe(0.12);
      expect(service.round(0.123456, 4)).toBe(0.1235);
      expect(service.round(1.999999, 2)).toBe(2.0);
    });

    it('should default to 4 decimal places', () => {
      expect(service.round(0.123456789)).toBe(0.1235);
    });
  });

  describe('roundNormalized', () => {
    it('should round normalized coordinates', () => {
      const result = service.roundNormalized(0.123456, 0.987654, 2);
      expect(result.normalizedX).toBe(0.12);
      expect(result.normalizedY).toBe(0.99);
    });
  });
});
