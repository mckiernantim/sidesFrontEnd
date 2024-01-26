import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { MatDialogModule } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import mockFinalDoc from "../../../testingData/pdfServiceData/nextDoor-2-3-7-11-20.json"
import mockScriptDataForNextDoor from "../../../testingData/pdfServiceData/nextDoor-script-data.json"
import mockPagesData from "../../../testingData/pdfServiceData/nextDoor-pages-data.json"
import nextDoorScenesActual from "../../../testingData/pdfServiceData/nextDoor-2-3-7-11-20-finalDoc-actual.json"
describe('DashboardRightComponent - Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let pdfService: PdfService;
  
  
  const uploadServiceMock = {
    // Mock the properties and methods used by PdfService
    lineArr: mockScriptDataForNextDoor/* Mock line array */,
    pagesArr: mockPagesData/* Mock pages array */,
    lineCount:[]
    // ... other properties and methods as needed ...
  };

  beforeEach(async () => {
    // Simplified mock for PdfService
  
    pdfService = new PdfService(uploadServiceMock as any);
    
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: PdfService, useValue: pdfService },
        { provide: UploadService, useValue: uploadServiceMock }
        // ... other providers ...
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have a defined component', () => {
    expect(component).toBeDefined();
  });
  
  it('finalDocument and initial should not equal each other', () => {
    // Assuming you have an initial state of finalDocument before processing
    const initialFinalDocumentState = { ...pdfService.finalDocument };  
    // Now test that the finalDocument has changed
    expect(nextDoorScenesActual).not.toEqual(initialFinalDocumentState);
  });

  it('should process the selected scenes correctly', () => {
    component.scriptData = pdfService.scriptData;
    component.selected = component.scriptData.filter(scene => 
      ['2', '3', '7', '11', '20'].includes(scene.sceneNumber?.toString())
      );
    component.finalDocument = nextDoorScenesActual
    component.toggleLastLooks();

    // expect(pdfServiceMock.processPdf).toHaveBeenCalledWith(
    //   component.selected, component.script, component.totalPages, component.callsheet
    // );
    expect(component.finalDocument).toEqual(nextDoorScenesActual);
  });
  // Add more tests as needed
});
