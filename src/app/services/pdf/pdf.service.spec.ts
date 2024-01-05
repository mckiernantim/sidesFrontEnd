import { TestBed } from '@angular/core/testing';

import { PdfService } from './pdf.service';
import scriptData from "./mockScriptData.json"
describe('PdfService', () => {
  let service: PdfService;
  const mockData = {
    scriptActual : JSON.parse(scriptData),
    breaksActual:'[{"first":81,"last":84,"scene":"8","firstPage":3,"lastPage":3},{"first":86,"last":91,"scene":"10","firstPage":3,"lastPage":3},{"first":119,"last":145,"scene":"13","firstPage":4,"lastPage":4}]',
    sceneArr: '[{"yPos":707.64,"xPos":58.92,"page":3,"text":"IN THE WOODS","index":82,"category":"scene-header","subCategory":"first-line","class":"","multipleColumn":false,"sceneNumber":"8","bar":"noBar","pageNumber":2,"lastCharIndex":73,"sceneIndex":8,"lastLine":84,"sceneNumberText":"8","visible":"false","firstLine":81,"preview":"It explodes into a tree!  ","lastPage":3},{"yPos":580.68,"xPos":58.92,"page":3,"text":"IN THE WOODS","index":87,"category":"scene-header","subCategory":"","class":"","multipleColumn":false,"sceneNumber":"10","bar":"noBar","pageNumber":2,"lastCharIndex":73,"sceneIndex":10,"lastLine":91,"sceneNumberText":"10","visible":"false","firstLine":86,"preview":"JIM","lastPage":3},{"yPos":603.72,"xPos":58.92,"page":4,"text":"INT. HOSPITAL - NIGHT","index":120,"category":"scene-header","subCategory":"","class":"","multipleColumn":false,"sceneNumber":"13","bar":"noBar","pageNumber":3,"lastCharIndex":113,"sceneIndex":13,"lastLine":145,"sceneNumberText":"13","visible":"false","firstLine":119,"preview":"Beep beep.  A heart monitor chirps.  An IV bag drips.  Hannah ","lastPage":4}]'
  }
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
