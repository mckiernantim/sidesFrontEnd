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

import { Line } from '../../../types/Line'
import _, { difference } from 'lodash';
/* 

  This line data can be created from a disabled function at the end of classify.js on the backend
  Make sure data is refreshed for scripts as well as expected PDF docs every time test are weird 

*/
import lineDataNoteworthy from "../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-lineArr-mock-data.json"
import pageDataNoteworthy from "../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY-pagesArr-mock-data.json"
import finalDocDataNoteworthy from "../../../testingData/pdfServiceData/finalDocData/NOTEWORTHY/NOTEWORTHY[1,2,5,11,12,22,28].json"

import lineDataKidnapped from "../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-lineArr-mock-data.json"
import pageDataKidnapped from "../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED-pagesArr-mock-data.json"
import finalDocDataKidnapped from "../../../testingData/pdfServiceData/finalDocData/KIDNAPPED/KIDNAPPED[2,14,A24,33,A40,53,A73,92,157].json"

import lineDataTheFinalRose from "../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-lineArr-mock-data.json"
import pageDataTheFinalRose from "../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE-pagesArr-mock-data.json"
import finalDocDataTheFinalRose from "../../../testingData/pdfServiceData/finalDocData/THE FINAL ROSE/THE FINAL ROSE[2,4,7,11,18A,18B,18C,29,53,73,104].json"

const BASE_PATH = '../../../testingData/pdfServiceData/finalDocData';
const extractSceneNumbers = (filePath) => {
  
  const match = filePath.match(/\[(.*?)\]/);
  return match ? match[1].split(',').map(Number) : [];
};
function deepDiff(expected, actual) {
  // Items in expected that are not in actual
  const uniqueToExpected = _.differenceWith(expected, actual, _.isEqual);
  
  // Items in actual that are not in expected
  const uniqueToActual = _.differenceWith(actual, expected, _.isEqual);
  
  // Optionally, find items that are in both but differ
  // This part requires a more customized approach, depending on what "differ" means
  
  return [
    uniqueToExpected,
    uniqueToActual,
    // differencesInBoth: [], // Populate this array if necessary
  ];
}

function sanitizeLinesForCompare(arr, category, cssClassForFinal) {
  return arr.flat().filter(line => line[category] === cssClassForFinal)
    .map(line => ({
      text: line.text, 
      category: line.category, 
      xPos: line.xPos, 
      yPos: line.yPos, 
      cont: line.cont, 
      visible: line.visible,
      end: line.end,
      sceneNumberText: line.sceneNumberText
    })
  )
}
interface TestCase {
  name:string,
  lineData:any[],
  pageData:any[],
  finalDoc:any[],
  scenes:string[];
}

const testCases:TestCase[] = [
  {
    name: "THE FINAL ROSE",
    lineData: lineDataTheFinalRose,
    pageData: pageDataTheFinalRose,
    finalDoc: finalDocDataTheFinalRose,
    scenes:['2','4','7','11','18A','18B','18C','29','53','73','104']
  },
  {
    name: "KIDNAPPED",
    lineData: lineDataKidnapped,
    pageData: pageDataKidnapped,
    finalDoc: finalDocDataKidnapped,
    scenes: ['2','14','A24','33','A40','53','A73','92','157']
  },
  {
    name: "NOTEWORTHY",
    lineData: lineDataNoteworthy,
    pageData: pageDataNoteworthy,
    finalDoc: finalDocDataNoteworthy,
    scenes: ['1','2','5','11','12','22','28']
  },
  // Include other test cases if needed
];

