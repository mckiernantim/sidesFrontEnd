import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { UploadComponent } from './upload.component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let uploadServiceSpy: jasmine.SpyObj<UploadService>;
  let pdfServiceSpy: jasmine.SpyObj<PdfService>;

  beforeEach(async () => {
    uploadServiceSpy = jasmine.createSpyObj('UploadService', ['postFile']);
    pdfServiceSpy = jasmine.createSpyObj('PdfService', ['initializeData']);

    await TestBed.configureTestingModule({
      declarations: [UploadComponent],
      imports: [HttpClientTestingModule, MatDialogModule, RouterTestingModule],
      providers: [
        { provide: UploadService, useValue: uploadServiceSpy },
        { provide: PdfService, useValue: pdfServiceSpy }
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
    const mockResponse = { /* Mocked data */ };
    uploadServiceSpy.postFile.and.returnValue(of(mockResponse));

    component.handleFileInput({ item: (index: number) => mockFile } as FileList);
    expect(uploadServiceSpy.postFile).toHaveBeenCalledWith(mockFile);
    // Additional expectations and verifications can be added here
  });

  // Additional tests for other component functionalities
});
