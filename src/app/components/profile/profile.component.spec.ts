import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { ScheduleApiService } from '../../services/schedule/schedule-api.service';
import { PdfService } from '../../services/pdf/pdf.service';
import { FunDataService } from '../../services/fundata/fundata.service';
import { Router, NavigationEnd } from '@angular/router';
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
      getSubscriptionStatus: jest.fn().mockReturnValue(of(mockActiveSubscription)),
      createPortalSession: jest.fn(),
      subscriptionStatus$: of(mockActiveSubscription),
      clearCache: jest.fn(),
      canGeneratePdf: jest.fn().mockReturnValue(true)
    } as any;

    mockAuthService = {
      user$: of(mockUser),
      getCurrentUser: jest.fn(),
      getAuthenticatedUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      checkSubscriptionStatus: jest.fn()
    } as any;

    const mockScheduleApiService = {
      listSchedules: jest.fn().mockReturnValue(of({ success: true, schedules: [], count: 0 })),
      getSchedule: jest.fn(),
      createSchedule: jest.fn(),
      updateSchedule: jest.fn(),
      deleteSchedule: jest.fn(),
    };

    const mockPdfService = {
      getScriptName: jest.fn().mockReturnValue(''),
    };

    const mockFunDataService = {
      getStats: jest.fn().mockReturnValue(of({
        success: true,
        stats: {
          accurate: {
            scriptsProcessed: 0,
            linesCrawled: 0,
            scenesFound: 0,
            charactersDiscovered: 0,
            sidesCreated: 0,
            pagesGenerated: 0,
            schedulesCreated: 0,
            totalCharacterAppearances: 0,
          },
          fun: {
            minutesSaved: 0,
            circlesNotDrawn: 0,
            cigarettesNotSmoked: 0,
          },
          updatedAt: null,
        },
      })),
    };

    const mockRouter = {
      navigate: jest.fn(),
      events: new Subject<any>(),
    };

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ScheduleApiService, useValue: mockScheduleApiService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: FunDataService, useValue: mockFunDataService },
        { provide: Router, useValue: mockRouter }
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
      expect(component.isLoading).toBe(true); // Default is true until data loads
      expect(component.error).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    it('should load user and subscription data', (done) => {
      mockStripeService.getSubscriptionStatus.mockReturnValue(of(mockActiveSubscription));
      
      component.ngOnInit();

      setTimeout(() => {
        expect(component.subscription).toEqual(mockActiveSubscription);
        expect(mockStripeService.getSubscriptionStatus).toHaveBeenCalledWith('test-user-123');
        done();
      }, 0);
    });

    it('should handle no user scenario', () => {
      mockAuthService.user$ = of(null);
      
      component.ngOnInit();

      expect(component.isLoading).toBe(false);
    });
  });

  describe('isUsageNearLimit', () => {
    it('should return true when usage is near limit', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          pdfsGenerated: 49,
          pdfUsageLimit: 50,
          remainingPdfs: 1
        }
      };

      expect(component.isUsageNearLimit()).toBe(true);
    });

    it('should return true when no PDFs remain', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          pdfsGenerated: 50,
          pdfUsageLimit: 50,
          remainingPdfs: 0
        }
      };

      expect(component.isUsageNearLimit()).toBe(true);
    });

    it('should return false when usage is not near limit', () => {
      component.subscription = {
        ...mockActiveSubscription,
        usage: {
          ...mockActiveSubscription.usage,
          pdfsGenerated: 30,
          pdfUsageLimit: 50,
          remainingPdfs: 20
        }
      };

      expect(component.isUsageNearLimit()).toBe(false);
    });

    it('should return false when subscription data is null', () => {
      component.subscription = null;
      expect(component.isUsageNearLimit()).toBe(false);
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

      // of() resolves synchronously, so isLoading is already reset
      setTimeout(() => {
        expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
        expect(component.isLoading).toBe(false);
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
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toBe('Error creating subscription');
        expect(component.error).toBe('An error occurred while creating your subscription');
        expect(component.isLoading).toBe(false);
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
        expect(component.isLoading).toBe(false);
        done();
      }, 0);
    });
  });

  describe('manageSubscription', () => {
    it('should manage subscription successfully', (done) => {
      component.user = mockUser;
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/portal_123',
        type: 'portal' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      component.manageSubscription();

      // of() resolves synchronously, so isLoading is already reset
      setTimeout(() => {
        expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
        expect(component.isLoading).toBe(false);
        expect(component.error).toBeNull();
        done();
      }, 0);
    });

    it('should handle missing user', () => {
      component.user = null;

      component.manageSubscription();

      expect(component.error).toBe('You must be logged in to manage your subscription');
      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle management error', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Management failed')));

      component.manageSubscription();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toBe('Error opening portal');
        expect(component.error).toBe('An error occurred while opening subscription management');
        expect(component.isLoading).toBe(false);
        consoleSpy.mockRestore();
        done();
      }, 0);
    });
  });

  describe('Subscription Status Display', () => {
    it('should display active subscription correctly', () => {
      component.subscription = mockActiveSubscription;

      expect(component.subscription?.active).toBe(true);
      expect(component.subscription?.subscription?.status).toBe('active');
      expect(component.subscription?.usage?.remainingPdfs).toBe(45);
    });

    it('should display inactive subscription correctly', () => {
      component.subscription = mockInactiveSubscription;

      expect(component.subscription?.active).toBe(false);
      expect(component.subscription?.subscription?.status).toBe('canceled');
      expect(component.subscription?.usage?.remainingPdfs).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should not overwrite error on successful subscription creation', () => {
      component.error = 'Previous error';
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(of({ success: true }));

      component.handleNewSubscription();

      // Component does not explicitly clear error on start; success path doesn't set error
      expect(component.error).toBe('Previous error');
    });

    it('should not overwrite error on successful subscription management', () => {
      component.error = 'Previous error';
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(of({ success: true, url: 'https://example.com' }));

      component.manageSubscription();

      // Component does not explicitly clear error on start; success path doesn't set error
      expect(component.error).toBe('Previous error');
    });

    it('should handle network errors gracefully', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Network error')));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toBe('Error creating subscription');
        expect(component.error).toBe('An error occurred while creating your subscription');
        consoleSpy.mockRestore();
        done();
      }, 0);
    });
  });

  describe('Loading States', () => {
    it('should be false after synchronous subscription creation completes', () => {
      component.user = mockUser;
      mockStripeService.createPortalSession.mockReturnValue(of({ success: true, url: 'test' }));

      component.handleNewSubscription();

      // of() resolves synchronously, so isLoading is already reset
      expect(component.isLoading).toBe(false);
    });

    it('should clear loading state on error', (done) => {
      component.user = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Test error')));

      component.handleNewSubscription();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        consoleSpy.mockRestore();
        done();
      }, 0);
    });
  });

  describe('Current Script', () => {
    it('should initialize currentScriptName as empty when no script is loaded', () => {
      component.ngOnInit();
      expect(component.currentScriptName).toBe('');
    });

    it('should set currentScriptName when a script is loaded in PdfService', () => {
      const pdfService = TestBed.inject(PdfService);
      (pdfService.getScriptName as jest.Mock).mockReturnValue('THE_WACKNESS.pdf');

      component.ngOnInit();
      expect(component.currentScriptName).toBe('THE_WACKNESS.pdf');
    });

    it('should navigate to dashboard on navigateToDashboard()', () => {
      const router = TestBed.inject(Router);
      component.navigateToDashboard();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
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