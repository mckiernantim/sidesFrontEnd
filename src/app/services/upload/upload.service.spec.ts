import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UploadService } from './upload.service';
import Cookies from 'js-cookie';
import { TokenService } from '../token/token.service';
import { after } from 'lodash';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  const dummyPdfData = {
    allLines: [],
    allChars: [],
    individualPages: [],
    title: 'Test Title',
    firstAndLastLinesOfScenes: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UploadService, { provide: TokenService, useValue: {} }]
    });
    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    httpMock.verify();
  })

  
  it('should exist', () => {
    expect(service).toBeDefined();
  });

  describe('deleteFinalDocument', () => {
    it('should send a delete request with the correct authorization header', () => {
      const tokenId = '12345';
      const fakeToken = 'fake-token';
      jest.spyOn(Cookies, 'get').mockReturnValue(fakeToken as any);
      service.deleteFinalDocument(tokenId).subscribe();
      
      const req = httpMock.expectOne(`${service.url}/delete`);
      expect(req.request.method).toBe('POST');
      console.log(typeof req.request.headers.get('Authorization'));
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);
      expect(req.request.body).toEqual({ tokenId });
      req.flush({});
    });
  });
  

  describe('getPDF', () => {
    it('should make a GET request and return the expected blob', () => {
      const name = 'sampleName';
      const callsheet = 'sampleSheet';
      const pdfToken = 'sampleToken';

      // Simulate fetching a PDF file
      service.getPDF(name, callsheet, pdfToken).subscribe(response => {
        expect(response instanceof Blob).toBe(true); // Ensure that the response is a blob
      });

      // Verify the API call
      const req = httpMock.expectOne(req => 
        req.url === `${service.url}/complete/${pdfToken}` && req.method === 'GET'
      );
      expect(req.request.params.get('name')).toEqual(name);
      expect(req.request.params.get('callsheet')).toEqual(callsheet);
      expect(req.request.responseType).toBe('blob');

      // Simulate response
      req.flush(new Blob([], { type: 'application/pdf' }));
    });
  });

  describe('postFile', () => {
    it('should upload a file and return response data', () => {
      const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const expectedResponse = {
        allLines: [],
        allChars: [],
        individualPages: [],
        title: 'Uploaded Document'
      };

      service.postFile(mockFile).subscribe(response => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(req => req.url === service.url + '/api' && req.method === 'POST');
      expect(req.request.body.get('script')).toEqual(mockFile);

      // Check if the correct headers are being set if needed
      expect(req.request.headers.get('Content-Type')).toBeNull(); // Update this assertion based on actual headers set in service

      // Flush the mock data to complete the request
      req.flush(expectedResponse);
    });
  });

describe('generatePdf', () => {
  it('should send data to generate a PDF', () => {
    const sceneArr = { name: 'sceneName' }; // Example data structure
    service.generatePdf(sceneArr).subscribe();

    // Build the expected URL with parameters
    let params = new HttpParams().append('name', sceneArr.name);
    const expectedUrl = `${service.url}/pdf?${params.toString()}`;
    
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(sceneArr);
    req.flush({}); // Mock the response
  });
});
  
  
  
});

