import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { MatDialogModule } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import nextDoorEntireScript from './nextDoorEntireScript.json';
import nextDoorMockResult from './nextDoor-2-3-7-11-20.json';

fdescribe('DashboardRightComponent - Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let uploadServiceMock: Partial<UploadService>;
  let pdfServiceMock: Partial<PdfService>;

  beforeEach(async () => {
    // Mock the services and their methods
    uploadServiceMock = {
      generatePdf: jasmine.createSpy('generatePdf').and.returnValue(of({ /* Mocked response */ })),
      // ...other mocked methods and properties
    };
    pdfServiceMock = {
      processPdf: jasmine.createSpy('processPdf'),
      // ...other mocked methods and properties
    };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: PdfService, useValue: pdfServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should process the selected scenes correctly', () => {
    // Mock the scene data
    component.scriptData = nextDoorEntireScript;
  
    // Mock the scene selection
    component.selected = nextDoorEntireScript.filter(scene => 
      ['2', '3', '7', '11', '20'].includes(scene.sceneNumber?.toString())
    );
  
    // Call the method to process the PDF
    component.toggleLastLooks();
  
    // Verify that the processPdf method was called with correct arguments
    expect(pdfServiceMock.processPdf).toHaveBeenCalledWith(component.selected, component.script, component.totalPages, component.callsheet);
  
    // If you want to verify the final document against the mock result
    expect(component.finalDocument).toEqual(nextDoorMockResult);
  });

  // Tests will be added here
});
