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
});
