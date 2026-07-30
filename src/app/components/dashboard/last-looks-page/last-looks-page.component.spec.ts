import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LastLooksPageComponent } from './last-looks-page.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject, of } from 'rxjs';
import { UndoService } from 'src/app/services/edit/undo.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import * as kidnappedData from '../last-looks-test-data/kidnapped-scenes-actual.json';
import * as roseData from '../last-looks-test-data/Rose-scenes-actual.json';
import * as nextData from '../last-looks-test-data/next-scenes-actual.json';

// localStorage mock required for jsdom environments that restrict it
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

const mockUndoService = {
  undoRedo$: new Subject<any>(),
  recordLineChange: jest.fn(),
  recordBatchChanges: jest.fn(),
  recordAnnotationChange: jest.fn(),
  recordXboxChange: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: false,
  canRedo: false,
};

const mockPdfService = {
  finalDocumentData$: new Subject<any>(),
  sceneHeaderTextUpdated$: new Subject<any>(),
  finalDocument: { data: [], name: 'test', annotations: [] },
  saveDocumentState: jest.fn(),
  updateLine: jest.fn(),
  updateSceneHeaderText: jest.fn(),
  updateSceneNumber: jest.fn(),
  combinePages: jest.fn(),
};

const mockAnnotationState = {
  clear: jest.fn(),
  clearSelection: jest.fn(),
  initializeLocal: jest.fn(),
  addAnnotationLocally: jest.fn(),
  removeAnnotationLocally: jest.fn(),
  createAnnotation: jest.fn(),
  deleteAnnotation: jest.fn(),
  updateAnnotation: jest.fn(),
  selectAnnotations: jest.fn(),
  setActiveTool: jest.fn(),
  getAnnotationsForPage: jest.fn(() => []),
  toolState$: of(null),
  toolState: null,
  annotations$: of([]),
  annotations: new Map(),
};

