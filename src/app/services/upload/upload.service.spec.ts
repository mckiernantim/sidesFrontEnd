import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UploadService } from './upload.service';
import Cookies from 'js-cookie';
import { TokenService } from '../token/token.service';
import { AuthService } from '../auth/auth.service';
import { StripeService } from '../stripe/stripe.service';
import { of } from 'rxjs';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceMock: any;
  let stripeServiceMock: any;
  let tokenServiceMock: jest.Mocked<Partial<TokenService>>;

  const dummyPdfData = {
    allLines: [],
    allChars: [],
    individualPages: [],
    title: 'Test Title',
    firstAndLastLinesOfScenes: []
  };

  beforeEach(() => {
    // Create mocks
    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
      }),
      user$: of({
        uid: 'test-user-id',
        email: 'test@example.com'
      })
    };

    stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of({
        active: true,
        subscription: {
          status: 'active'
        }
      }))
    };

    tokenServiceMock = {
      getToken: jest.fn().mockReturnValue('test-token')
    } as jest.Mocked<Partial<TokenService>>;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UploadService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: TokenService, useValue: tokenServiceMock }
      ]
    });

    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should exist', () => {
    expect(service).toBeDefined();
  });

  describe('deleteFinalDocument', () => {
    it('should send a delete request with the correct token', () => {
      const pdfToken = '12345';
      
      service.deleteFinalDocument(pdfToken).subscribe();
      
      const req = httpMock.expectOne(`${service.url}/delete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ pdfToken });
      req.flush({ success: true, pdfToken });
    });
  });

  describe('downloadPdf', () => {
    it('should make a GET request to download a PDF', () => {
      const name = 'test-script';
      const callsheet = 'test-callsheet';
      const pdfToken = 'test-token';
      
      service.downloadPdf(name, callsheet, pdfToken).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(
        `${environment.url}/complete/${pdfToken}?name=${name}&callsheet=${callsheet}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      
      req.flush(new Blob(['test-pdf-content'], { type: 'application/pdf' }));
    });
  });

  describe('postFile', () => {
    it('should upload a file and process the response', () => {
      // Mock the auth service to return a user
      authServiceMock.user$ = of({
        uid: 'test-user-id',
        email: 'test@example.com'
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        scriptData: {
          allLines: [{ text: 'Line 1', category: 'dialogue' }],
          allChars: [{ name: 'Character 1' }],
          individualPages: [[{ text: 'Page 1', category: 'page' }]],
          title: 'Test Script',
          firstAndLastLinesOfScenes: []
        }
      };

      service.postFile(file).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(service.allLines).toEqual(mockResponse.scriptData.allLines as any);
        expect(service.title).toBe(mockResponse.scriptData.title);
      });

      const req = httpMock.expectOne(`${environment.url}/api`);
      expect(req.request.method).toBe('POST');
      
      // Verify FormData contains the file
      const formData = req.request.body;
      expect(formData instanceof FormData).toBe(true);
      
      req.flush(mockResponse);
    });

    it('should require authentication to upload files', (done) => {
      // Mock the auth service to return no user
      authServiceMock.user$ = of(null);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      service.postFile(file).subscribe({
        error: (error) => {
          expect(error.message).toBe('User must be authenticated to upload files');
          done();
        }
      });
    });
  });

  describe('postCallSheet', () => {
    it('should upload a call sheet', () => {
      // Mock the auth service to return a user
      authServiceMock.user$ = of({
        uid: 'test-user-id',
        email: 'test@example.com'
      });
      
      const file = new File(['test content'], 'callsheet.pdf', { type: 'application/pdf' });
      
      service.postCallSheet(file).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.url}/callsheet`);
      expect(req.request.method).toBe('POST');
      
      // Verify FormData contains the file
      const formData = req.request.body;
      expect(formData instanceof FormData).toBe(true);
      
      req.flush({ success: true });
    });
  });

  describe('generatePdf', () => {
    it('should generate a PDF document', () => {
      // Mock getIdToken to return a token
      const getAuthSpy = jest.spyOn(require('firebase/auth'), 'getAuth').mockReturnValue({
        currentUser: {
          getIdToken: jest.fn().mockResolvedValue('firebase-token')
        }
      });

      const finalDocument = {
        data: { content: 'test' },
        name: 'test-script',
        email: 'test@example.com',
        callSheet: 'test-callsheet',
        pdfToken: 'test-token',
        userId: 'test-user-id'
      };

      service.generatePdf(finalDocument).subscribe(response => {
        expect(response).toEqual({ success: true, pdfToken: 'generated-token' });
      });

      const req = httpMock.expectOne(`${environment.url}/pdf`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        data: finalDocument.data,
        name: finalDocument.name,
        email: finalDocument.email,
        callSheet: finalDocument.callSheet,
        pdfToken: finalDocument.pdfToken,
        userId: finalDocument.userId
      });
      
      req.flush({ success: true, pdfToken: 'generated-token' });
      
      // Clean up spy
      getAuthSpy.mockRestore();
    });
  });

  describe('getTestJSON', () => {
    it('should get test JSON data', () => {
      // Mock the auth service to return a user
      authServiceMock.user$ = of({
        uid: 'test-user-id',
        email: 'test@example.com'
      });
      
      const testName = 'test';
      
      service.getTestJSON(testName).subscribe(response => {
        expect(response).toBeTruthy();
      });
      
      const req = httpMock.expectOne(`${environment.url}/testing`);
      expect(req.request.method).toBe('POST');
      
      req.flush({ success: true });
    });
  });
});

