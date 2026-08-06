import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { LastLooksComponent } from './last-looks.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PdfService } from '../../../services/pdf/pdf.service';
import { UploadService } from '../../../services/upload/upload.service';
import { UndoService } from '../../../services/edit/undo.service';
import { StripeService } from '../../../services/stripe/stripe.service';
import { TokenService } from '../../../services/token/token.service';
import { Router } from '@angular/router';
import { Line } from '../../../types/Line';
import * as kidnappedData from '../last-looks-test-data/kidnapped-scenes-actual.json';
import * as roseData from '../last-looks-test-data/Rose-scenes-actual.json';
import * as nextData from '../last-looks-test-data/next-scenes-actual.json';

type Page = Line[];

/** Minimal PdfService mock — covers only what LastLooksComponent uses in lifecycle hooks. */
class MockPdfService {
  finalDocument = { data: [] as Page[] };
  finalDocumentData$ = {
    subscribe: (_cb: any) => ({ unsubscribe: () => {} }),
  };
  documentReordered$ = {
    subscribe: (_cb: any) => ({ unsubscribe: () => {} }),
  };
  documentRegenerated$ = {
    subscribe: (_cb: any) => ({ unsubscribe: () => {} }),
  };
  isProcessingForServer() { return false; }
  saveDocumentState() {}
  updateLine() {}
  updateLinePosition() {}
  resetToInitialState() {}
  combinePages() { return { condensed: false }; }
}

class MockUploadService {}
class MockStripeService {}
class MockTokenService {}
class MockRouter { navigate = jest.fn(); }
class MockUndoService {
  undoRedo$ = { subscribe: (_cb: any) => ({ unsubscribe: () => {} }) };
}

