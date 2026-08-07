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

  describe('Scheduling tier entitlement (spec 028)', () => {
    it('maps hasSchedulingTier and schedulingSubscription from the backend response', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush({
        ...mockInactiveSubscriptionResponse,
        hasSchedulingTier: true,
        schedulingSubscription: {
          status: 'active',
          subscriptionId: 'sub_sched_123',
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          cancelAtPeriodEnd: false,
          plan: { id: 'price_scheduling_weekly', interval: 'week' }
        }
      });
      const status = await statusPromise;

      expect(status.hasSchedulingTier).toBe(true);
      expect(status.schedulingSubscription).not.toBeNull();
      expect(status.schedulingSubscription?.id).toBe('sub_sched_123');
      expect(status.schedulingSubscription?.status).toBe('active');
      expect(status.schedulingSubscription?.plan?.interval).toBe('week');
    });

    it('defaults hasSchedulingTier to false and schedulingSubscription to null when absent from the backend response', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush(mockInactiveSubscriptionResponse);
      const status = await statusPromise;

      expect(status.hasSchedulingTier).toBe(false);
      expect(status.schedulingSubscription).toBeNull();
    });

    it('defaults hasSchedulingTier to false in createEmptyStatus (HTTP error path)', async () => {
      const statusPromise = firstValueFrom(service.getSubscriptionStatus('test-user-123'));
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/subscription-status/test-user-123');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      const status = await statusPromise;

      expect(status.hasSchedulingTier).toBe(false);
      expect(status.schedulingSubscription).toBeNull();
    });

    it('createSchedulingCheckoutSession posts the selected interval and redirects on success', async () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200', href: '' },
        writable: true
      });

      const resultPromise = firstValueFrom(
        service.createSchedulingCheckoutSession('test-user-123', 'test@example.com', 'month')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/scheduling/checkout');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.interval).toBe('month');
      expect(req.request.body.userId).toBe('test-user-123');
      req.flush({ success: true, url: 'https://checkout.stripe.com/session_123', priceOffered: 'price_scheduling_monthly' });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://checkout.stripe.com/session_123');
    });

    it('surfaces ALREADY_HAS_SCHEDULING_TIER as a typed error the UI can render', async () => {
      const resultPromise = firstValueFrom(
        service.createSchedulingCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/scheduling/checkout');
      req.flush({ success: false, error: 'ALREADY_HAS_SCHEDULING_TIER' }, { status: 409, statusText: 'Conflict' });

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_HAS_SCHEDULING_TIER');
    });

    it('surfaces SCHEDULING_PRICE_MISSING as a typed error the UI can render', async () => {
      const resultPromise = firstValueFrom(
        service.createSchedulingCheckoutSession('test-user-123', 'test@example.com', 'month')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/scheduling/checkout');
      req.flush(
        { success: false, error: 'SCHEDULING_PRICE_MISSING', message: 'STRIPE_SCHEDULING_MONTHLY_PRICE is not configured' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('SCHEDULING_PRICE_MISSING');
    });
  });

  describe('createTeamCheckoutSession (spec 033)', () => {
    it('posts interval + userId to /stripe/team/checkout and redirects on success', async () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200', href: '' },
        writable: true
      });

      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('test-user-123', 'test@example.com', 'month')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.interval).toBe('month');
      expect(req.request.body.userId).toBe('test-user-123');
      expect(req.request.body.userEmail).toBe('test@example.com');
      req.flush({ success: true, url: 'https://checkout.stripe.com/team_session_123', priceOffered: 'price_team_monthly' });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://checkout.stripe.com/team_session_123');
    });

    it('returns upgraded=true for in-place Team upgrade without redirect', async () => {
      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      req.flush({ success: true, upgraded: true, url: null, subscriptionId: 'sub_team_123' });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.upgraded).toBe(true);
      expect(result.url).toBeNull();
    });

    it('surfaces TEAM_PRICES_NOT_CONFIGURED with friendly message on 503', async () => {
      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      req.flush(
        { success: false, error: 'TEAM_PRICES_NOT_CONFIGURED', message: 'Team prices not yet set up' },
        { status: 503, statusText: 'Service Unavailable' }
      );

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('TEAM_PRICES_NOT_CONFIGURED');
      expect(result.message).toBe('Team plan coming online soon — contact us');
    });

    it('surfaces typed error from 4xx responses', async () => {
      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('test-user-123', 'test@example.com', 'month')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      req.flush(
        { success: false, error: 'ALREADY_HAS_TEAM_TIER', message: 'Already subscribed to Team' },
        { status: 409, statusText: 'Conflict' }
      );

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_HAS_TEAM_TIER');
    });

    it('handles 401 with auth message', async () => {
      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Authentication failed. Please log in again.');
    });

    it('sends returnUrl pointing to /profile', async () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200', href: '' },
        writable: true
      });

      const resultPromise = firstValueFrom(
        service.createTeamCheckoutSession('u1', 'u@test.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/team/checkout');
      expect(req.request.body.returnUrl).toBe('http://localhost:4200/profile');
      req.flush({ success: true, url: 'https://checkout.stripe.com/x' });
      await resultPromise;
    });
  });

  describe('createBasicCheckoutSession (spec 033 downgrade)', () => {
    it('posts interval + userId to /stripe/basic/checkout and handles in-place downgrade', async () => {
      const resultPromise = firstValueFrom(
        service.createBasicCheckoutSession('test-user-123', 'test@example.com', 'month')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/basic/checkout');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.interval).toBe('month');
      expect(req.request.body.userId).toBe('test-user-123');
      expect(req.request.body.userEmail).toBe('test@example.com');
      req.flush({ success: true, upgraded: true, url: null, subscriptionId: 'sub_basic_123' });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.upgraded).toBe(true);
      expect(result.url).toBeNull();
    });

    it('redirects to Checkout URL when no active sub to downgrade in place', async () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200', href: '' },
        writable: true
      });

      const resultPromise = firstValueFrom(
        service.createBasicCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/basic/checkout');
      req.flush({ success: true, url: 'https://checkout.stripe.com/basic_123' });

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://checkout.stripe.com/basic_123');
    });

    it('surfaces typed error on 4xx', async () => {
      const resultPromise = firstValueFrom(
        service.createBasicCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/basic/checkout');
      req.flush(
        { success: false, error: 'BASIC_CHECKOUT_FAILED', message: 'Something went wrong' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('BASIC_CHECKOUT_FAILED');
    });

    it('surfaces auth error message on 401', async () => {
      const resultPromise = firstValueFrom(
        service.createBasicCheckoutSession('test-user-123', 'test@example.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/basic/checkout');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.message).toBe('Authentication failed. Please log in again.');
    });

    it('sends returnUrl pointing to /profile', async () => {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:4200', href: '' },
        writable: true
      });

      const resultPromise = firstValueFrom(
        service.createBasicCheckoutSession('u1', 'u@test.com', 'week')
      );
      await flushAuthToken();
      const req = httpMock.expectOne('http://localhost:3000/stripe/basic/checkout');
      expect(req.request.body.returnUrl).toBe('http://localhost:4200/profile');
      req.flush({ success: true, upgraded: true, url: null });
      await resultPromise;
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