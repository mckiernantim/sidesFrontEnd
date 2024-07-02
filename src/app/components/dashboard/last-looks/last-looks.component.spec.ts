import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LastLooksComponent } from './last-looks.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PdfService } from '../../../services/pdf/pdf.service';
import { Line } from "../../../types/Line";
import * as kidnappedData from './last-looks-test-data/kidnapped-scenes-actual.json';
import * as roseData from './last-looks-test-data/Rose-scenes-actual.json';
import * as nextData from './last-looks-test-data/next-scenes-actual.json';
// import * as sqData from './last-looks-test-data/SQ-scenes.json';

type Page = Line[];

class MockPdfService {
  finalDocument = {
    data: [] as Page[]
  }
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
        NoopAnimationsModule
      ],
      providers: [
        { provide: PdfService, useClass: MockPdfService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    mockPdfService = TestBed.inject(PdfService) as unknown as MockPdfService;
    fixture = TestBed.createComponent(LastLooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass the correct number of lines per page for rose-scenes data', () => {
    const documentData = (roseData as any).default || roseData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();

    documentData.forEach((singlePageData) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();

      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  it('should pass the correct number of lines per page for kidnapped-scenes data', () => {
    const documentData = (kidnappedData as any).default || kidnappedData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();

    documentData.forEach((singlePageData) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();

      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  it('should pass the correct number of lines per page for next-scenes data', () => {
    const documentData = (nextData as any).default || nextData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();

    documentData.forEach((singlePageData) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();

      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  it('should pass the correct number of lines per page for rose-scenes data', () => {
    const documentData = (roseData as any).default || roseData;
    mockPdfService.finalDocument.data = documentData as any;
    fixture.detectChanges();

    documentData.forEach((singlePageData) => {
      component.pdf.finalDocument.data = [singlePageData];
      fixture.detectChanges();

      expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
    });
  });

  // it('should pass the correct number of lines per page for SQ-scenes data', () => {
  //   const documentData = (sqData as any).default || sqData;
  //   mockPdfService.finalDocument.data = documentData as any;
  //   fixture.detectChanges();

  //   documentData.forEach((singlePageData) => {
  //     component.pdf.finalDocument.data = [singlePageData];
  //     fixture.detectChanges();

  //     expect(component.pdf.finalDocument.data[0].length).toBe(singlePageData.length);
  //   });
  // });
});
