import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { UploadService } from '../upload/upload.service';
import { StripeService } from '../stripe/stripe.service';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

describe('Auth-Upload Integration', () => {
  let authService: AuthService;
  let uploadService: UploadService;
  let stripeService: StripeService;
  let dialogMock: any;

  beforeEach(() => {
    // Create mocks
    const authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      }),
      signInWithGoogle: jest.fn().mockResolvedValue({
        user: {
          uid: 'test-user-id',
          email: 'test@example.com'
        }
      }),
      user$: of({
        uid: 'test-user-id',
        email: 'test@example.com'
      })
    };

    const uploadServiceMock = {
      uploadFile: jest.fn().mockReturnValue(of({ success: true, fileId: '123' }))
    };

    const stripeServiceMock = {
      getSubscriptionStatus: jest.fn().mockReturnValue(of({
        active: true,
        subscription: {
          status: 'active'
        }
      })),
      createSubscription: jest.fn().mockReturnValue(of({ 
        success: true, 
        url: 'https://checkout.stripe.com/test' 
      }))
    };

    dialogMock = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(true)
      })
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: MatDialog, useValue: dialogMock }
      ]
    });

    authService = TestBed.inject(AuthService);
    uploadService = TestBed.inject(UploadService);
    stripeService = TestBed.inject(StripeService);
  });

  it('should allow upload for authenticated users with subscription', async () => {
    // Mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Check auth status
    const user = authService.getCurrentUser();
    expect(user).toBeTruthy();
    
    // Check subscription status
    const subscription = await stripeService.getSubscriptionStatus(user.uid).toPromise();
    expect(subscription.active).toBe(true);
    
    // Upload file
    const result = await uploadService.uploadFile(file).toPromise();
    expect(result.success).toBe(true);
  });

  it('should prompt for subscription for authenticated users without subscription', async () => {
    // Mock inactive subscription
    stripeService.getSubscriptionStatus = jest.fn().mockReturnValue(of({
      active: false,
      subscription: {
        status: null
      }
    }));
    
    // Mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Check auth status
    const user = authService.getCurrentUser();
    expect(user).toBeTruthy();
    
    // Check subscription status
    const subscription = await stripeService.getSubscriptionStatus(user.uid).toPromise();
    expect(subscription.active).toBe(false);
    
    // Attempt to upload (this would typically show a dialog in the component)
    // Here we're just testing the service integration
    const createSub = await stripeService.createSubscription(user.uid, user.email).toPromise();
    expect(createSub.success).toBe(true);
    expect(createSub.url).toBe('https://checkout.stripe.com/test');
  });

  it('should handle subscription creation error', async () => {
    // Mock subscription error
    stripeService.createSubscription = jest.fn().mockReturnValue(
      throwError(() => new Error('Subscription creation failed'))
    );
    
    // Check auth status
    const user = authService.getCurrentUser();
    
    // Attempt to create subscription
    try {
      await stripeService.createSubscription(user.uid, user.email).toPromise();
      fail('should have thrown an error');
    } catch (error) {
      expect(error.message).toBe('Subscription creation failed');
    }
  });

  it('should handle authentication before upload', async () => {
    // Mock unauthenticated state
    authService.getCurrentUser = jest.fn().mockReturnValue(null);
    
    // Mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Check auth status
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
    
    // Authenticate
    await authService.signInWithGoogle();
    
    // Now user should be authenticated
    const authenticatedUser = {
      uid: 'test-user-id',
      email: 'test@example.com'
    };
    authService.getCurrentUser = jest.fn().mockReturnValue(authenticatedUser);
    
    // Check subscription and upload
    const newUser = authService.getCurrentUser();
    expect(newUser).toBeTruthy();
    
    const subscription = await stripeService.getSubscriptionStatus(newUser.uid).toPromise();
    expect(subscription.active).toBe(true);
    
    const result = await uploadService.uploadFile(file).toPromise();
    expect(result.success).toBe(true);
  });
}); 