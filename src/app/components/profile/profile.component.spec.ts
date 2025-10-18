import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
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

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
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
      declarations: [ProfileComponent],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.user).toBeNull();
      expect(component.subscription).toBeNull();
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load user and subscription data', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockActiveSubscription));
      
      component.ngOnInit();

      component.subscription$.subscribe(subscription => {
        expect(subscription).toEqual(mockActiveSubscription);
        expect(mockStripeService.getSubscriptionStatus).toHaveBeenCalledWith('test-user-123');
        done();
      });
    });

    it('should handle no user scenario', (done) => {
      mockAuthService.user$ = of(null);
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(null));
      
      component.ngOnInit();

      component.subscription$.subscribe(subscription => {
        expect(subscription).toBeNull();
        done();
      });
    });
  });

  describe('isUsageNearLimit', () => {
    it('should return true when usage is near limit', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          remainingPdfs: 1
        }
      };

      expect(component.isUsageNearLimit()).toBeTrue();
    });

    it('should return true when no PDFs remain', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          remainingPdfs: 0
        }
      };

      expect(component.isUsageNearLimit()).toBeTrue();
    });

    it('should return false when usage is not near limit', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          remainingPdfs: 20
        }
      };

      expect(component.isUsageNearLimit()).toBeFalse();
    });

    it('should return false when subscription data is null', () => {
      component.subscription = null;
      expect(component.isUsageNearLimit()).toBeFalse();
    });
  });

  describe('handleNewSubscription', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });

    it('should create new subscription successfully', (done) => {
      component.user = mockUser;
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      component.handleNewSubscription();

      expect(component.isLoading).toBeTrue();
      
      setTimeout(() => {
        expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
        expect(window.location.href).toBe('https://billing.stripe.com/checkout_123');
        expect(component.isLoading).toBeFalse();
        done();
      }, 0);
    });

    it('should handle missing user', () => {
      component.user = null;

      component.handleNewSubscription();

      expect(component.error).toBe('You must be logged in to subscribe');
      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle missing email', () => {
      component.user = createMockUser({ email: null });

      component.handleNewSubscription();

      expect(component.error).toBe('You must be logged in to subscribe');
      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle subscription creation error', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Subscription failed')));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating subscription', expect.any(Object));
        expect(component.error).toBe('An error occurred while creating your subscription');
        expect(component.isLoading).toBeFalse();
        consoleSpy.mockRestore();
        done();
      }, 0);
    });

    it('should handle unsuccessful response', (done) => {
      component.user = mockUser;
      const mockResponse = {
        success: false,
        error: 'Payment failed'
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(component.error).toBe('Payment failed');
        expect(component.isLoading).toBeFalse();
        done();
      }, 0);
    });
  });

  describe('manageSubscription', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });

    it('should manage subscription successfully', (done) => {
      component.user = mockUser;
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/portal_123',
        type: 'portal' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      component.manageSubscription();

      expect(component.isLoading).toBeTrue();
      
      setTimeout(() => {
        expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
        expect(window.location.href).toBe('https://billing.stripe.com/portal_123');
        expect(component.isLoading).toBeFalse();
        done();
      }, 0);
    });

    it('should handle missing user', () => {
      component.user = null;

      component.manageSubscription();

      expect(component.error).toBe('You must be logged in to manage subscription');
      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle management error', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Management failed')));

      component.manageSubscription();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error managing subscription', expect.any(Object));
        expect(component.error).toBe('An error occurred while managing your subscription');
        expect(component.isLoading).toBeFalse();
        consoleSpy.mockRestore();
        done();
      }, 0);
    });
  });

  describe('Subscription Status Display', () => {
    it('should display active subscription correctly', () => {
      component.subscription = mockActiveSubscription;

      expect(component.subscription?.active).toBeTrue();
      expect(component.subscription?.subscription?.status).toBe('active');
      expect(component.subscription?.usage?.remainingPdfs).toBe(45);
    });

    it('should display inactive subscription correctly', () => {
      component.subscription = mockInactiveSubscription;

      expect(component.subscription?.active).toBeFalse();
      expect(component.subscription?.subscription?.status).toBe('canceled');
      expect(component.subscription?.usage?.remainingPdfs).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when starting new operation', () => {
      component.error = 'Previous error';
      component.user = mockUser;

      component.handleNewSubscription();

      expect(component.error).toBeNull();
    });

    it('should clear error when managing subscription', () => {
      component.error = 'Previous error';
      component.user = mockUser;

      component.manageSubscription();

      expect(component.error).toBeNull();
    });

    it('should handle network errors gracefully', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Network error')));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating subscription', expect.any(Object));
        expect(component.error).toBe('An error occurred while creating your subscription');
        consoleSpy.mockRestore();
        done();
      }, 0);
    });
  });

  describe('Loading States', () => {
    it('should set loading state during subscription creation', () => {
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(of({ success: true, url: 'test' }));

      component.handleNewSubscription();

      expect(component.isLoading).toBeTrue();
    });

    it('should clear loading state after subscription creation', (done) => {
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(of({ success: true, url: 'test' }));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        done();
      }, 0);
    });

    it('should clear loading state on error', (done) => {
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Test error')));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        done();
      }, 0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete subscription lifecycle', (done) => {
      // Start with inactive subscription
      component.user = mockUser;
      component.subscription = mockInactiveSubscription;

      // Start new subscription
      const startResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };
      mockStripeService.createPortalSession.mockReturnValue(of(startResponse));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
        
        // Later, manage active subscription
        component.subscription = mockActiveSubscription;
        const manageResponse = {
          success: true,
          url: 'https://billing.stripe.com/portal_123',
          type: 'portal' as const
        };
        mockStripeService.createPortalSession.mockReturnValue(of(manageResponse));

        component.manageSubscription();

        setTimeout(() => {
          expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
          done();
        }, 0);
      }, 0);
    });
  });
});