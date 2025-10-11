import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UploadService } from './upload.service';
import { TokenService } from '../token/token.service';
import { AuthService } from '../auth/auth.service';
import { StripeService } from '../stripe/stripe.service';
import { of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockStripeService: jasmine.SpyObj<StripeService>;
  let mockTokenService: jasmine.SpyObj<TokenService>;
  let mockUser: User;

  const mockScriptData = {
    allLines: [
      { text: 'FADE IN:', category: 'scene-header', lineNumber: 1 },
      { text: 'EXT. PARK - DAY', category: 'scene-header', lineNumber: 2 },
      { text: 'JOHN', category: 'character', lineNumber: 3 },
      { text: 'Hello there!', category: 'dialog', lineNumber: 4 }
    ],
    allChars: [
      { name: 'JOHN', count: 1 },
      { name: 'MARY', count: 1 }
    ],
    individualPages: [
      [
        { text: 'FADE IN:', category: 'scene-header', lineNumber: 1 },
        { text: 'EXT. PARK - DAY', category: 'scene-header', lineNumber: 2 }
      ]
    ],
    title: 'Test Script',
    firstAndLastLinesOfScenes: [
      { firstLine: 1, lastLine: 4, sceneNumber: 1 }
    ],
    lineCount: [4]
  };

  beforeEach(() => {
    // Create mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('mock-token'))
    } as User;

    // Create spies
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['checkSubscriptionStatus'], {
      user$: of(mockUser)
    });
    const stripeServiceSpy = jasmine.createSpyObj('StripeService', ['getSubscriptionStatus']);
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', ['getToken'], {
      getToken: 'test-token'
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UploadService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StripeService, useValue: stripeServiceSpy },
        { provide: TokenService, useValue: tokenServiceSpy }
      ]
    });

    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockStripeService = TestBed.inject(StripeService) as jasmine.SpyObj<StripeService>;
    mockTokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;

    // Mock Firebase auth
    spyOn(require('firebase/auth'), 'getAuth').and.returnValue({
      currentUser: mockUser
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('File Upload & Processing', () => {
    describe('postFile()', () => {
      it('should upload a file and process the response successfully', (done) => {
        const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockResponse = { scriptData: mockScriptData };

        service.postFile(file).subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(service.allLines).toEqual(mockScriptData.allLines);
            expect(service.title).toBe(mockScriptData.title);
            expect(service.individualPages).toEqual(mockScriptData.individualPages);
            expect(service.allChars).toEqual(mockScriptData.allChars);
            expect(service.firstAndLastLinesOfScenes).toEqual(mockScriptData.firstAndLastLinesOfScenes);
            expect(service.lineCount).toEqual(mockScriptData.lineCount);
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/api`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body instanceof FormData).toBeTrue();
        req.flush(mockResponse);
      });

      it('should handle file upload errors', (done) => {
        const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const errorResponse = new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Invalid file format' }
        });

        service.postFile(file).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(`${service.url}/api`);
        req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
      });

      it('should store filename in localStorage', (done) => {
        const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
        const mockResponse = { scriptData: mockScriptData };

        service.postFile(file).subscribe({
          next: () => {
            expect(localStorage.getItem('name')).toBe('test-script.pdf');
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/api`);
        req.flush(mockResponse);
      });

      it('should handle network errors', (done) => {
        const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });

        service.postFile(file).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(`${service.url}/api`);
        req.error(new ErrorEvent('Network error'));
      });
    });

    describe('postCallSheet()', () => {
      it('should upload a call sheet successfully', (done) => {
        const file = new File(['callsheet content'], 'callsheet.pdf', { type: 'application/pdf' });
        const mockResponse = { success: true, callSheetPath: 'path/to/callsheet.pdf' };

        service.postCallSheet(file).subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(service.coverSheet).toEqual(mockResponse);
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/callsheet`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body instanceof FormData).toBeTrue();
        req.flush(mockResponse);
      });

      it('should handle call sheet upload errors', (done) => {
        const file = new File(['callsheet content'], 'callsheet.pdf', { type: 'application/pdf' });
        const errorResponse = new HttpErrorResponse({
          status: 413,
          statusText: 'File Too Large',
          error: { message: 'File size exceeds limit' }
        });

        service.postCallSheet(file).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(`${service.url}/callsheet`);
        req.flush(errorResponse, { status: 413, statusText: 'File Too Large' });
      });
    });
  });

  describe('PDF Generation', () => {
    describe('generatePdf()', () => {
      it('should generate PDF successfully with valid subscription', (done) => {
        const finalDocument = {
          data: mockScriptData.allLines,
          name: 'test-script',
          email: 'test@example.com',
          callSheetPath: 'path/to/callsheet.pdf',
          userId: 'test-user-123'
        };

        const mockResponse = {
          success: true,
          pdfToken: 'generated-token-123',
          expirationTime: Date.now() + 86400000
        };

        service.generatePdf(finalDocument).subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(localStorage.getItem('pdfBackupToken')).toBe('generated-token-123');
            expect(localStorage.getItem('pdfTokenExpires')).toBeDefined();
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/pdf`);
        expect(req.request.method).toBe('POST');
        expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
        expect(req.request.body).toEqual({
          data: finalDocument.data,
          name: finalDocument.name,
          email: finalDocument.email,
          callSheetPath: finalDocument.callSheetPath,
          userId: finalDocument.userId
        });
        req.flush(mockResponse);
      });

      it('should handle PDF generation errors', (done) => {
        const finalDocument = {
          data: mockScriptData.allLines,
          name: 'test-script',
          email: 'test@example.com',
          callSheetPath: 'path/to/callsheet.pdf',
          userId: 'test-user-123'
        };

        const errorResponse = new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          error: { message: 'PDF generation failed' }
        });

        service.generatePdf(finalDocument).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(`${service.url}/pdf`);
        req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle subscription required response', (done) => {
        const finalDocument = {
          data: mockScriptData.allLines,
          name: 'test-script',
          email: 'test@example.com',
          callSheetPath: 'path/to/callsheet.pdf',
          userId: 'test-user-123'
        };

        const subscriptionResponse = {
          success: false,
          needsSubscription: true,
          checkoutUrl: 'https://checkout.stripe.com/test'
        };

        service.generatePdf(finalDocument).subscribe({
          next: (response) => {
            expect(response).toEqual(subscriptionResponse);
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/pdf`);
        req.flush(subscriptionResponse, { status: 403, statusText: 'Forbidden' });
      });
    });

    describe('handleSubscriptionFlow()', () => {
      it('should open Stripe checkout popup', () => {
        const finalDocument = { name: 'test-script' };
        const checkoutUrl = 'https://checkout.stripe.com/test';
        
        spyOn(window, 'open').and.returnValue({
          closed: false,
          close: jasmine.createSpy('close')
        } as any);

        const result = service.handleSubscriptionFlow(finalDocument, checkoutUrl);
        expect(window.open).toHaveBeenCalledWith(
          checkoutUrl,
          'StripeCheckout',
          jasmine.stringMatching(/width=700,height=1000/)
        );
        expect(result).toBeDefined();
      });

      it('should handle popup closure and retry PDF generation', (done) => {
        const finalDocument = { name: 'test-script' };
        const checkoutUrl = 'https://checkout.stripe.com/test';
        
        const mockPopup = {
          closed: false,
          close: jasmine.createSpy('close')
        };
        
        spyOn(window, 'open').and.returnValue(mockPopup as any);
        mockAuthService.checkSubscriptionStatus.and.returnValue(Promise.resolve(true));
        
        spyOn(service, 'generatePdf').and.returnValue(of({
          success: true,
          pdfToken: 'retry-token'
        }));

        const result = service.handleSubscriptionFlow(finalDocument, checkoutUrl);
        
        // Simulate popup closing
        setTimeout(() => {
          mockPopup.closed = true;
        }, 100);

        result.subscribe({
          next: (response) => {
            expect(response.success).toBeTrue();
            done();
          },
          error: (error) => done.fail(error)
        });
      });
    });
  });

  describe('File Download', () => {
    describe('downloadPdf()', () => {
      it('should download PDF successfully', (done) => {
        const name = 'test-script';
        const callsheet = 'test-callsheet';
        const pdfToken = 'test-token';
        const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

        service.downloadPdf(name, callsheet, pdfToken).subscribe({
          next: (response) => {
            expect(response).toBe(mockBlob);
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(
          `${service.url}/complete/${pdfToken}?name=${name}&callsheet=${callsheet}`
        );
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        req.flush(mockBlob);
      });

      it('should handle download errors', (done) => {
        const name = 'test-script';
        const callsheet = 'test-callsheet';
        const pdfToken = 'invalid-token';

        service.downloadPdf(name, callsheet, pdfToken).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(
          `${service.url}/complete/${pdfToken}?name=${name}&callsheet=${callsheet}`
        );
        req.flush(null, { status: 404, statusText: 'Not Found' });
      });
    });
  });

  describe('Document Management', () => {
    describe('deleteFinalDocument()', () => {
      it('should delete document successfully', (done) => {
        const pdfToken = 'test-token';
        const mockResponse = { success: true, pdfToken };

        service.deleteFinalDocument(pdfToken).subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            done();
          },
          error: (error) => done.fail(error)
        });

        const req = httpMock.expectOne(`${service.url}/delete`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ pdfToken });
        req.flush(mockResponse);
      });

      it('should handle delete errors', (done) => {
        const pdfToken = 'invalid-token';

        service.deleteFinalDocument(pdfToken).subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const req = httpMock.expectOne(`${service.url}/delete`);
        req.flush(null, { status: 404, statusText: 'Not Found' });
      });
    });
  });

  describe('Type Guards', () => {
    describe('isSubscriptionResponse()', () => {
      it('should identify subscription response correctly', () => {
        const subscriptionResponse = {
          success: false,
          needsSubscription: true,
          checkoutUrl: 'https://checkout.stripe.com/test'
        };

        expect(service.isSubscriptionResponse(subscriptionResponse)).toBeTrue();
      });

      it('should reject non-subscription response', () => {
        const pdfResponse = {
          success: true,
          pdfToken: 'test-token'
        };

        expect(service.isSubscriptionResponse(pdfResponse)).toBeFalse();
      });
    });

    describe('isPdfResponse()', () => {
      it('should identify PDF response correctly', () => {
        const pdfResponse = {
          success: true,
          pdfToken: 'test-token'
        };

        expect(service.isPdfResponse(pdfResponse)).toBeTrue();
      });

      it('should reject non-PDF response', () => {
        const subscriptionResponse = {
          success: false,
          needsSubscription: true
        };

        expect(service.isPdfResponse(subscriptionResponse)).toBeFalse();
      });
    });
  });

  describe('State Management', () => {
    it('should reset service state', () => {
      // Set some state
      service.script = 'test-script';
      service.title = 'Test Title';
      service.allLines = mockScriptData.allLines;

      // Reset state
      service.resetServiceState();

      expect(service.script).toBeUndefined();
      expect(service.title).toBeUndefined();
      expect(service.allLines).toBeUndefined();
    });

    it('should track PDF usage', (done) => {
      const mockUsage = {
        currentUsage: 5,
        maxUsage: 10,
        resetDate: new Date()
      };

      service.pdfUsage$.subscribe(usage => {
        if (usage) {
          expect(usage).toEqual(mockUsage);
          done();
        }
      });

      // Simulate usage update
      (service as any).pdfUsageSubject.next(mockUsage);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', (done) => {
      const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });
      const errorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: 'Server error' }
      });

      service.postFile(file).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${service.url}/api`);
      req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle timeout errors', (done) => {
      const file = new File(['test content'], 'test-script.pdf', { type: 'application/pdf' });

      service.postFile(file).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${service.url}/api`);
      req.error(new ErrorEvent('timeout'));
    });
  });
});