describe('DashboardRightComponent - THE FINAL ROSE Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let pdfService: PdfService;
  let finalDocExpected;
  let finalDocActual;

  beforeEach(async () => {
    const scenes = testCases[0].scenes;
    const uploadServiceMock = {
      lineArr: lineDataTheFinalRose,
      pagesArr: pageDataTheFinalRose,
      lineCount: [],
    };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule, NoopAnimationsModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        // PdfService will use the mock UploadService
        PdfService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    // remove injected breaks as this step occurs later in the pipeline
    finalDocExpected = finalDocDataTheFinalRose.map(page => page.filter(el => el.category != "injected-break"))
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Simulate the component receiving the script data and selected scenes
    component.scriptData = lineDataTheFinalRose;
    component.script = testCases[0].name
    component.selected = component.scriptData.filter(line => 
      scenes.includes(line.sceneNumberText) && line.category === "scene-header");
    component.toggleLastLooks()
    // finalDocActual = component.pdf.finalDocument.data.map(page => page.filter(el => el.category != "injected-break"))
    finalDocActual = component.pdf.getPdf(component.selected, component.script, component.totalPages, null).data.map(page => page.filter(el => el.category != "injected-break"))
  
  });

  it('should have a defined component', () => {
    expect(component).toBeDefined();
  });

  it('finalDocument should be the same number of pages', () => {
    expect(finalDocActual.length).toBe(finalDocExpected.length)
  })

  it('finalDocument should have same visible: "true" lines as expected document for  THE FINAL ROSE', () => {
    // We need to sanitize the lines to only remove and addd keys /vals used in previewing the display
    const expectedTrueLines = finalDocExpected.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const actualTrueLines = finalDocActual.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const differenceLimit = 5;
    const [uniqueToExpected, uniqueToActual] = deepDiff(expectedTrueLines,  actualTrueLines)
    expect(uniqueToActual.length + differenceLimit).toBeLessThanOrEqual(uniqueToExpected.length)
    expect(uniqueToActual.length - differenceLimit).toBeGreaterThanOrEqual(uniqueToExpected.length);

  });

  it('finalDocument should have same visible: "false" lines as expected document for  THE FINAL ROSE', () => {
    const expectedFalseLines = sanitizeLinesForCompare(finalDocActual, 'visible', "false");
    const actualFalseLines = sanitizeLinesForCompare(finalDocExpected ,'visible', "false");
    const [uniqueToExpected, uniqueToActual] = deepDiff(expectedFalseLines,  actualFalseLines)
    expect(actualFalseLines).toEqual(expectedFalseLines);
  });

  it('should have the same "cont" lines values', () => {
    const expectedContLines = sanitizeLinesForCompare(finalDocActual, 'cont', "CON'T");
    const actualContLines = sanitizeLinesForCompare(finalDocExpected, 'cont', "CON'T");

    expect(actualContLines).toEqual(expectedContLines)
  });

  it('should have an equal number of end lines as scenes', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect( actualEndLines.length ).toEqual(expectedEndLines.length)

  })
  
  it('should have the same "end" lines values', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect(actualEndLines).toEqual(expectedEndLines)
  })


  it('should have one page number visible per page', () => {
    const actualNumbersVisible = finalDocActual.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")
    const expectedNumbersVisible = finalDocExpected.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")

    expect(actualNumbersVisible).toEqual(expectedNumbersVisible)
  })
});

describe('DashboardRightComponent - KIDNAPPED Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let pdfService: PdfService;
  let finalDocExpected;
  let finalDocActual;

  beforeEach(async () => {
    const scenes = testCases[1].scenes;
    const uploadServiceMock = {
      lineArr: lineDataKidnapped,
      pagesArr: pageDataKidnapped,
      lineCount: [],
    };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule, NoopAnimationsModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        // PdfService will use the mock UploadService
        PdfService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    // remove injected breaks as this step occurs later in the pipeline
    finalDocExpected = finalDocDataKidnapped.map(page => page.filter(el => el.category != "injected-break"))
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Simulate the component receiving the script data and selected scenes
    component.scriptData = lineDataKidnapped;
    component.script = testCases[1].name
    component.selected = component.scriptData.filter(line => 
      scenes.includes(line.sceneNumberText) && line.category === "scene-header");
    component.toggleLastLooks()
    finalDocActual = component.pdf.finalDocument.data.map(page => page.filter(el => el.category != "injected-break"))
    component.finalDocument = component.pdf.getPdf(component.selected, component.script, component.totalPages, null)
  
  });

  it('should have a defined component', () => {
    expect(component).toBeDefined();
  });

  it('finalDocument should be the same number of pages', () => {
    expect(finalDocActual.length).toBe(finalDocExpected.length)
  })

  it('finalDocument should have same visible: "true" lines as expected document for  NOTEWORTHY', () => {
    // We need to sanitize the lines to only remove and addd keys /vals used in previewing the display
    const expectedTrueLines = finalDocExpected.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const actualTrueLines = finalDocActual.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const differenceLimit = 5;
    const [uniqueToExpected, uniqueToActual] = deepDiff(expectedTrueLines,  actualTrueLines)
    expect(uniqueToExpected.length).toBeLessThanOrEqual(uniqueToActual.length + differenceLimit);
    expect(uniqueToExpected.length).toBeGreaterThanOrEqual(uniqueToActual.length - differenceLimit);

  });

  it('finalDocument should have same visible: "false" lines as expected document for  NOTEWORTHY', () => {
    const expectedFalseLines = sanitizeLinesForCompare(finalDocActual, 'visible', "false");
    const actualFalseLines = sanitizeLinesForCompare(finalDocExpected ,'visible', "false");

    expect(expectedFalseLines).toEqual(actualFalseLines);
  });

  it('should have the same "cont" lines values', () => {
    const expectedContLines = sanitizeLinesForCompare(finalDocActual, 'cont', "CON'T");
    const actualContLines = sanitizeLinesForCompare(finalDocExpected, 'cont', "CON'T");

    expect(expectedContLines).toEqual(actualContLines)
  });

  it('should have an equal number of end lines as scenes', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect(expectedEndLines.length).toEqual(actualEndLines.length)

  })
  
  it('should have the same "end" lines values', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect(expectedEndLines).toEqual(actualEndLines)
  })


  it('should have one page number visible per page', () => {
    const actualNumbersVisible = finalDocActual.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")
    const expectedNumbersVisible = finalDocExpected.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")

    expect(actualNumbersVisible).toEqual(expectedNumbersVisible)
  })
});