describe('LastLooksComponent', () => {
  let component: LastLooksComponent;
  let fixture: ComponentFixture<LastLooksComponent>;
  let mockPdfService: MockPdfService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LastLooksComponent],
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: PdfService, useClass: MockPdfService },
        { provide: UploadService, useClass: MockUploadService },
        { provide: StripeService, useClass: MockStripeService },
        { provide: TokenService, useClass: MockTokenService },
        { provide: Router, useClass: MockRouter },
        { provide: UndoService, useClass: MockUndoService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    mockPdfService = TestBed.inject(PdfService) as unknown as MockPdfService;
    fixture = TestBed.createComponent(LastLooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Existing carry-over tests ────────────────────────────────────

  it('should pass the correct number of lines per page for rose-scenes data', () => {
    const documentData = (roseData as any).default || roseData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();
    documentData.forEach((singlePageData: any) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();
      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  it('should pass the correct number of lines per page for kidnapped-scenes data', () => {
    const documentData = (kidnappedData as any).default || kidnappedData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();
    documentData.forEach((singlePageData: any) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();
      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  it('should pass the correct number of lines per page for next-scenes data', () => {
    const documentData = (nextData as any).default || nextData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();
    documentData.forEach((singlePageData: any) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();
      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  // ── Spec 023: Zoom ownership (FR-013, FR-014, FR-015, FR-016) ───

  it('pageScale is bounded by MIN_SCALE 0.25 and MAX_SCALE 2.0', () => {
    expect(component.pageScale).toBeGreaterThanOrEqual(0.25);
    expect(component.pageScale).toBeLessThanOrEqual(2.0);
  });

  it('canZoomOut is false at MIN_SCALE 0.25', () => {
    (component as any).zoomOverride = 0.25;
    expect(component.canZoomOut).toBeFalse();
  });

  it('canZoomIn is false at MAX_SCALE 2.0', () => {
    (component as any).zoomOverride = 2.0;
    expect(component.canZoomIn).toBeFalse();
  });

  it('zoomIn increases pageScale by 0.1', () => {
    (component as any).zoomOverride = 1.0;
    component.zoomIn();
    expect(component.pageScale).toBeCloseTo(1.1, 5);
  });

  it('zoomOut decreases pageScale by 0.1', () => {
    (component as any).zoomOverride = 1.0;
    component.zoomOut();
    expect(component.pageScale).toBeCloseTo(0.9, 5);
  });

  it('zoomIn is capped at MAX_SCALE 2.0', () => {
    (component as any).zoomOverride = 2.0;
    component.zoomIn();
    expect(component.pageScale).toBeLessThanOrEqual(2.0);
  });

  it('zoomOut is capped at MIN_SCALE 0.25', () => {
    (component as any).zoomOverride = 0.25;
    component.zoomOut();
    expect(component.pageScale).toBeGreaterThanOrEqual(0.25);
  });

  it('fitToWidth clears zoomOverride to null', () => {
    (component as any).zoomOverride = 1.5;
    component.fitToWidth();
    expect((component as any).zoomOverride).toBeNull();
  });

  it('isFitZoom is true when zoomMode is fitW', () => {
    (component as any).zoomMode = 'fitW';
    (component as any).zoomOverride = null;
    expect(component.isFitZoom).toBeTrue();
  });

  it('isFitZoom is false when zoomMode is manual', () => {
    (component as any).zoomMode = 'manual';
    (component as any).zoomOverride = 1.2;
    expect(component.isFitZoom).toBeFalse();
  });

  it('isFitPage is true after fitPage()', () => {
    const mockEl = { clientWidth: 816, clientHeight: 1056 };
    (component as any).viewerContainer = { nativeElement: mockEl };
    component.fitPage();
    expect(component.isFitPage).toBeTrue();
    expect(component.isFitZoom).toBeFalse();
  });

  it('fitToWidth sets zoomMode to fitW', () => {
    (component as any).zoomOverride = 1.5;
    (component as any).zoomMode = 'manual';
    component.fitToWidth();
    expect((component as any).zoomMode).toBe('fitW');
    expect((component as any).zoomOverride).toBeNull();
  });

  it('zoomPercent returns Math.round(pageScale * 100)', () => {
    (component as any).zoomOverride = 0.75;
    expect(component.zoomPercent).toBe(75);
    (component as any).zoomOverride = 1.5;
    expect(component.zoomPercent).toBe(150);
  });

  it('pageScale uses zoomOverride when set (FR-013)', () => {
    (component as any).zoomOverride = 1.3;
    expect(component.pageScale).toBeCloseTo(1.3, 5);
  });

  it('pageScale falls back to fitScale when zoomOverride is null (FR-013)', () => {
    (component as any).zoomOverride = null;
    (component as any).fitScale = 0.8;
    expect(component.pageScale).toBeCloseTo(0.8, 5);
  });

  it('fitPage: min(w/816, h/1056) = 1.0 for a page-sized container', () => {
    (component as any).viewerContainer = {
      nativeElement: { clientWidth: 816, clientHeight: 1056 },
    };
    component.fitPage();
    expect((component as any).zoomOverride).toBeCloseTo(1.0, 3);
  });

  it('fitPage: height-limited container produces scale < 1 (FR-016)', () => {
    (component as any).viewerContainer = {
      nativeElement: { clientWidth: 816, clientHeight: 528 },
    };
    component.fitPage();
    // min(816/816, 528/1056) = min(1, 0.5) = 0.5
    expect((component as any).zoomOverride).toBeCloseTo(0.5, 3);
  });

  // ── Spec 023: Rail state (FR-007) ────────────────────────────────

  it('railOpen is true by default (not editing, no manual override)', () => {
    component.editState = false;
    (component as any).railManual = null;
    expect(component.railOpen).toBeTrue();
  });

  it('railOpen is false in auto mode while editing', () => {
    component.editState = true;
    (component as any).railManual = null;
    expect(component.railOpen).toBeFalse();
  });

  it('railOpen follows railManual=true even during editing', () => {
    component.editState = true;
    (component as any).railManual = true;
    expect(component.railOpen).toBeTrue();
  });

  it('railOpen follows railManual=false even when not editing', () => {
    component.editState = false;
    (component as any).railManual = false;
    expect(component.railOpen).toBeFalse();
  });

  it('toggleRail closes an auto-open rail by setting railManual=false', () => {
    component.editState = false;
    (component as any).railManual = null; // auto → open
    component.toggleRail();
    expect((component as any).railManual).toBeFalse();
  });

  it('toggleRail opens an auto-closed rail (in edit mode) by setting railManual=true', () => {
    component.editState = true;
    (component as any).railManual = null; // auto → closed
    component.toggleRail();
    expect((component as any).railManual).toBeTrue();
  });

  it('exiting edit mode via ngOnChanges clears railManual (FR-007)', () => {
    (component as any).railManual = true;
    component.ngOnChanges({
      editState: new SimpleChange(true, false, false),
    });
    expect((component as any).railManual).toBeNull();
  });

  it('entering edit mode via ngOnChanges does NOT clear railManual', () => {
    (component as any).railManual = true;
    component.ngOnChanges({
      editState: new SimpleChange(false, true, false),
    });
    // manual pin is preserved on entry
    expect((component as any).railManual).toBeTrue();
  });

  it('onSaveChanges clears railManual (FR-007)', () => {
    (component as any).railManual = false;
    component.onSaveChanges();
    expect((component as any).railManual).toBeNull();
  });

  it('onResetClick clears railManual (FR-007)', () => {
    (component as any).railManual = true;
    component.onResetClick();
    expect((component as any).railManual).toBeNull();
  });

  // ── Spec 023: Headline breakpoint (FR-010) ──────────────────────

  it('showHeadline is false while editing regardless of window height', () => {
    component.editState = true;
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1000 });
    expect(component.showHeadline).toBeFalse();
  });

  it('showHeadline is false when height < 860 and not editing', () => {
    component.editState = false;
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    expect(component.showHeadline).toBeFalse();
  });

  it('showHeadline is true when height >= 860 and not editing', () => {
    component.editState = false;
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });
    expect(component.showHeadline).toBeTrue();
  });

  it('showHeadline is true at exactly 860px height', () => {
    component.editState = false;
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 860 });
    expect(component.showHeadline).toBeTrue();
  });

  // ── Spec 023: Control bar mode switching (FR-011) ───────────────

  it('onEditPdfClick emits editModeToggle', () => {
    const spy = jest.spyOn(component.editModeToggle, 'emit');
    component.onEditPdfClick();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onSaveChanges emits editModeToggle', () => {
    const spy = jest.spyOn(component.editModeToggle, 'emit');
    component.onSaveChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ── Spec 025: isDoubledPage preserved through handleDocumentReorder / refreshDocument ──

  describe('feature 025 — doubled-page flag pipeline', () => {
    /**
     * Build a minimal two-page document where page 0 looks like a doubled-clone:
     * every line carries isDoubledPage:true (as reorderScenes produces for clones)
     * and page 1 is a regular page with no flag.
     */
    function makeDoubledDocument(): any[][] {
      const doubledPage: any[] = [
        { isDoubledPage: true, docPageIndex: 0, docPageLineIndex: 0, category: 'scene-header', sceneNumberText: '1', visible: 'true' },
        { isDoubledPage: true, docPageIndex: 0, docPageLineIndex: 1, category: 'action', visible: 'true' },
      ];
      const regularPage: any[] = [
        { docPageIndex: 1, docPageLineIndex: 0, category: 'scene-header', sceneNumberText: '2', visible: 'true' },
      ];
      return [doubledPage, regularPage];
    }

    it('handleDocumentReorder preserves isDoubledPage on page[0][0] through the deep-spread', () => {
      (mockPdfService.finalDocument as any).data = makeDoubledDocument();
      (component as any).handleDocumentReorder();

      expect((component as any).currentPage[0].isDoubledPage).toBe(true);
    });

    it('refreshDocument preserves isDoubledPage after handleDocumentReorder runs first', () => {
      (mockPdfService.finalDocument as any).data = makeDoubledDocument();
      (component as any).handleDocumentReorder();

      // Simulate the 10ms documentRegenerated$ callback
      (component as any).refreshDocument();

      expect((component as any).currentPage[0].isDoubledPage).toBe(true);
    });

    it('handleDocumentReorder produces a new array reference for currentPage (ngOnChanges guard)', () => {
      (mockPdfService.finalDocument as any).data = makeDoubledDocument();
      const pageBefore = (component as any).currentPage;

      (component as any).handleDocumentReorder();

      const pageAfter = (component as any).currentPage;
      expect(pageAfter).not.toBe(pageBefore);
    });

    it('refreshDocument produces a new array reference for currentPage (ngOnChanges guard)', () => {
      (mockPdfService.finalDocument as any).data = makeDoubledDocument();
      (component as any).handleDocumentReorder();
      const pageAfterReorder = (component as any).currentPage;

      (component as any).refreshDocument();

      const pageAfterRefresh = (component as any).currentPage;
      expect(pageAfterRefresh).not.toBe(pageAfterReorder);
    });

    it('handleDocumentReorder resets currentPageIndex to 0', () => {
      (mockPdfService.finalDocument as any).data = makeDoubledDocument();
      (component as any).currentPageIndex = 1;

      (component as any).handleDocumentReorder();

      expect((component as any).currentPageIndex).toBe(0);
    });

    it('isDoubledPage is false on regular page after handleDocumentReorder', () => {
      const regularDoc: any[][] = [
        [{ docPageIndex: 0, docPageLineIndex: 0, category: 'scene-header', sceneNumberText: '1', visible: 'true' }],
      ];
      (mockPdfService.finalDocument as any).data = regularDoc;
      (component as any).handleDocumentReorder();

      expect((component as any).currentPage[0].isDoubledPage).toBeFalsy();
    });
  });
});
