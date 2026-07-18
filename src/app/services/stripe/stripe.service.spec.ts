import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';
import { StripeService } from './stripe.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, BackendSubscriptionResponse } from '../../types/SubscriptionTypes';
import { User } from '@angular/fire/auth';

/** Flush getIdToken microtask so HttpClientTestingController sees the request. */
async function flushAuthToken(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

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
    it('should fetch subscription status successfully', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      expect(req.request.method).toBe('GET');
      req.flush(mockSubscriptionResponse);
      const status = await statusPromise;
      expect(status).toBeDefined();
      expect(status?.active).toBe(true);
      expect(status?.subscription?.status).toBe('active');
    });

    it('E1: maps isFounder from status API', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush({ ...mockInactiveSubscriptionResponse, isFounder: true });
      const status = await statusPromise;
      expect(status.isFounder).toBe(true);
    });

    it('should handle inactive subscription', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush(mockInactiveSubscriptionResponse);
      const status = await statusPromise;
      expect(status).toBeDefined();
      expect(status?.active).toBe(false);
      expect(status?.subscription?.status).toBe('canceled');
    });

    it('should handle HTTP errors by returning empty status', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      const status = await statusPromise;
      expect(status.active).toBe(false);
      expect(status.isFounder).toBe(false);
    });

    it('should handle network errors by returning empty status', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.error(new ErrorEvent('Network error'));
      const status = await statusPromise;
      expect(status.active).toBe(false);
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

    it('should create portal session successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal' as const,
        message: 'Portal session created'
      };

      const resultPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.userId).toBe('test-user-123');
      expect(req.request.body.userEmail).toBe('test@example.com');
      expect(req.request.body.priceId).toBeUndefined();
      req.flush(mockResponse);
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://billing.stripe.com/session_123');
      expect(result.type).toBe('portal');
    });

    it('should handle portal session creation failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Failed to create portal session'
      };

      const resultPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid URL response', async () => {
      const mockResponse = {
        success: true,
        url: 'invalid-url'
      };

      const resultPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
      const result = await resultPromise;
      expect(result.success).toBe(false);
    });

    it('should handle missing URL in response', async () => {
      const mockResponse = {
        success: true
      };

      const resultPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
      const result = await resultPromise;
      expect(result.success).toBe(false);
    });

    it('should redirect to portal URL on success', async () => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal' as const
      };

      const resultPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/create-portal-session');
      req.flush(mockResponse);
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://billing.stripe.com/session_123');
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
    it('should get auth headers with user token', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockUser.getIdToken = jest.fn().mockResolvedValue('mock-token');
      const headers = await firstValueFrom(service['getAuthHeaders']());
      expect(headers.get('Authorization')).toBe('Bearer mock-token');
    });

    it('should handle missing user', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      try {
        await firstValueFrom(service['getAuthHeaders']());
        fail('Should have errored');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle token retrieval error', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockUser.getIdToken = jest.fn().mockRejectedValue(new Error('Token error'));
      try {
        await firstValueFrom(service['getAuthHeaders']());
        fail('Should have errored');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 401 errors with empty status', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      const status = await statusPromise;
      expect(status.active).toBe(false);
    });

    it('should handle HTTP 403 errors with empty status', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      const status = await statusPromise;
      expect(status.active).toBe(false);
    });

    it('should handle malformed JSON responses with empty status', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Invalid JSON', { status: 200, statusText: 'OK' });
      const status = await statusPromise;
      expect(status).toBeDefined();
    });
  });

  describe('Subscription Status Updates', () => {
    it('should emit subscription status updates', async () => {
      const emissions: Array<SubscriptionStatus | null> = [];
      const sub = service.subscriptionStatus$.subscribe(status => emissions.push(status));

      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush(mockSubscriptionResponse);
      await statusPromise;
      sub.unsubscribe();

      expect(emissions[0]).toBeNull();
      expect(emissions.some(e => e?.active === true)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription flow', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      httpMock
        .expectOne('http://localhost:3000/stripe/subscription-status/test-user-123')
        .flush(mockInactiveSubscriptionResponse);
      await statusPromise;

      const portalPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      httpMock.expectOne('http://localhost:3000/stripe/create-portal-session').flush({
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal'
      });
      const result = await portalPromise;
      expect(result.success).toBe(true);
    });

    it('should handle subscription management flow', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      httpMock
        .expectOne('http://localhost:3000/stripe/subscription-status/test-user-123')
        .flush(mockSubscriptionResponse);
      await statusPromise;

      const portalPromise = firstValueFrom(
        service.createPortalSession('test-user-123', 'test@example.com')
      );
      await flushAuthToken();
      httpMock.expectOne('http://localhost:3000/stripe/create-portal-session').flush({
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal'
      });
      const result = await portalPromise;
      expect(result.success).toBe(true);
    });
  });
});