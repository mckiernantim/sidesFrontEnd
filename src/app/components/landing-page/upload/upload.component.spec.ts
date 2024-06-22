import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { UploadComponent } from './upload.component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { environment } from '../../../../environments/environment';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let uploadServiceMock: jest.Mocked<UploadService>;
  let pdfServiceMock: jest.Mocked<PdfService>;
  let routerMock: any;

  beforeEach(async () => {
    uploadServiceMock = {
      postFile: jest.fn(),
      allLines: [],
      individualPages: [],
      lineCount: []
    } as unknown as jest.Mocked<UploadService>;

    pdfServiceMock = {
      initializeData: jest.fn(),
      allLines: [],
      individualPages: []
    } as unknown as jest.Mocked<PdfService>;

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule,
        NoopAnimationsModule // Add NoopAnimationsModule here
      ],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: PdfService, useValue: pdfServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call upload service to post file on handleFileInput', () => {
    const mockFile = new File([''], 'dummy.pdf');
    const mockResponse = { allLines: [], title: 'Dummy Title' };
    uploadServiceMock.postFile.mockReturnValue(of(mockResponse));

    component.handleFileInput({ item: (index: number) => mockFile } as FileList);
    expect(uploadServiceMock.postFile).toHaveBeenCalledWith(mockFile);
    expect(component.allLines).toEqual(mockResponse.allLines);
  });

  it('should process server response and check for page 2', () => {
    const allLines = [
      { text: '1.', category: 'page-number' },
      { text: '2.', category: 'page-number-hidden' }
    ];
    const processedLines = component.processSeverResponseAndCheckForPage2(allLines);
    expect(processedLines[1].category).toBe('page-number-hidden');
  });

  it('should initialize data in ngOnInit if under construction', () => {
    environment.production = false;
    component.ngOnInit();
    expect(component.underConstruction).toBe(true);
    expect(pdfServiceMock.initializeData).toHaveBeenCalled();
  });

  it('should navigate to /download after processing pages', () => {
    const mockPages = [{ filter: jest.fn(() => [{ totalLines: 1 }]) }];
    component.upload.individualPages = mockPages as any;
    component.skipUploadForTest();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/download']);
  });

  // Additional tests for other component functionalities
});
