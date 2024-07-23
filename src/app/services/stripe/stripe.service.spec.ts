import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StripeService } from './stripe.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

describe('StripeService', () => {
  let service: StripeService;
  let httpMock: HttpTestingController;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn()
    } as unknown as jest.Mocked<Router>;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StripeService,
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(StripeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start checkout', () => {
    const expirationTime = 60;
    const jwtToken = 'test-token';
    const downloadTimeRemaining = 120;
    const requestBody = {
      test: true,
      expirationTime: expirationTime,
      jwtToken
    };

    service.startCheckout(expirationTime, jwtToken, downloadTimeRemaining).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.url}/start-checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.body).toEqual(requestBody);
    expect(req.request.body.headers.get('Content-Type')).toBe('application/json');
    req.flush({ success: true });
  });

  it('should handle payment success', () => {
    service.handlePaymentSuccess();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/complete']);
  });
});
