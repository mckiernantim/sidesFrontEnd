import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SubscriptionComponent } from './subscription.component';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
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

describe('SubscriptionComponent', () => {
  let component: SubscriptionComponent;
  let fixture: ComponentFixture<SubscriptionComponent>;
  let mockStripeService: jest.Mocked<StripeService>;
  let mockAuthService: jest.Mocked<AuthService>;

  const mockUser = createMockUser();

  const mockActiveSubscription: SubscriptionStatus = {
    active: true,
    subscription: {
      id: 'sub_test123',
      status: 'active',
      created: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      willAutoRenew: true,
      originalStartDate: '2024-01-01T00:00:00Z',
      plan: {
        id: 'plan_monthly',
        nickname: 'Monthly Plan',
        amount: 2999,
        interval: 'month'
      }
    },
    usage: {
      pdfsGenerated: 5,
      lastPdfGeneration: '2024-01-15T00:00:00Z',
      pdfUsageLimit: 50,
      subscriptionStatus: 'active',
      subscriptionFeatures: {
        pdfGeneration: true,
        unlimitedPdfs: false,
        pdfLimit: 50
      },
      resetDate: '2024-02-01T00:00:00Z',
      remainingPdfs: 45
    },
    plan: 'monthly',
    lastPayment: {
      status: 'succeeded',
      amount: 2999,
      date: '2024-01-01T00:00:00Z'
    }
  };

  const mockInactiveSubscription: SubscriptionStatus = {
    active: false,
    subscription: {
      id: 'sub_canceled',
      status: 'canceled',
      created: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-01-31T00:00:00Z',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      cancelAtPeriodEnd: true,
      willAutoRenew: false,
      originalStartDate: '2024-01-01T00:00:00Z',
      plan: {
        id: 'plan_monthly',
        nickname: 'Monthly Plan',
        amount: 2999,
        interval: 'month'
      }
    },
    usage: {
      pdfsGenerated: 0,
      lastPdfGeneration: null,
      pdfUsageLimit: 0,
      subscriptionStatus: 'canceled',
      subscriptionFeatures: {
        pdfGeneration: false,
        unlimitedPdfs: false,
        pdfLimit: 0
      },
      resetDate: null,
      remainingPdfs: 0
    },
    plan: null
  };

  beforeEach(async () => {
    mockStripeService = {
      getSubscriptionStatus: jest.fn(),
      createPortalSession: jest.fn(),
      subscriptionStatus$: of(mockActiveSubscription),
      clearCache: jest.fn()
    } as any;

    mockAuthService = {
      user$: of(mockUser),
      getCurrentUser: jest.fn(),
      getAuthenticatedUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      checkSubscriptionStatus: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      declarations: [SubscriptionComponent],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize subscription data observable', () => {
      fixture.detectChanges();
      expect(component.subscriptionData$).toBeDefined();
    });

    it('should load subscription data for authenticated user', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockActiveSubscription));
      
      fixture.detectChanges();

      component.subscriptionData$.subscribe(subscription => {
        expect(subscription).toEqual(mockActiveSubscription);
        expect(mockStripeService.getSubscriptionStatus).toHaveBeenCalledWith('test-user-123');
        done();
      });
    });

    it('should handle no user scenario', (done) => {
      mockAuthService.user$ = of(null);
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(null));
      
      fixture.detectChanges();

      component.subscriptionData$.subscribe(subscription => {
        expect(subscription).toBeNull();
        done();
      });
    });
  });

  describe('startSubscription', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });

    it('should start subscription successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/session_123',
        type: 'portal' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.startSubscription();

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
      expect(window.location.href).toBe('https://billing.stripe.com/session_123');
    });

    it('should handle subscription creation error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Subscription failed')));

      await component.startSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error starting subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('should handle missing user', async () => {
      mockAuthService.user$ = of(null);

      await component.startSubscription();

      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle missing URL in response', async () => {
      const mockResponse = {
        success: true,
        url: null
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.startSubscription();

      expect(mockStripeService.createPortalSession).toHaveBeenCalled();
      expect(window.location.href).toBe(''); // Should not redirect
    });
  });

  describe('manageSubscription', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });

    it('should manage subscription successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/portal_123',
        type: 'portal' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.manageSubscription();

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
      expect(window.location.href).toBe('https://billing.stripe.com/portal_123');
    });

    it('should handle management error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Management failed')));

      await component.manageSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error managing subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('cancelSubscription', () => {
    it('should call manageSubscription for cancellation', async () => {
      const manageSpy = jest.spyOn(component, 'manageSubscription').mockResolvedValue();

      await component.cancelSubscription();

      expect(manageSpy).toHaveBeenCalled();
    });
  });

  describe('reactivateSubscription', () => {
    it('should call startSubscription for reactivation', async () => {
      const startSpy = jest.spyOn(component, 'startSubscription').mockResolvedValue();

      await component.reactivateSubscription();

      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(component.formatBytes(0)).toBe('0 Bytes');
      expect(component.formatBytes(1024)).toBe('1 KB');
      expect(component.formatBytes(1048576)).toBe('1 MB');
      expect(component.formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(component.formatBytes(1536)).toBe('1.5 KB');
      expect(component.formatBytes(1572864)).toBe('1.5 MB');
    });
  });

  describe('Component Lifecycle', () => {
    it('should complete destroy subject on destroy', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Subscription Data Scenarios', () => {
    it('should handle active subscription data', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockActiveSubscription));
      
      fixture.detectChanges();

      component.subscriptionData$.subscribe(subscription => {
        expect(subscription?.active).toBe(true);
        expect(subscription?.subscription?.status).toBe('active');
        expect(subscription?.usage?.remainingPdfs).toBe(45);
        done();
      });
    });

    it('should handle inactive subscription data', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockInactiveSubscription));
      
      fixture.detectChanges();

      component.subscriptionData$.subscribe(subscription => {
        expect(subscription?.active).toBe(false);
        expect(subscription?.subscription?.status).toBe('canceled');
        expect(subscription?.usage?.remainingPdfs).toBe(0);
        done();
      });
    });

    it('should handle subscription service error', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(throwError(() => new Error('Service error')));
      
      fixture.detectChanges();

      component.subscriptionData$.subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Network error')));

      await component.startSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error starting subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('should handle service unavailable errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Service unavailable')));

      await component.manageSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error managing subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription lifecycle', async () => {
      // Start with inactive subscription
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockInactiveSubscription));
      fixture.detectChanges();

      // Start subscription
      const startResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };
      mockStripeService.createPortalSession.mockReturnValue(of(startResponse));

      await component.startSubscription();
      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');

      // Later, manage active subscription
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockActiveSubscription));
      const manageResponse = {
        success: true,
        url: 'https://billing.stripe.com/portal_123',
        type: 'portal' as const
      };
      mockStripeService.createPortalSession.mockReturnValue(of(manageResponse));

      await component.manageSubscription();
      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
    });
  });
});