describe('DashboardRightComponent - NOTEWORTHY Scene Selection and PDF Generation', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let pdfService: PdfService;
  let finalDocExpected;
  let finalDocActual;

  beforeEach(async () => {
    const scenes = testCases[2].scenes;
    const uploadServiceMock = {
      lineArr: lineDataNoteworthy,
      pagesArr: pageDataNoteworthy,
      lineCount: [],
    };

    await TestBed.configureTestingModule({
      imports: [MatDialogModule, HttpClientTestingModule, NoopAnimationsModule],
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceMock },
        // PdfService will use the mock UploadService
        PdfService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    // remove injected breaks as this step occurs later in the pipeline
    finalDocExpected = finalDocDataNoteworthy.map(page => page.filter(el => el.category != "injected-break"))
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Simulate the component receiving the script data and selected scenes
    component.scriptData = lineDataNoteworthy;
    component.script = testCases[2].name
    component.selected = component.scriptData.filter(line => 
      scenes.includes(line.sceneNumberText) && line.category === "scene-header");
    component.toggleLastLooks()
    finalDocActual = component.pdf.finalDocument.data.map(page => page.filter(el => el.category != "injected-break"))
    // GET PDF WILL RUIN THE STATUS OF OUR SOLID PDF-SERVICE DOCUMENT
    // component.finalDocument = component.pdf.getPdf(component.selected, component.script, component.totalPages, null)
  
  });

  it('should have a defined component', () => {
    expect(component).toBeDefined();
  });

  it('finalDocument should be the same number of pages', () => {
    expect(finalDocActual.length).toBe(finalDocExpected.length)
  })

  it('finalDocument should have same visible: "true" lines as expected document for  NOTEWORTHY', () => {
    // We need to sanitize the lines to only remove and addd keys /vals used in previewing the display
    const expectedTrueLines = finalDocExpected.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const actualTrueLines = finalDocActual.flat().filter(line => line.visible === "true").map(line => ({
      text:line.text,
      index:line.index
    }))
    const differenceLimit = 5;
    const [uniqueToExpected, uniqueToActual] = deepDiff(expectedTrueLines,  actualTrueLines)
    expect( uniqueToActual.length + differenceLimit).toBeLessThanOrEqual(uniqueToExpected.length);
    expect(uniqueToActual.length - differenceLimit).toBeGreaterThanOrEqual(uniqueToExpected.length);

  });

  it('finalDocument should have same visible: "false" lines as expected document for  NOTEWORTHY', () => {
    const expectedFalseLines = sanitizeLinesForCompare(finalDocActual, 'visible', "false");
    const actualFalseLines = sanitizeLinesForCompare(finalDocExpected ,'visible', "false");

    expect(actualFalseLines).toEqual(expectedFalseLines);
  });

  it('should have the same "cont" lines values', () => {
    const expectedContLines = sanitizeLinesForCompare(finalDocActual, 'cont', "CON'T");
    const actualContLines = sanitizeLinesForCompare(finalDocExpected, 'cont', "CON'T");

    expect(actualContLines).toEqual(expectedContLines)
  });

  it('should have an equal number of end lines as scenes', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect(actualEndLines.length).toEqual(expectedEndLines.length)

  })
  
  it('should have the same "end" lines values', () => {
    const expectedEndLines = sanitizeLinesForCompare(finalDocActual, "end", "END")
    const actualEndLines = sanitizeLinesForCompare(finalDocExpected, "end", "END")

    expect(actualEndLines).toEqual(expectedEndLines)
  })


  it('should have one page number visible per page', () => {
    const actualNumbersVisible = finalDocActual.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")
    const expectedNumbersVisible = finalDocExpected.flat()
      .filter(line => line.category === "scene-number" && line.visible ==="true")

    expect(actualNumbersVisible).toEqual(expectedNumbersVisible)
  })
});





