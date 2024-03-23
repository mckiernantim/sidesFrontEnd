import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { MatDialogModule } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LINE_TYPES } from '../../../types/LineTypes';
// scripts to test
const BASE_PATH = '../../../testingData/pdfServiceData/finalDocData';

import mockLinesDataForNextDoor from '../../../testingData/pdfServiceData/finalDocData/NEXT DOOR/NEXT DOOR-lineArr-mock-data.json';
import mockPagesDataForNextDoor from '../../../testingData/pdfServiceData/finalDocData/NEXT DOOR/NEXT DOOR-pagesArr-mock-data.json';
import nextDoorMockFinalDoc from '../../../testingData/pdfServiceData/finalDocData/NEXT DOOR/NEXT DOOR[2,3,7,11,20].json';

import mockLinesDataForTheFinalRose from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-lineArr-mock-data.json';
import mockPagesDataForTheFinalRose from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-pagesArr-mock-data.json';
import theFinalRoseMockFinalDoc from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE[2,4,5,7,9].json';

import mockLinesDataForKinapped from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-lineArr-mock-data.json';
import mockPagesDataForKinapped from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-pagesArr-mock-data.json';
import kidnappedMockFinalDoc from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED[2,4,5,7,10,13].json';

import mockPagesDataForNoteworthy from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-pagesArr-mock-data.json';
import mockLinesDataForNoteworthy from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-lineArr-mock-data.json';
import noterworthyMockFinalDoc from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY[1,2,5,11,12,22,28].json';

const extractSceneNumbers = (filePath) => {
  //
  const match = filePath.match(/\[(.*?)\]/);
  return match ? match[1].split(',').map(Number) : [];
};
const testCases = [
  // {
  //   name: "NEXT DOOR",
  //   lineDataPath: `${BASE_PATH}/NEXT DOOR/NEXT DOOR-lineArr-mock-data.json`,
  //   pageDataPath: `${BASE_PATH}/NEXT DOOR/NEXT DOOR-pagesArr-mock-data.json`,
  //   finalDocPath: `${BASE_PATH}/NEXT DOOR/NEXT DOOR[2,3,7,11,20].json`,
  //   scenes: extractSceneNumbers(`${BASE_PATH}/NEXT DOOR/NEXT DOOR[2,3,7,11,20].json`)
  // },
  // {
  //   name: "THE FINAL ROSE",
  //   lineDataPath: `${BASE_PATH}/THE FINAL ROSE/THE FINAL ROSE-lineArr-mock-data.json`,
  //   pageDataPath: `${BASE_PATH}/THE FINAL ROSE/THE FINAL ROSE-pagesArr-mock-data.json`,
  //   finalDocPath: `${BASE_PATH}/THE FINAL ROSE/THE FINAL ROSE[2,4,5,7,9].json`,
  //   scenes: extractSceneNumbers(`${BASE_PATH}/THE FINAL ROSE/THE FINAL ROSE[2,4,5,7,9].json`)
  // },
  // {
  //   name: "KIDNAPPED",
  //   lineDataPath: `${BASE_PATH}/KIDNAPPED/KIDNAPPED-lineArr-mock-data.json`,
  //   pageDataPath: `${BASE_PATH}/KIDNAPPED/KIDNAPPED-pagesArr-mock-data.json`,
  //   finalDocPath: `${BASE_PATH}/KIDNAPPED/KIDNAPPED[2,4,5,7,10,13].json`,
  //   scenes: extractSceneNumbers(`${BASE_PATH}/KIDNAPPED/KIDNAPPED[2,4,5,7,10,13].json`)
  // },
  {
    name: 'NOTEWORTHY',
    lineDataPath: `${BASE_PATH}/NOTEWORTHY/NOTEWORTHY-lineArr-mock-data.json`,
    pageDataPath: `${BASE_PATH}/NOTEWORTHY/NOTEWORTHY-pagesArr-mock-data.json`,
    finalDocPath: `${BASE_PATH}/NOTEWORTHY/NOTEWORTHY[1,2,5,11,12,22,28].json`,
    scenes: extractSceneNumbers(
      `${BASE_PATH}/NOTEWORTHY/NOTEWORTHY[1,2,5,11,12,22,28].json`
    ),
  },
];
testCases.forEach(
  ({ name, lineDataPath, pageDataPath, finalDocPath, scenes }) => {
    describe(`DashboardRightComponent - ${name} Scene Selection and PDF Generation`, () => {
      let component;
      beforeEach(async () => {
        // Dynamic import of data
        const lineData = (await import(lineDataPath)).default;
        const pageData = (await import(pageDataPath)).default;
        let expectedFinalDoc = (await import(finalDocPath)).default;

        const uploadServiceMock = {
          lineArr: lineData,
          pagesArr: pageData,
          lineCount: [],
        };
        let pdfService = new PdfService(uploadServiceMock as any);
        await TestBed.configureTestingModule({
          imports: [
            MatDialogModule,
            HttpClientTestingModule,
            NoopAnimationsModule,
          ],
          declarations: [DashboardRightComponent],
          providers: [
            { provide: UploadService, useValue: uploadServiceMock },
            { provide: PdfService, useValue: pdfService },
          ],
          schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

  
        let fixture = TestBed.createComponent(DashboardRightComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        // Setting the component's data according to the test case
        component.scriptData = lineData;
        component.selected = scenes;
        component.finalDocument = expectedFinalDoc;
        component.toggleLastLooks();
      });

      it('should have a defined component', () => {
        expect(component).toBeDefined();
      });

      // Define other "it" tests as needed, utilizing `expectedFinalDoc` and other dynamically loaded data
    });
  }
);

//     it('finalDocument and initial should not equal each other', () => {
//       // Assuming you have an initial state of finalDocument before processing
//       const finalDocumentActual = { ...pdfService.finalDocument };
//       expect(expectedFinalDoc).not.toEqual(finalDocumentActual);
//     });

//     it("should have the same true values", () => {
//       const initialFinalDocumentState = { ...pdfService.finalDocument };

//     })

//     it("should have the same false values", () => {

//     })

//     it("should have the same start lines values", () => {

//     })

//     it("should have the same end lines", () => {

//     })

//     it('should have continue lines in the same spot on the page', () => {

//     })

//     it('should have start lines in the same spot on the page', () => {

//     });

//     it('should have one scene number visible per page', () => {

//     })

//     it('should be within 5% of the original in terms of diff', () => {
//       // here we want a way to diff the object arrays and not do an assertion but more show how close they are in terms of percentage
//         //
//     })

//     it('should have page numbers and pageNumber text within a reasonable difference of each other - like +/- 3', () => {

//     })

//     it('should have each page end with an injected break', () => {})

//   });
// });