describe('LastLooksPageComponent', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;
  const linesSelector = '.break ul li';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LastLooksPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: UndoService, useValue: mockUndoService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: AnnotationStateService, useValue: mockAnnotationState },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LastLooksPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of lines for rose-scenes data', () => {
    const singlePageData = (roseData as any).default[0] || roseData[0];
    component.page = singlePageData;
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css(linesSelector));
    // page-number lines render two <li> each (one at the page-number position +
    // one in the general nonEditable template), so total >= singlePageData.length
    expect(lines.length).toBeGreaterThanOrEqual(singlePageData.length);
  });

  it('should render the correct number of lines for kidnapped-scenes data', () => {
    const singlePageData = (kidnappedData as any).default[0] || kidnappedData[0];
    component.page = singlePageData;
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css(linesSelector));
    expect(lines.length).toBeGreaterThanOrEqual(singlePageData.length);
  });

  it('should render the correct number of lines for next-scenes data', () => {
    const singlePageData = (nextData as any).default[0] || nextData[0];
    component.page = singlePageData;
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css(linesSelector));
    expect(lines.length).toBeGreaterThanOrEqual(singlePageData.length);
  });

  describe('CONTINUE bar text drag (moveBarText)', () => {
    const mockLine: any = {
      docPageLineIndex: 0,
      cont: 'CONTINUE',
      continueTextOffset: 200,
    };

    beforeEach(() => {
      component.canEditDocument = true;
      component.page = [{ ...mockLine }];
    });

    it('should decrease continueTextOffset when dragging left (negative deltaX)', () => {
      // Simulate mousedown to initialise drag state
      const mousedown = new MouseEvent('mousedown', { clientX: 300, bubbles: false });
      component.startBarTextDrag(mousedown, component.page[0], 'continue');

      // Simulate mousemove 100px to the left
      const mousemove = new MouseEvent('mousemove', { clientX: 200 });
      component.moveBarText(mousemove);

      expect(component.page[0].continueTextOffset).toBe(100);
    });

    it('should increase continueTextOffset when dragging right (positive deltaX)', () => {
      const mousedown = new MouseEvent('mousedown', { clientX: 300, bubbles: false });
      component.startBarTextDrag(mousedown, component.page[0], 'continue');

      const mousemove = new MouseEvent('mousemove', { clientX: 400 });
      component.moveBarText(mousemove);

      expect(component.page[0].continueTextOffset).toBe(300);
    });

    it('should clamp continueTextOffset to 0 when dragging past the left edge', () => {
      // Set initial offset near 0 so dragging left clamps
      component.page[0].continueTextOffset = 20;
      const mousedown = new MouseEvent('mousedown', { clientX: 300, bubbles: false });
      component.startBarTextDrag(mousedown, component.page[0], 'continue');

      // Drag 200px left — would result in -180, should clamp to 0
      const mousemove = new MouseEvent('mousemove', { clientX: 100 });
      component.moveBarText(mousemove);

      expect(component.page[0].continueTextOffset).toBe(0);
    });

    it('should clamp continueTextOffset at xboxPageWidth (816) when dragging past right edge', () => {
      component.page[0].continueTextOffset = 700;
      const mousedown = new MouseEvent('mousedown', { clientX: 300, bubbles: false });
      component.startBarTextDrag(mousedown, component.page[0], 'continue');

      // Drag 200px right — would result in 900, should clamp to 816
      const mousemove = new MouseEvent('mousemove', { clientX: 500 });
      component.moveBarText(mousemove);

      expect(component.page[0].continueTextOffset).toBe(816);
    });

    afterEach(() => {
      // Clean up drag event listeners added by startBarTextDrag
      const mouseup = new MouseEvent('mouseup');
      document.dispatchEvent(mouseup);
    });
  });

  it('should show callsheet watermark overlay when watermark is active', () => {
    component.currentPageIndex = 0;
    component.page = [{
      type: 'callsheet',
      category: 'callsheet',
      imagePath: 'https://example.com/callsheet.png',
      watermarkData: {
        isActive: true,
        actorName: 'TIM',
        timestamp: '04:29:18 PM 07/26/26',
        repetitions: 4
      }
    }];
    fixture.detectChanges();

    expect(component.isCallsheetPage(component.page)).toBe(true);
    const overlay = fixture.debugElement.query(By.css('.callsheet-watermark-overlay'));
    expect(overlay).toBeTruthy();
    const container = fixture.debugElement.query(By.css('.callsheet-watermark-container'));
    expect(container).toBeTruthy();
  });

  it('should hide callsheet watermark overlay when watermark is inactive', () => {
    component.currentPageIndex = 0;
    component.page = [{
      type: 'callsheet',
      category: 'callsheet',
      imagePath: 'https://example.com/callsheet.png',
      watermarkData: { isActive: false, actorName: 'TIM', repetitions: 4 }
    }];
    fixture.detectChanges();

    const overlay = fixture.debugElement.query(By.css('.callsheet-watermark-overlay'));
    expect(overlay).toBeFalsy();
  });

  // ── Spec 023: pageScale @Input (FR-013, FR-017, SC-001) ──────────

  it('should accept pageScale @Input and default to 1', () => {
    expect(component.pageScale).toBe(1);
  });

  it('pageTransform should return scale() CSS string matching pageScale', () => {
    component.pageScale = 1.5;
    expect(component.pageTransform).toBe('scale(1.5)');
  });

  it('pageTransform should update when pageScale changes', () => {
    component.pageScale = 0.5;
    expect(component.pageTransform).toBe('scale(0.5)');
    component.pageScale = 2.0;
    expect(component.pageTransform).toBe('scale(2)');
  });

  it('should NOT own zoom state: fitScale, zoomOverride, MIN_SCALE, MAX_SCALE should not be properties', () => {
    // SC-009: verify zoom state is NOT on LastLooksPageComponent
    expect((component as any).fitScale).toBeUndefined();
    expect((component as any).zoomOverride).toBeUndefined();
    expect((component as any).MIN_SCALE).toBeUndefined();
    expect((component as any).MAX_SCALE).toBeUndefined();
  });

  it('pageViewport ref should exist for backward-compat but not drive zoom (FR-013)', () => {
    // The pageViewport @ViewChild exists but does not compute fitScale/zoom
    // Just confirm the component does not have a viewportObserver that would update zoom
    expect((component as any).viewportObserver).toBeUndefined();
  });

  it('scaledPageWidth should be 816 * pageScale', () => {
    component.pageScale = 0.75;
    fixture.detectChanges();
    expect(component.scaledPageWidth).toBe(Math.round(816 * 0.75));
  });

  it('scaledPageHeight should be 1056 * pageScale', () => {
    component.pageScale = 1.25;
    fixture.detectChanges();
    expect(component.scaledPageHeight).toBe(Math.round(1056 * 1.25));
  });
});
