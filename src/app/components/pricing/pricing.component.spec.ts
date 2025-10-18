import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PricingComponent } from './pricing.component';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
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

describe('PricingComponent', () => {
  let component: PricingComponent;
  let fixture: ComponentFixture<PricingComponent>;
  let mockStripeService: jest.Mocked<StripeService>;
  let mockAuthService: jest.Mocked<AuthService>;

  const mockUser = createMockUser();

  beforeEach(async () => {
    mockStripeService = {
      createPortalSession: jest.fn(),
      getSubscriptionStatus: jest.fn(),
      subscriptionStatus$: of(null),
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
      declarations: [PricingComponent],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PricingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with user observable', () => {
      expect(component.user$).toBeDefined();
    });

    it('should set current user from observable', (done) => {
      component.user$.subscribe(user => {
        expect(user).toEqual(mockUser);
        done();
      });
    });
  });

  describe('signIn', () => {
    it('should call auth service sign in', () => {
      component.signIn();

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });
    });

    it('should subscribe successfully with current user', async () => {
      component.currentUser = mockUser;
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.subscribe();

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
      expect(window.location.href).toBe('https://billing.stripe.com/checkout_123');
    });

    it('should subscribe successfully with user from observable', async () => {
      component.currentUser = null;
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.subscribe();

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
      expect(window.location.href).toBe('https://billing.stripe.com/checkout_123');
    });

    it('should handle no user scenario', async () => {
      component.currentUser = null;
      mockAuthService.user$ = of(null);

      await component.subscribe();

      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle subscription error', async () => {
      component.currentUser = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Subscription failed')));

      await component.subscribe();

        expect(consoleSpy).toHaveBeenCalledWith('Error creating subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('should handle unsuccessful response', async () => {
      component.currentUser = mockUser;
      const mockResponse = {
        success: false,
        error: 'Payment failed'
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.subscribe();

      expect(mockStripeService.createPortalSession).toHaveBeenCalled();
      expect(window.location.href).toBe(''); // Should not redirect
    });

    it('should handle missing URL in response', async () => {
      component.currentUser = mockUser;
      const mockResponse = {
        success: true,
        url: null
      };

      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.subscribe();

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

    it('should manage subscription with current user', async () => {
      component.currentUser = mockUser;
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

    it('should manage subscription with user from observable', async () => {
      component.currentUser = null;
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

    it('should handle no user scenario', async () => {
      component.currentUser = null;
      mockAuthService.user$ = of(null);

      await component.manageSubscription();

      expect(mockStripeService.createPortalSession).not.toHaveBeenCalled();
    });

    it('should handle management error', async () => {
      component.currentUser = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Management failed')));

      await component.manageSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error managing subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('User State Management', () => {
    it('should handle user state changes', (done) => {
      const newUser = createMockUser({ displayName: 'Updated User' });
      mockAuthService.user$ = of(newUser);

      component.user$.subscribe(user => {
        expect(user?.displayName).toBe('Updated User');
        done();
      });
    });

    it('should handle user logout', (done) => {
      mockAuthService.user$ = of(null);

      component.user$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      component.currentUser = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Network error')));

      await component.subscribe();

        expect(consoleSpy).toHaveBeenCalledWith('Error creating subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('should handle service unavailable errors', async () => {
      component.currentUser = mockUser;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStripeService.createPortalSession.mockReturnValue(throwError(() => new Error('Service unavailable')));

      await component.manageSubscription();

        expect(consoleSpy).toHaveBeenCalledWith('Error managing subscription:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete signup flow', async () => {
      // User starts unauthenticated
      component.currentUser = null;
      mockAuthService.user$ = of(null);

      // User signs in
      component.signIn();
      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();

      // User becomes authenticated
      mockAuthService.user$ = of(mockUser);
      component.currentUser = mockUser;

      // User subscribes
      const mockResponse = {
        success: true,
        url: 'https://billing.stripe.com/checkout_123',
        type: 'checkout' as const
      };
      mockStripeService.createPortalSession.mockReturnValue(of(mockResponse));

      await component.subscribe();

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith('test-user-123', 'test@example.com');
      expect(window.location.href).toBe('https://billing.stripe.com/checkout_123');
    });

    it('should handle subscription management flow', async () => {
      // User with existing subscription
      component.currentUser = mockUser;

      // User manages subscription
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
  });

  describe('Component State', () => {
    it('should maintain current user state', () => {
      component.currentUser = mockUser;
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should update current user from observable', (done) => {
      const newUser = { ...mockUser, displayName: 'New User' };
      mockAuthService.user$ = of(newUser);

      component.user$.subscribe(user => {
        expect(user).toEqual(newUser);
        done();
      });
    });
  });
});
