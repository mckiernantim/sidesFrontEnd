import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right.component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { MatDialogModule } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import _ from 'lodash';
import lineDataNoteworthy from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-lineArr-mock-data.json';
import pageDataNoteworthy from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-pagesArr-mock-data.json';
import finalDocDataNoteworthy from '../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY[1,2,5,11,12,22,28].json';
import lineDataKidnapped from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-lineArr-mock-data.json';
import pageDataKidnapped from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-pagesArr-mock-data.json';
import finalDocDataKidnapped from '../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED[2,14,A24,33,A40,53,A73,92,157].json';
import lineDataTheFinalRose from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-lineArr-mock-data.json';
import pageDataTheFinalRose from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-pagesArr-mock-data.json';
import finalDocDataTheFinalRose from '../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE[2,4,7,11,18A,18B,18C,29,53,73,104].json';

const BASE_PATH = '../../../testingData/pdfServiceData/finalDocData';

function deepDiff(expected, actual) {
  const uniqueToExpected = _.differenceWith(expected, actual, _.isEqual);
  const uniqueToActual = _.differenceWith(actual, expected, _.isEqual);
  return [uniqueToExpected, uniqueToActual];
}

function sanitizeLinesForCompare(arr, category, cssClassForFinal) {
  return arr.flat().filter(line => line[category] === cssClassForFinal).map(line => ({
    text: line.text,
    category: line.category,
    xPos: line.xPos,
    yPos: line.yPos,
    cont: line.cont,
    visible: line.visible,
    end: line.end,
    sceneNumberText: line.sceneNumberText,
  }));
}

function toBeWithinRange(value, floor, ceiling) {
  return value >= floor && value <= ceiling;
}

interface TestCase {
  name: string;
  lineData: any[];
  pageData: any[];
  finalDoc: any[];
  scenes: string[];
}

const testCases: TestCase[] = [
  {
    name: 'THE FINAL ROSE',
    lineData: lineDataTheFinalRose,
    pageData: pageDataTheFinalRose,
    finalDoc: finalDocDataTheFinalRose,
    scenes: ['2', '4', '7', '11', '18A', '18B', '18C', '29', '53', '73', '104'],
  },
  {
    name: 'KIDNAPPED',
    lineData: lineDataKidnapped,
    pageData: pageDataKidnapped,
    finalDoc: finalDocDataKidnapped,
    scenes: ['2', '14', 'A24', '33', 'A40', '53', 'A73', '92', '157'],
  },
  {
    name: 'NOTEWORTHY',
    lineData: lineDataNoteworthy,
    pageData: pageDataNoteworthy,
    finalDoc: finalDocDataNoteworthy,
    scenes: ['1', '2', '5', '11', '12', '22', '28'],
  },
];

testCases.forEach(testCase => {
  describe(`DashboardRightComponent - ${testCase.name} Scene Selection and PDF Generation`, () => {
    let component: DashboardRightComponent;
    let fixture: ComponentFixture<DashboardRightComponent>;
    let pdfService: PdfService;
    let finalDocExpected;
    let finalDocActual;

    beforeEach(async () => {
      const uploadServiceMock = {
        allLines: testCase.lineData,
        scenes: testCase.pageData,
        individualPages: testCase.pageData,
      };

      await TestBed.configureTestingModule({
        imports: [MatDialogModule, HttpClientTestingModule, NoopAnimationsModule],
        declarations: [DashboardRightComponent],
        providers: [
          { provide: UploadService, useValue: uploadServiceMock },
          PdfService,
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      finalDocExpected = testCase.finalDoc.map(page => page.filter(el => el.category !== 'injected-break'));
      fixture = TestBed.createComponent(DashboardRightComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.pdf.allLines = testCase.lineData;
      component.pdf.individualPages = testCase.pageData;
      component.pdf.finalDocument = {
        data: testCase.finalDoc
      };
      component.selected = component.pdf.allLines.filter(line => testCase.scenes.includes(line.sceneNumberText) && line.category === 'scene-header');
      component.toggleLastLooks();
      finalDocActual = component.pdf.finalDocument.data.map(page => page.filter(el => el.category !== 'injected-break'));
    });

    it('should have a defined component', () => {
      expect(component).toBeDefined();
    });

    it('finalDocument should be the same number of pages', () => {
      expect(finalDocActual.length).toBe(finalDocExpected.length);
    });

    it('finalDocument should have same visible: "true" lines as expected document', () => {
      const expectedTrueLines = finalDocExpected.flat().filter(line => line.visible === 'true').map(line => ({
        text: line.text,
        index: line.index,
      }));
      const actualTrueLines = finalDocActual.flat().filter(line => line.visible === 'true').map(line => ({
        text: line.text,
        index: line.index,
      }));
      const differenceLimit = 5;
      const [uniqueToExpected, uniqueToActual] = deepDiff(expectedTrueLines, actualTrueLines);
      expect(toBeWithinRange(uniqueToExpected.length, uniqueToActual.length - differenceLimit, uniqueToActual.length + differenceLimit)).toBe(true);
    });

    it('finalDocument should have same visible: "false" lines as expected document', () => {
      const expectedFalseLines = sanitizeLinesForCompare(finalDocExpected, 'visible', 'false');
      const actualFalseLines = sanitizeLinesForCompare(finalDocActual, 'visible', 'false');
      expect(toBeWithinRange(expectedFalseLines.length, actualFalseLines.length - 5, actualFalseLines.length + 5)).toBe(true);
    });

    it('should have the same "cont" lines values', () => {
      const expectedContLines = sanitizeLinesForCompare(finalDocExpected, 'cont', "CON'T");
      const actualContLines = sanitizeLinesForCompare(finalDocActual, 'cont', "CON'T");
      expect(toBeWithinRange(expectedContLines.length, actualContLines.length - 5, actualContLines.length + 5)).toBe(true);
    });

    it('should have an equal number of end lines as scenes', () => {
      const expectedEndLines = sanitizeLinesForCompare(finalDocExpected, 'end', 'END');
      const actualEndLines = sanitizeLinesForCompare(finalDocActual, 'end', 'END');
      expect(expectedEndLines.length).toEqual(actualEndLines.length);
    });

    it('should have the same "end" lines values', () => {
      const expectedEndLines = sanitizeLinesForCompare(finalDocExpected, 'end', 'END');
      const actualEndLines = sanitizeLinesForCompare(finalDocActual, 'end', 'END');
      expect(expectedEndLines).toEqual(actualEndLines);
    });

    it('should have one page number visible per page', () => {
      const actualNumbersVisible = finalDocActual.flat().filter(line => line.category === 'scene-number' && line.visible === 'true');
      const expectedNumbersVisible = finalDocExpected.flat().filter(line => line.category === 'scene-number' && line.visible === 'true');
      expect(actualNumbersVisible).toEqual(expectedNumbersVisible);
    });
  });
});
