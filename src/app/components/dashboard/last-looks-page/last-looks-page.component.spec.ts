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
  };
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
