import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceMock: any;
  let stripeServiceMock: any;
  let dialogMock: any;
  let routerMock: any;

  // Mock subscription data
  const mockSubscription: SubscriptionStatus = {
    active: true,
    subscription: {
      status: 'active',
      originalStartDate: '2023-01-01T00:00:00.000Z',
      currentPeriodEnd: '2023-12-31T00:00:00.000Z',
      willAutoRenew: true
    },
    usage: {
      pdfsGenerated: 10
    }
  };

  beforeEach(async () => {
    // Create mocks for services
    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      }),
      signOut: jest.fn()
    };

    stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of(mockSubscription)),
      createSubscription: jest.fn().mockReturnValue(of({ 
        success: true, 
        url: 'https://checkout.stripe.com/test' 
      })),
      createPortalSession: jest.fn().mockReturnValue(of({ 
        success: true, 
        url: 'https://billing.stripe.com/test' 
      }))
    };

    dialogMock = {
      open: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements and attributes
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subscription data on init', () => {
    component.ngOnInit();
    expect(stripeServiceMock.getSubscriptionStatus).toHaveBeenCalledWith('test-user-id');
    expect(component.subscription).toEqual(mockSubscription);
    expect(component.isLoading).toBe(false);
  });

  it('should process subscription dates correctly for active subscription', () => {
    component.ngOnInit();
    expect(component.renewalDate).toBeInstanceOf(Date);
    expect(component.expirationDate).toBeNull();
  });

  it('should process subscription dates correctly for canceled subscription', () => {
    const canceledSubscription = {
      ...mockSubscription,
      subscription: {
        ...mockSubscription.subscription,
        status: 'canceled'
      }
    };
    stripeServiceMock.getSubscriptionStatus.mockReturnValue(of(canceledSubscription));
    
    component.ngOnInit();
    expect(component.renewalDate).toBeNull();
    expect(component.expirationDate).toBeInstanceOf(Date);
  });

  it('should handle new subscription correctly', () => {
    const windowLocationSpy = jest.spyOn(window.location, 'href', 'set');
    
    component.handleNewSubscription();
    
    expect(stripeServiceMock.createSubscription).toHaveBeenCalledWith('test-user-id', 'test@example.com');
    expect(windowLocationSpy).toHaveBeenCalledWith('https://checkout.stripe.com/test');
  });

  it('should handle manage subscription correctly', () => {
    const windowLocationSpy = jest.spyOn(window.location, 'href', 'set');
    
    component.manageSubscription();
    
    expect(stripeServiceMock.createPortalSession).toHaveBeenCalledWith('test-user-id', 'test@example.com');
    expect(windowLocationSpy).toHaveBeenCalledWith('https://billing.stripe.com/test');
  });

  it('should handle error when creating subscription', () => {
    stripeServiceMock.createSubscription.mockReturnValue(throwError(() => new Error('Test error')));
    
    component.handleNewSubscription();
    
    expect(dialogMock.open).toHaveBeenCalled();
  });

  it('should handle error when managing subscription', () => {
    stripeServiceMock.createPortalSession.mockReturnValue(throwError(() => new Error('Test error')));
    
    component.manageSubscription();
    
    expect(dialogMock.open).toHaveBeenCalled();
  });

  it('should handle logout', () => {
    component.logout();
    expect(authServiceMock.signOut).toHaveBeenCalled();
  });

  it('should correctly identify subscription status types', () => {
    // Active subscription that will auto-renew
    expect(component.getSubscriptionStatusType({
      ...mockSubscription,
      subscription: { ...mockSubscription.subscription, willAutoRenew: true }
    })).toBe('active');
    
    // Active subscription that will not auto-renew
    expect(component.getSubscriptionStatusType({
      ...mockSubscription,
      subscription: { ...mockSubscription.subscription, willAutoRenew: false }
    })).toBe('expiring');
    
    // Canceled subscription
    expect(component.getSubscriptionStatusType({
      ...mockSubscription,
      subscription: { ...mockSubscription.subscription, status: 'canceled' }
    })).toBe('canceled');
    
    // No subscription
    expect(component.getSubscriptionStatusType({
      ...mockSubscription,
      subscription: { ...mockSubscription.subscription, status: null }
    })).toBe('none');
  });
});
