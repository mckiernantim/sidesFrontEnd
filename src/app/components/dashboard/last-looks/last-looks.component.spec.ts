import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { LastLooksComponent } from './last-looks.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PdfService } from '../../../services/pdf/pdf.service';
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
    spyOnProperty(window, 'innerHeight').and.returnValue(1000);
    expect(component.showHeadline).toBeFalse();
  });

  it('showHeadline is false when height < 860 and not editing', () => {
    component.editState = false;
    spyOnProperty(window, 'innerHeight').and.returnValue(800);
    expect(component.showHeadline).toBeFalse();
  });

  it('showHeadline is true when height >= 860 and not editing', () => {
    component.editState = false;
    spyOnProperty(window, 'innerHeight').and.returnValue(900);
    expect(component.showHeadline).toBeTrue();
  });

  it('showHeadline is true at exactly 860px height', () => {
    component.editState = false;
    spyOnProperty(window, 'innerHeight').and.returnValue(860);
    expect(component.showHeadline).toBeTrue();
  });

  // ── Spec 023: Control bar mode switching (FR-011) ───────────────

  it('onEditPdfClick emits editModeToggle', () => {
    const spy = spyOn(component.editModeToggle, 'emit');
    component.onEditPdfClick();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onSaveChanges emits editModeToggle', () => {
    const spy = spyOn(component.editModeToggle, 'emit');
    component.onSaveChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
