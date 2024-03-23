import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { MatDialogModule } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LINE_TYPES } from '../../../types/LineTypes'
// scripts to test
import mockFinalDocNextDoor from "../../../testingData/pdfServiceData/finalDocData/nextDoor-2-3-7-11-20.json"
import mockFinalDocRose from "../../../testingData/pdfServiceData/finalDocData/Rose-2-4-5-7-9-lastLooks.json"
import mockFinalDocKidnapped from "../../../testingData/pdfServiceData/finalDocData/nextDoor-2-3-7-11-20.json"
import mockScriptDataForNextDoor from "../../../testingData/pdfServiceData/nextDoor-script-data.json"
import mockPagesData from "../../../testingData/pdfServiceData/nextDoor-pages-data.json"
import nextDoorScenesActual from "../../../testingData/pdfServiceData/finalDocData/nextDoor-2-3-7-11-20-finalDoc-actual.json"
describe('DashboardRightComponent - Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let pdfService: PdfService;
  
  
  const uploadServiceMock = {
    // ACTUAL CAPTURED SCRIPT DATA INJECTED TO COMPONENT
    lineArr: mockScriptDataForNextDoor,
    // THE WHOLE GOD DAMN SCRIPT IN JSON
    pagesArr: mockPagesData,
    // LINE COUNT FOR SOME REASON
    lineCount:[],

  };

  beforeEach(async () => {
    // Simplified mock for PdfService
  
    pdfService = new PdfService(uploadServiceMock as any);
    
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule, NoopAnimationsModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: PdfService, useValue: pdfService },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: LINE_TYPES, useValue: LINE_TYPES },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();


    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.scriptData = pdfService.scriptData;
    console.log(uploadServiceMock.pagesArr)
    component.selected = component.scriptData.filter(scene => 
        ['2', '3', '7', '11', '20'].includes(scene.sceneNumber?.toString())
        );
      component.finalDocument = nextDoorScenesActual
      component.toggleLastLooks();
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

  // it('should match our expected ', () => {
  //   component.scriptData = pdfService.scriptData;
  //   component.selected = component.scriptData.filter(scene => 
  //     ['2', '3', '7', '11', '20'].includes(scene.sceneNumber?.toString())
  //     );
  //   component.finalDocument = nextDoorScenesActual
  //   component.toggleLastLooks();
  //   expect(component.finalDocument).toEqual(nextDoorScenesActual);
  // });

 

  it("should have the same true values", () => {
    const initialFinalDocumentState = { ...pdfService.finalDocument };  

  })

  it("should have the same false values", () => {

  })

  it("should have the same start lines values", () => {


  })

  it("should have the same end lines", () => {

  })

  it('should have continue lines in the same spot on the page', () => {

  })

  it('should have start lines in the same spot on the page', () => {

  });

  it('should have one scene number visible per page', () => {

  })

  it('should be within 5% of the original in terms of diff', () => {
    // here we want a way to diff the object arrays and not do an assertion but more show how close they are in terms of percentage
      // 
  })

  it('should have page numbers and pageNumber text within a reasonable difference of each other - like +/- 3', () => {

  })

  it('should have each page end with an injected break', () => {

  })
  it('should have ', () => {

  })

});
