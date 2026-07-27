import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LastLooksPageComponent } from './last-looks-page.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as kidnappedData from '../last-looks-test-data/kidnapped-scenes-actual.json';
import * as roseData from '../last-looks-test-data/Rose-scenes-actual.json';
import * as nextData from '../last-looks-test-data/next-scenes-actual.json';

describe('LastLooksPageComponent', () => {
  let component: LastLooksPageComponent;
  let fixture: ComponentFixture<LastLooksPageComponent>;
  const linesSelector = '.break ul li';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LastLooksPageComponent],
      schemas: [NO_ERRORS_SCHEMA]
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
    expect(lines.length).toBe(singlePageData.length);
  });

  it('should render the correct number of lines for kidnapped-scenes data', () => {
    const singlePageData = (kidnappedData as any).default[0] || kidnappedData[0];
    component.page = singlePageData;
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css(linesSelector));
    expect(lines.length).toBe(singlePageData.length);
  });

  it('should render the correct number of lines for next-scenes data', () => {
    const singlePageData = (nextData as any).default[0] || nextData[0];
    component.page = singlePageData;
    fixture.detectChanges();

    const lines = fixture.debugElement.queryAll(By.css(linesSelector));
    expect(lines.length).toBe(singlePageData.length);
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
});
