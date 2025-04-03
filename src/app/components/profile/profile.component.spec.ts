import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth/auth.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { User } from '@angular/fire/auth';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceMock: jest.Mocked<Partial<AuthService>>;
  let stripeServiceMock: jest.Mocked<Partial<StripeService>>;
  let dialogMock: jest.Mocked<Partial<MatDialog>>;
  let userSubject: BehaviorSubject<User | null>;

  beforeEach(async () => {
    // Create a subject to simulate auth state changes
    userSubject = new BehaviorSubject<User | null>(null);

    // Mock services with proper Jest typing
    authServiceMock = {
      user$: userSubject.asObservable(),
      signOut: jest.fn().mockResolvedValue(undefined),
      getCurrentUser: jest.fn().mockImplementation(() => userSubject.getValue())
    };

    stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of({
        active: true,
        subscription: {
          status: 'active',
          originalStartDate: '2023-01-01T00:00:00.000Z',
          currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          willAutoRenew: true
        }
      })),
      createPortalSession: jest.fn().mockReturnValue(of({
        success: true,
        url: 'https://billing.stripe.com/test-portal'
      }))
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(true))
      })
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: MatDialog, useValue: dialogMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  test('should create the component', () => {
    expect(component).not.toBeNull();
  });

  describe('when user is authenticated', () => {
    let mockUser: User;
    
    beforeEach(() => {
      // Create a mock user
      mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: jest.fn(),
        getIdToken: jest.fn(),
        getIdTokenResult: jest.fn(),
        reload: jest.fn(),
        toJSON: jest.fn()
      } as unknown as User;
      
      userSubject.next(mockUser);
      fixture.detectChanges();
    });
    
    test('should load user profile data', () => {
      // Verify user data is set in component
      expect(component.user).toBe(mockUser);
      
      // Verify subscription status was requested
      expect(stripeServiceMock.getSubscriptionStatus).toHaveBeenCalledWith('test-user-id');
    });
    
    test('should display subscription status correctly', () => {
      // Verify subscription data is set in component
      expect(component.subscription?.active).toBe(true);
      expect(component.subscription?.subscription?.status).toBe('active');
      expect(component.subscription?.subscription?.originalStartDate).toBe('2023-01-01T00:00:00.000Z');
      expect(component.subscription?.subscription?.willAutoRenew).toBe(true);
      
      // Check the currentPeriodEnd separately since it's dynamic
      expect(typeof component.subscription?.subscription?.currentPeriodEnd).toBe('string');
    });
    
    test('should open Stripe portal when managing subscription', () => {
      // Mock window.location.href
      const locationSpy = jest.spyOn(window, 'location', 'get').mockImplementation(() => ({
        ...window.location,
        href: ''
      } as Location));
      
      // Call manageSubscription method
      component.manageSubscription();
      
      // Verify portal session was created
      expect(stripeServiceMock.createPortalSession).toHaveBeenCalledWith(
        'test-user-id',
        'test@example.com'
      );
      
      // Restore window.location
      locationSpy.mockRestore();
    });
    
    test('should call auth service signOut when logging out', () => {
      // Call logout method
      component.logout();
      
      // Verify auth service was called
      expect(authServiceMock.signOut).toHaveBeenCalled();
    });
  });
  
  describe('when user is not authenticated', () => {
    beforeEach(() => {
      userSubject.next(null);
      fixture.detectChanges();
    });
    
    test('should not load subscription data', () => {
      expect(component.isLoading).toBe(false);
      expect(stripeServiceMock.getSubscriptionStatus).not.toHaveBeenCalled();
    });
  });
});
