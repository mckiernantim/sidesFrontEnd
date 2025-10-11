import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StripeService } from './stripe.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, BackendSubscriptionResponse } from '../../types/SubscriptionTypes';
import { User } from '@angular/fire/auth';

// Create mock user inline
const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'firebase',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: '2024-01-01T00:00:00Z',
      lastSignInTime: '2024-01-01T00:00:00Z'
    } as any,
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-id-token',
      authTime: '2024-01-01T00:00:00Z',
      issuedAtTime: '2024-01-01T00:00:00Z',
      expirationTime: '2024-01-02T00:00:00Z',
      signInProvider: 'google.com',
      signInSecondFactor: null,
      claims: {}
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({}),
    ...overrides
  } as User;
};

// Mock the Stripe library
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    redirectToCheckout: jest.fn(),
    redirectToCustomerPortal: jest.fn()
  }))
}));

// Mock environment config
jest.mock('../../../environments/environment', () => ({
  getConfig: jest.fn(() => ({
    stripe: 'pk_test_mock_key',
    url: 'http://localhost:3000'
  }))
}));

describe('StripeService', () => {
  let service: StripeService;
  let httpMock: HttpTestingController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  // Mock data
  const mockUser = createMockUser();

  const mockSubscriptionResponse: BackendSubscriptionResponse = {
    active: true,
    subscription: {
      status: 'active',
      subscriptionId: 'sub_test123',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      plan: {
        id: 'plan_monthly',
        nickname: 'Monthly Plan',
        amount: 2999, // $29.99
        interval: 'month'
      },
      createdAt: '2024-01-01T00:00:00Z',
      lastUpdated: '2024-01-01T00:00:00Z',
      lastPaymentStatus: 'succeeded',
      lastPaymentAmount: 2999,
      lastPaymentDate: '2024-01-01T00:00:00Z'
    },
    usage: {
      pdfsGenerated: 5,
      lastPdfGeneration: '2024-01-15T00:00:00Z',
      monthlyLimit: 50,
      resetDate: '2024-02-01T00:00:00Z'
    }
  };

  const mockInactiveSubscriptionResponse: BackendSubscriptionResponse = {
    active: false,
    subscription: {
      status: 'canceled',
      subscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      plan: null,
      createdAt: null,
      lastUpdated: '2024-01-01T00:00:00Z'
    },
    usage: {
      pdfsGenerated: 0,
      lastPdfGeneration: null,
      monthlyLimit: 0,
      resetDate: null
    }
  };

  beforeEach(() => {
    // Reset the mock user's getIdToken method
    mockUser.getIdToken = jest.fn().mockResolvedValue('mock-token');
    
    mockAuthService = {
      getCurrentUser: jest.fn().mockReturnValue(mockUser),
      getAuthenticatedUser: jest.fn(),
      user$: of(mockUser),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      checkSubscriptionStatus: jest.fn()
    } as any;

    mockRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
      url: '/test',
      events: of(),
      isActive: jest.fn(),
      serializeUrl: jest.fn(),
      parseUrl: jest.fn(),
      createUrlTree: jest.fn(),
      config: []
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StripeService,
        { provide: AuthService, useValue: mockAuthService },
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

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with correct configuration', () => {
      expect(service.apiUrl).toBe('http://localhost:3000');
    });

    it('should provide subscription status observable', () => {
      expect(service.subscriptionStatus$).toBeDefined();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should fetch subscription status successfully', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: (status) => {
          expect(status).toBeDefined();
          expect(status?.active).toBe(true);
          expect(status?.subscription?.status).toBe('active');
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      expect(req.request.method).toBe('GET');
      
      req.flush(mockSubscriptionResponse);
    });

    it('should handle inactive subscription', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: (status) => {
          expect(status).toBeDefined();
          expect(status?.active).toBe(false);
          expect(status?.subscription?.status).toBe('canceled');
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush(mockInactiveSubscriptionResponse);
    });

    it('should handle HTTP errors', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('createPortalSession', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:4200',
          href: ''
        },
        writable: true
      });
    });

    it('should create portal session successfully', (done) => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal' as const,
        message: 'Portal session created'
      };

      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.url).toBe('https://billing.stripe.com/session_123');
          expect(result.type).toBe('portal');
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userId: 'test-user-123',
        userEmail: 'test@example.com',
        returnUrl: 'http://localhost:4200'
      });
      
      req.flush(mockResponse);
    });

    it('should handle portal session creation failure', (done) => {
      const mockResponse = {
        success: false,
        error: 'Failed to create portal session'
      };

      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Failed to create portal session');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
    });

    it('should handle invalid URL response', (done) => {
      const mockResponse = {
        success: true,
        url: 'invalid-url'
      };

      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('Invalid URL format');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
    });

    it('should handle missing URL in response', (done) => {
      const mockResponse = {
        success: true
      };

      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toContain('No portal URL received');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
    });

    it('should redirect to portal URL on success', (done) => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal' as const
      };

      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(window.location.href).toBe('https://billing.stripe.com/session_123');
          done();
        },
        error: done
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
    });
  });

  describe('clearCache', () => {
    it('should clear subscription status cache', () => {
      // Set initial status
      service['subscriptionStatusSubject'].next({
        active: true,
        subscription: null,
        usage: {
          pdfsGenerated: 0,
          lastPdfGeneration: null,
          pdfUsageLimit: 0,
          subscriptionStatus: 'active',
          subscriptionFeatures: {
            pdfGeneration: true,
            unlimitedPdfs: false,
            pdfLimit: 50
          },
          resetDate: null,
          remainingPdfs: 50
        },
        plan: 'monthly'
      });

      service.clearCache();

      // Status should be cleared
      service.subscriptionStatus$.subscribe(status => {
        expect(status).toBeNull();
      });
    });
  });

  describe('getAuthHeaders', () => {
    it('should get auth headers with user token', (done) => {
      (mockAuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock getIdToken method
      (mockUser as any).getIdToken = jest.fn().mockResolvedValue('mock-token');

      service['getAuthHeaders']().subscribe({
        next: (headers) => {
          expect(headers.get('Authorization')).toBe('Bearer mock-token');
          done();
        },
        error: done
      });
    });

    it('should handle missing user', (done) => {
      (mockAuthService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      service['getAuthHeaders']().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });

    it('should handle token retrieval error', (done) => {
      (mockAuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (mockUser as any).getIdToken = jest.fn().mockRejectedValue(new Error('Token error'));

      service['getAuthHeaders']().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 401 errors', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle HTTP 403 errors', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle malformed JSON responses', (done) => {
      service.getSubscriptionStatus('test-user-123').subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Invalid JSON', { status: 200, statusText: 'OK' });
    });
  });

  describe('Subscription Status Updates', () => {
    it('should emit subscription status updates', (done) => {
      let emissionCount = 0;
      
      service.subscriptionStatus$.subscribe(status => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(status).toBeNull(); // Initial null value
        } else if (emissionCount === 2) {
          expect(status?.active).toBe(true);
          done();
        }
      });

      // Trigger a status update
      service.getSubscriptionStatus('test-user-123').subscribe();
      
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush(mockSubscriptionResponse);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription flow', (done) => {
      // 1. Check initial status (inactive)
      service.getSubscriptionStatus('test-user-123').subscribe();
      const statusReq = httpMock.expectOne('http://localhost:3000/stripe/subscription-status');
      statusReq.flush(mockInactiveSubscriptionResponse);

      // 2. Create portal session for new subscription
      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          done();
        },
        error: done
      });

      const portalReq = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      portalReq.flush({
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal'
      });
    });

    it('should handle subscription management flow', (done) => {
      // 1. Check active subscription status
      service.getSubscriptionStatus('test-user-123').subscribe();
      const statusReq = httpMock.expectOne('http://localhost:3000/stripe/subscription-status');
      statusReq.flush(mockSubscriptionResponse);

      // 2. Create portal session for management
      service.createPortalSession('test-user-123', 'test@example.com').subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          done();
        },
        error: done
      });

      const portalReq = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      portalReq.flush({
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal'
      });
    });
  });
});