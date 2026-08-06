import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Subject, BehaviorSubject } from 'rxjs';

import { LastLooksPageComponent } from './last-looks-page.component';
import { PageAlertComponent } from '../page-alert/page-alert.component';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { UndoService } from 'src/app/services/edit/undo.service';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';

const DOUBLED_PAGE_TOOLTIP = 'This page was duplicated because scenes that shared it were reordered. Only the lines for the scene being shot here are shown.';

function makePdfServiceMock() {
  return {
    finalDocumentData$: new BehaviorSubject<any>(null),
    sceneHeaderTextUpdated$: new Subject<any>(),
    finalDocument: null,
    updateLine: jest.fn(),
  };
}

/** MouseEvent with a real Element target so `.closest()` works in handlers. */
function makeMouseEvent(type: string, init: MouseEventInit = {}): MouseEvent {
  const target = document.createElement('div');
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

function makeUndoServiceMock() {
  return {
    undoRedo$: new Subject<any>(),
  };
}

function makeAnnotationStateMock() {
  return {
    isAnnotationMode$: new BehaviorSubject<boolean>(false),
    activeLayer$: new BehaviorSubject<any>(null),
    annotations$: new BehaviorSubject<any[]>([]),
    clearSelection: jest.fn(),
    toolState$: new BehaviorSubject<any>({ activeTool: 'select' }),
    canvasState$: new BehaviorSubject<any>({}),
    getSelectedAnnotations: jest.fn().mockReturnValue([]),
  };
}

function makeUndoServiceWithXbox() {
  return {
    undoRedo$: new Subject<any>(),
    recordXboxChange: jest.fn(),
    recordLineChange: jest.fn(),
    recordBatchChanges: jest.fn(),
    canUndo: false,
    canRedo: false,
    undo: jest.fn(),
    redo: jest.fn(),
    peekLastUndo: jest.fn().mockReturnValue(null),
  };
}

/** A minimal skipped-line stub for page data. */
function makeSkippedLine(docPageLineIndex: number, ypos: number): any {
  return {
    category: 'action',
    visible: 'false',
    hidden: '',
    calculatedYpos: String(ypos),
    docPageLineIndex,
    text: 'some action',
    sceneNumber: '1',
  };
}

describe('LastLooksPageComponent — doubled page toast (feature 025)', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;
  let pdfServiceMock: ReturnType<typeof makePdfServiceMock>;

  beforeEach(async () => {
    pdfServiceMock = makePdfServiceMock();

    await TestBed.configureTestingModule({
      declarations: [LastLooksPageComponent, PageAlertComponent],
      providers: [
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: UndoService, useValue: makeUndoServiceMock() },
        { provide: AnnotationStateService, useValue: makeAnnotationStateMock() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LastLooksPageComponent);
    component = fixture.componentInstance;
  });

  it('shows <app-page-alert> when page[0].isDoubledPage is true', () => {
    component.page = [{ isDoubledPage: true }];
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('app-page-alert'));
    expect(alert).not.toBeNull();
  });

  it('hides <app-page-alert> when page[0].isDoubledPage is false', () => {
    component.page = [{ isDoubledPage: false }];
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('app-page-alert'));
    expect(alert).toBeNull();
  });

  it('hides <app-page-alert> when isDoubledPage is undefined', () => {
    component.page = [{}];
    fixture.detectChanges();
    const alert = fixture.debugElement.query(By.css('app-page-alert'));
    expect(alert).toBeNull();
  });

  it('passes correct label "Doubled page" to <app-page-alert>', () => {
    component.page = [{ isDoubledPage: true }];
    fixture.detectChanges();
    const alertEl = fixture.debugElement.query(By.css('app-page-alert'));
    expect(alertEl).not.toBeNull();
    const alertInstance = alertEl.componentInstance as PageAlertComponent;
    expect(alertInstance.label).toBe('Doubled page');
  });

  it('passes correct tooltipText to <app-page-alert>', () => {
    component.page = [{ isDoubledPage: true }];
    fixture.detectChanges();
    const alertEl = fixture.debugElement.query(By.css('app-page-alert'));
    expect(alertEl).not.toBeNull();
    const alertInstance = alertEl.componentInstance as PageAlertComponent;
    expect(alertInstance.tooltipText).toBe(DOUBLED_PAGE_TOOLTIP);
  });

  it('toast disappears when isDoubledPage changes to false on the same page', () => {
    component.page = [{ isDoubledPage: true }];
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-page-alert'))).not.toBeNull();

    component.page = [{ isDoubledPage: false }];
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-page-alert'))).toBeNull();
  });

  it('isDoubledPage getter returns true when page[0].isDoubledPage is true', () => {
    component.page = [{ isDoubledPage: true }];
    expect(component.isDoubledPage).toBe(true);
  });

  it('isDoubledPage getter returns false when page[0].isDoubledPage is false', () => {
    component.page = [{ isDoubledPage: false }];
    expect(component.isDoubledPage).toBe(false);
  });

  it('isDoubledPage getter returns false when page is empty', () => {
    component.page = [];
    expect(component.isDoubledPage).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// REGRESSION: original (auto-generated) xboxes are draggable and resizable
// Spec: feature/fix-original-xbox-drag
// ---------------------------------------------------------------------------
describe('LastLooksPageComponent — original xbox drag/resize (fix regression)', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;
  let pdfServiceMock: ReturnType<typeof makePdfServiceMock>;
  let undoServiceMock: ReturnType<typeof makeUndoServiceWithXbox>;
  let annotationStateMock: ReturnType<typeof makeAnnotationStateMock>;

  beforeEach(async () => {
    pdfServiceMock = makePdfServiceMock();
    undoServiceMock = makeUndoServiceWithXbox();
    annotationStateMock = makeAnnotationStateMock();

    await TestBed.configureTestingModule({
      declarations: [LastLooksPageComponent, PageAlertComponent],
      providers: [
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: UndoService, useValue: undoServiceMock },
        { provide: AnnotationStateService, useValue: annotationStateMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LastLooksPageComponent);
    component = fixture.componentInstance;

    pdfServiceMock.finalDocument = { data: [], xboxes: [] } as any;
    component.canEditDocument = true;
    component.currentPageIndex = 0;
  });

  it('getEditableXboxSections() includes auto-generated stubs (not just freestanding)', () => {
    // Page with two skipped lines that form one contiguous stub
    component.page = [
      makeSkippedLine(10, 600),
      makeSkippedLine(11, 580),
    ];

    const sections = component.getEditableXboxSections();
    expect(sections.length).toBe(1);
    // stub is NOT freestanding — the fix is that it still appears in the editable list
    const freestandingXboxes = ((pdfServiceMock.finalDocument as any).xboxes || [])
      .filter((x: any) => x.isFreestanding);
    expect(freestandingXboxes.length).toBe(0); // no freestanding added
    expect(sections[0].originalIndex).toBeDefined();
  });

  it('getEditableXboxSections() includes both freestanding and stub sections', () => {
    // One skipped-line stub
    component.page = [makeSkippedLine(10, 600)];

    // One freestanding xbox saved in doc
    (pdfServiceMock.finalDocument as any).xboxes = [{
      id: 'xbox-freestand-1',
      pageIndex: 0,
      top: 100,
      bottom: 200,
      left: 88,
      right: 739,
      isFreestanding: true,
      lineIds: [],
    }];

    const sections = component.getEditableXboxSections();
    expect(sections.length).toBe(2);
    const ids = sections.map(s => s.originalIndex);
    expect(ids).toContain('xbox-freestand-1');
  });

  it('selectXbox() promotes a stub to a saved xbox record', () => {
    component.page = [makeSkippedLine(20, 500)];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    expect(sections.length).toBe(1);
    const stubKey = sections[0].originalIndex;

    // Before interaction, the stub is NOT in doc.xboxes
    const beforeSaved = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(beforeSaved.find((x: any) => x.id === stubKey)).toBeUndefined();

    component.selectXbox(stubKey, makeMouseEvent('click'));

    // After selectXbox, a saved record now exists
    const afterSaved = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(afterSaved.length).toBe(1);
    expect(component.selectedXboxIndex).toBe(afterSaved[0].id);
  });

  it('startXboxDrag() promotes a stub and sets selectedXboxIndex to saved id', () => {
    component.page = [makeSkippedLine(30, 400)];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    const stubKey = sections[0].originalIndex;

    component.startXboxDrag(stubKey, makeMouseEvent('mousedown', { clientX: 200, clientY: 300 }));

    const savedXboxes = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(savedXboxes.length).toBe(1);
    expect(component.selectedXboxIndex).toBe(savedXboxes[0].id);
    // Clean up global listeners
    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('startXboxResize() promotes a stub and sets selectedXboxIndex to saved id', () => {
    component.page = [makeSkippedLine(40, 350)];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    const stubKey = sections[0].originalIndex;

    component.startXboxResize(stubKey, 'bottom-right', makeMouseEvent('mousedown', { clientX: 100, clientY: 100 }));

    const savedXboxes = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(savedXboxes.length).toBe(1);
    expect(component.selectedXboxIndex).toBe(savedXboxes[0].id);
    // Clean up global listeners
    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('deleteXbox() promotes a stub, saves it, then removes it', () => {
    component.page = [makeSkippedLine(50, 450)];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    const stubKey = sections[0].originalIndex;

    component.deleteXbox(stubKey, makeMouseEvent('mousedown'));

    // After delete, no xboxes should remain (promoted then immediately deleted)
    const remaining = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(remaining.length).toBe(0);
  });

  it('freestanding xbox remains draggable after the fix', () => {
    component.page = [];
    (pdfServiceMock.finalDocument as any).xboxes = [{
      id: 'xbox-free-2',
      pageIndex: 0,
      top: 200,
      bottom: 400,
      left: 88,
      right: 739,
      isFreestanding: true,
      lineIds: [],
    }];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    expect(sections.length).toBe(1);
    expect(sections[0].originalIndex).toBe('xbox-free-2');

    component.startXboxDrag('xbox-free-2', makeMouseEvent('mousedown', { clientX: 300, clientY: 300 }));

    expect(component.selectedXboxIndex).toBe('xbox-free-2');
    // Still only one xbox in doc (not re-promoted)
    const savedXboxes = (pdfServiceMock.finalDocument as any).xboxes as any[];
    expect(savedXboxes.length).toBe(1);
    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('THE BUG: promoting an original stub marks isFreestanding so overlay binds to saved geometry', () => {
    component.page = [makeSkippedLine(60, 500)];
    fixture.detectChanges();

    const stubKey = component.getEditableXboxSections()[0].originalIndex;
    component.selectXbox(stubKey, makeMouseEvent('click'));

    const saved = (pdfServiceMock.finalDocument as any).xboxes[0];
    expect(saved.isFreestanding).toBe(true);

    // Overlay must now expose the saved id (not the stub stableKey) so drag/resize paint.
    const displayed = component.getDisplayedSkippedSections();
    expect(displayed.some(s => s.originalIndex === saved.id)).toBe(true);
    expect(displayed.some(s => s.originalIndex === stubKey)).toBe(false);
  });

  it('THE BUG: drag after promoting an original stub updates saved xbox geometry in the overlay', () => {
    component.page = [makeSkippedLine(70, 480)];
    component.pageScale = 1;
    fixture.detectChanges();

    const stubKey = component.getEditableXboxSections()[0].originalIndex;
    const startTop = component.getEditableXboxSections()[0].top;

    component.startXboxDrag(stubKey, makeMouseEvent('mousedown', { clientX: 200, clientY: 300 }));
    const savedId = component.selectedXboxIndex as string;
    const savedBefore = (pdfServiceMock.finalDocument as any).xboxes.find((x: any) => x.id === savedId);
    expect(savedBefore.isFreestanding).toBe(true);

    // Move 40px down in screen space (= 40 page units at scale 1)
    component.handleXboxDragMove(makeMouseEvent('mousemove', { clientX: 200, clientY: 340 }));

    const savedAfter = (pdfServiceMock.finalDocument as any).xboxes.find((x: any) => x.id === savedId);
    expect(savedAfter.top).toBe(startTop + 40);

    // Overlay must read the updated geometry from the saved record
    const overlay = component.getDisplayedSkippedSections().find(s => s.originalIndex === savedId);
    expect(overlay).toBeDefined();
    expect(overlay!.top).toBe(startTop + 40);

    document.dispatchEvent(new MouseEvent('mouseup'));
  });

  it('saved xbox without isFreestanding still appears as editable overlay (legacy promoted stubs)', () => {
    component.page = [makeSkippedLine(80, 450)];
    (pdfServiceMock.finalDocument as any).xboxes = [{
      id: 'xbox-legacy-1',
      pageIndex: 0,
      top: 300,
      bottom: 500,
      left: 88,
      right: 739,
      // intentionally missing isFreestanding — old promote path
      lineIds: [80],
    }];
    fixture.detectChanges();

    const sections = component.getEditableXboxSections();
    expect(sections.some(s => s.originalIndex === 'xbox-legacy-1')).toBe(true);
    // Stub for the same lines must not also appear
    expect(sections.filter(s => s.originalIndex === 'xbox-legacy-1').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Spec 026 — X-box reveal: START bar restoration on scene-header
// ---------------------------------------------------------------------------
describe('LastLooksPageComponent — X-box reveal — START bar restoration (spec 026)', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;
  let pdfServiceMock: ReturnType<typeof makePdfServiceMock>;
  let undoServiceMock: ReturnType<typeof makeUndoServiceWithXbox>;

  /** Minimal scene-header line stub */
  function makeSceneHeader(docPageLineIndex: number, calculatedYpos?: string): any {
    return {
      category: 'scene-header',
      visible: 'false',
      hidden: '',
      docPageLineIndex,
      text: 'INT. KITCHEN - DAY',
      sceneNumber: '1',
      calculatedYpos: calculatedYpos ?? '100px',
    };
  }

  beforeEach(async () => {
    pdfServiceMock = makePdfServiceMock();
    undoServiceMock = makeUndoServiceWithXbox();

    await TestBed.configureTestingModule({
      declarations: [LastLooksPageComponent, PageAlertComponent],
      providers: [
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: UndoService, useValue: undoServiceMock },
        { provide: AnnotationStateService, useValue: makeAnnotationStateMock() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LastLooksPageComponent);
    component = fixture.componentInstance;

    pdfServiceMock.finalDocument = { data: [], xboxes: [] } as any;
    component.canEditDocument = true;
    component.currentPageIndex = 0;
  });

  // ---- bar restoration on reveal ----------------------------------------

  it('sets bar: bar on scene-header when setXboxLinesVisibleInPage restores visible to true', () => {
    const header = makeSceneHeader(100, '100px');
    component.page = [header];

    (component as any)['setXboxLinesVisibleInPage']([100], true, 'Test');

    expect(component.page[0].bar).toBe('bar');
  });

  it('does NOT modify bar on non-scene-header lines when restoring visibility', () => {
    const actionLine: any = {
      category: 'action',
      visible: 'false',
      hidden: '',
      docPageLineIndex: 200,
      text: 'She runs.',
      calculatedYpos: '100px',
    };
    component.page = [actionLine];

    (component as any)['setXboxLinesVisibleInPage']([200], true, 'Test');

    expect(component.page[0].bar).toBeUndefined();
  });

  it('does NOT overwrite bar when scene-header already has bar: bar', () => {
    const header = makeSceneHeader(101, '100px');
    header.bar = 'bar';
    header.barY = 92;
    component.page = [header];
    pdfServiceMock.updateLine.mockClear();

    (component as any)['setXboxLinesVisibleInPage']([101], true, 'Test');

    // bar must still be 'bar' and pdfService.updateLine should NOT be called
    // a second time with bar-related properties (the restoreStartBarOnReveal no-op)
    expect(component.page[0].bar).toBe('bar');
    // Only the visibility updateLine call fires — no second call from restoreStartBarOnReveal
    const barCalls = pdfServiceMock.updateLine.mock.calls.filter(
      (args: any[]) => args[2] && args[2].bar !== undefined
    );
    expect(barCalls.length).toBe(0);
  });

  it('does NOT restore bar when isVisible is false (hiding lines should not add bars)', () => {
    const header: any = {
      category: 'scene-header',
      visible: 'true',
      hidden: '',
      docPageLineIndex: 102,
      text: 'EXT. PARK - DAY',
      calculatedYpos: '100px',
    };
    component.page = [header];

    (component as any)['setXboxLinesVisibleInPage']([102], false, 'Test');

    expect(component.page[0].bar).toBeUndefined();
  });

  // ---- barY / calculatedBarY computation ----------------------------------

  it('computes calculatedBarY from calculatedYpos when barY is missing', () => {
    const header = makeSceneHeader(103, '100px');
    component.page = [header];

    (component as any)['setXboxLinesVisibleInPage']([103], true, 'Test');

    // calculatedBarY = (100 + 20) + 'px' = '120px'
    expect(component.page[0].calculatedBarY).toBe('120px');
    // barY = parseInt('120px') / 1.3 ≈ 92.307...
    expect(component.page[0].barY).toBeCloseTo(120 / 1.3, 3);
  });

  it('uses fallback barY = 40 when calculatedYpos is absent', () => {
    const header = makeSceneHeader(104);
    delete header.calculatedYpos;
    component.page = [header];

    (component as any)['setXboxLinesVisibleInPage']([104], true, 'Test');

    expect(component.page[0].barY).toBe(40);
  });

  it('sets startTextOffset = 10 on bar restoration', () => {
    const header = makeSceneHeader(105, '200px');
    component.page = [header];

    (component as any)['setXboxLinesVisibleInPage']([105], true, 'Test');

    expect(component.page[0].startTextOffset).toBe(10);
  });

  // ---- pdfService.updateLine propagation ----------------------------------

  it('calls pdfService.updateLine with updated line after bar restoration', () => {
    const header = makeSceneHeader(106, '150px');
    component.page = [header];
    pdfServiceMock.updateLine.mockClear();

    (component as any)['setXboxLinesVisibleInPage']([106], true, 'Test');

    // At least one updateLine call must carry bar: 'bar'
    const barCall = pdfServiceMock.updateLine.mock.calls.find(
      (args: any[]) => args[2] && args[2].bar === 'bar'
    );
    expect(barCall).toBeDefined();
    expect(barCall![1]).toBe(0); // lineIndex = 0
  });

  // ---- integration: drag/resize path via recomputeXboxOwnedLineIds --------

  it('restores bar on scene-header revealed by recomputeXboxOwnedLineIds (drag/resize path)', () => {
    // xboxPageHeight = 1056; calculatedYpos = '500px' => svgY = 1056 - 500 = 556
    // xbox bounds top=600, bottom=900 → svgY 556 is OUTSIDE → line leaves xbox → toShow
    const header = makeSceneHeader(110, '500px');
    component.page = [header];

    const xboxId = 'xbox-drag-test-1';
    (pdfServiceMock.finalDocument as any).xboxes = [{
      id: xboxId,
      pageIndex: 0,
      top: 600,
      bottom: 900,
      left: 88,
      right: 739,
      isFreestanding: true,
      lineIds: [110],
    }];

    (component as any)['recomputeXboxOwnedLineIds'](xboxId, 'Drag X-box');

    expect(component.page[0].bar).toBe('bar');
  });

  // ---- integration: delete path via deleteXbox ----------------------------

  it('restores bar on scene-header when xbox is deleted via deleteXbox', () => {
    const header = makeSceneHeader(120, '300px');
    component.page = [header];

    const xboxId = 'xbox-delete-test-1';
    (pdfServiceMock.finalDocument as any).xboxes = [{
      id: xboxId,
      pageIndex: 0,
      top: 100,
      bottom: 500,
      left: 88,
      right: 739,
      isFreestanding: true,
      lineIds: [120],
    }];

    component.deleteXbox(xboxId);

    expect(component.page[0].bar).toBe('bar');
  });
});
