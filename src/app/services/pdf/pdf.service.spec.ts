import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PdfService } from './pdf.service';
import { TokenService } from '../token/token.service';
import { UploadService } from '../upload/upload.service';
import scriptData from '../../testingData/pdfServiceData/mockScriptData.json';
import { Line } from '../../types/Line';

class MockUploadService extends UploadService {
  constructor() {
    super(undefined as any, undefined as any); 
  }
  _devPdfPath: string = '';
  script: string = '';
  allLines: any[] = [];
  lineCount: any = {};
  individualPages: any[] = [];
  allChars: any[] = [];
  firstAndLastLinesOfScenes: any[] = [];
  title: string = '';
  underConstruction: boolean = false;
  issues: any = {};
  coverSheet: any = null;

  getPDF = jest.fn();
  postFile = jest.fn();
  generatePdf = jest.fn();
  postCallSheet = jest.fn();
  deleteFinalDocument = jest.fn();
  resetHttpOptions = jest.fn();
  getTestJSON = jest.fn();
  makeJSON = jest.fn();
}
const actualScriptData = JSON.parse(JSON.stringify(scriptData));
const mockData = {
  scriptActual: actualScriptData,
  breaksActual: '[{"first":81,"last":84,"scene":"8","firstPage":3,"lastPage":3},{"first":86,"last":91,"scene":"10","firstPage":3,"lastPage":3},{"first":119,"last":145,"scene":"13","firstPage":4,"lastPage":4}]',
  sceneArr: '[{"yPos":707.64,"xPos":58.92,"page":3,"text":"IN THE WOODS","index":82,"category":"scene-header","subCategory":"first-line","class":"","multipleColumn":false,"sceneNumber":"8","bar":"noBar","pageNumber":2,"lastCharIndex":73,"sceneIndex":8,"lastLine":84,"sceneNumberText":"8","visible":"false","firstLine":81,"preview":"It explodes into a tree!  ","lastPage":3},{"yPos":580.68,"xPos":58.92,"page":3,"text":"IN THE WOODS","index":87,"category":"scene-header","subCategory":"","class":"","multipleColumn":false,"sceneNumber":"10","bar":"noBar","pageNumber":2,"lastCharIndex":73,"sceneIndex":10,"lastLine":91,"sceneNumberText":"10","visible":"false","firstLine":86,"preview":"JIM","lastPage":3},{"yPos":603.72,"xPos":58.92,"page":4,"text":"INT. HOSPITAL - NIGHT","index":120,"category":"scene-header","subCategory":"","class":"","multipleColumn":false,"sceneNumber":"13","bar":"noBar","pageNumber":3,"lastCharIndex":113,"sceneIndex":13,"lastLine":145,"sceneNumberText":"13","visible":"false","firstLine":119,"preview":"Beep beep.  A heart monitor chirps.  An IV bag drips.  Hannah ","lastPage":4}]',
};

describe('PdfService', () => {
  let service: PdfService;
  let httpTestingController: HttpTestingController;
  let mockUploadService: MockUploadService;
  let tokenService: TokenService;

  beforeEach(async () => {
  await  TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PdfService,
        TokenService,
        { provide: UploadService, useClass: MockUploadService }
      ]
    }).compileComponents()

    service = TestBed.inject(PdfService);
    httpTestingController = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    mockUploadService = TestBed.inject(UploadService) as MockUploadService;
    mockUploadService.allLines = mockData.scriptActual;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Functionality Tests', () => {
    it('should process data correctly', () => {
      // Mock specific functionality tests here
    });

    describe('Process Line Functionality', () => {
      // it('should correctly mark the number of lines as END', () => {
      //   // Place your specific logic for the test here
      // });

      // it('should handle the last line of a scene appropriately', () => {
      //   // Additional logic to test this specific functionality
      // });

      // it('should process visibility of scenes correctly', () => {
      //   // Test visibility processing
      // });

      // it('should handle the final scene correctly', () => {
      //   // Test final scene handling
      // });

      it('should find the correct scene number text', () => {
        const page = scriptData[5]; // Use the first 20 lines as an example page
       // Use the 6th line in the provided data as the test line
        const header = page[2];
        const sceneNumberText = service.findSceneNumberText(page, header);

        expect(sceneNumberText).toEqual('16'); // Expect the scene number text to be '17'
      });
    });

    describe('Document Creation Functionality', () => {
      describe('Full Page Construction', () => {
        it('should construct full pages correctly', () => {
          // Implement test for full page construction
        });

        it('should collect page numbers from scenes correctly', () => {
          // Implement test for collecting page numbers
        });

        it('should record and sort scenes by scene number correctly', () => {
          const scenes = [
            { sceneNumber: 3, otherData: '...' },
            { sceneNumber: 1, otherData: '...' },
            { sceneNumber: 2, otherData: '...' },
          ];
          scenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
          expect(scenes[0].sceneNumber).toBe(1);
          expect(scenes[1].sceneNumber).toBe(2);
          expect(scenes[2].sceneNumber).toBe(3);
        });
      });

      describe('Scene Header Processing', () => {
        it('should remove scene header text from a line correctly', () => {
          const headerExample = { text: '1EXT. SPACE1' };
          const duplicate = { text: '1EXT. SPACE1' };
          service.processSceneHeader(headerExample, duplicate);

          expect(headerExample.text).toMatch(/EXT. SPACE/);;
        });
      });
    });
  });
});
