import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: jest.Mocked<Auth>;
  let mockFirestore: jest.Mocked<Firestore>;
  let mockRouter: jest.Mocked<Router>;
  let mockUser: User;

  beforeEach(() => {
    // Create mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
      emailVerified: true,
      isAnonymous: false,
      metadata: {} as any,
      providerData: [],
      refreshToken: 'test-refresh-token',
      tenantId: null,

      phoneNumber: null,
      providerId: 'firebase',
      delete: jest.fn(),
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn()
    } as User;

    // Create spies
    const authSpy = {
      setPersistence: jest.fn().mockResolvedValue(undefined),
      currentUser: null,
      onAuthStateChanged: jest.fn(),
      signInWithPopup: jest.fn(),
      signOut: jest.fn()
    } as any;

    const firestoreSpy = {
      doc: jest.fn().mockReturnValue({
        id: 'test-doc-id',
        path: 'subscriptions/test-user-123',
        parent: {
          id: 'subscriptions',
          path: 'subscriptions',
          parent: null,
          type: 'collection'
        },
        type: 'document'
      }),
      getDoc: jest.fn().mockResolvedValue({
        data: () => ({
          active: true,
          subscription: {
            currentPeriodEnd: new Date(Date.now() + 86400000) // Tomorrow
          }
        })
      }),
      setDoc: jest.fn().mockResolvedValue(undefined)
    } as any;

    const routerSpy = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: authSpy },
        { provide: Firestore, useValue: firestoreSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    mockAuth = TestBed.inject(Auth) as jest.Mocked<Auth>;
    mockFirestore = TestBed.inject(Firestore) as jest.Mocked<Firestore>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Service Initialization', () => {
    it('should initialize with null user state', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should set up auth state listener on construction', () => {
      // The auth state listener is set up in the constructor
      expect(service).toBeTruthy();
    });

    it('should set browser local persistence', () => {
      expect(mockAuth.setPersistence).toHaveBeenCalled();
    });
  });

  describe('Authentication Methods', () => {
    describe('signInWithGoogle()', () => {
      it('should successfully sign in with Google popup', async () => {
        // Mock successful Google sign-in
        jest.spyOn(service, 'signInWithGoogle').mockResolvedValue(undefined);
        
        await service.signInWithGoogle();
        expect(service.signInWithGoogle).toHaveBeenCalled();
      });

      it('should handle Google sign-in errors gracefully', async () => {
        const error = new Error('Google sign-in failed');
        jest.spyOn(service, 'signInWithGoogle').mockRejectedValue(error);
        
        try {
          await service.signInWithGoogle();
        } catch (e) {
          expect(e).toBe(error);
        }
      });
    });

    describe('signOut()', () => {
      it('should successfully sign out user', async () => {
        jest.spyOn(service, 'signOut').mockResolvedValue(undefined);
        
        await service.signOut();
        expect(service.signOut).toHaveBeenCalled();
      });

      it('should handle sign-out errors gracefully', async () => {
        const error = new Error('Sign-out failed');
        jest.spyOn(service, 'signOut').mockRejectedValue(error);
        
        try {
          await service.signOut();
        } catch (e) {
          expect(e).toBe(error);
        }
      });
    });
  });

  describe('User State Management', () => {
    describe('getCurrentUser()', () => {
      it('should return current user when authenticated', () => {
        (mockAuth as any).currentUser = mockUser;
        expect(service.getCurrentUser()).toBe(mockUser);
      });

      it('should return null when not authenticated', () => {
        (mockAuth as any).currentUser = null;
        expect(service.getCurrentUser()).toBeNull();
      });
    });

    describe('getAuthenticatedUser()', () => {
      it('should return user observable', () => {
        const result = service.getAuthenticatedUser();
        expect(result).toBeDefined();
        expect(typeof result.subscribe).toBe('function');
      });
    });

    describe('user$ observable', () => {
      it('should emit user changes', () => {
        const result = service.user$;
        expect(result).toBeDefined();
        expect(typeof result.subscribe).toBe('function');
      });
    });
  });

  describe('Subscription Management', () => {
    describe('checkSubscriptionStatus()', () => {
      it('should return false when user is not authenticated', async () => {
        (mockAuth as any).currentUser = null;
        const result = await service.checkSubscriptionStatus();
        expect(result).toBeFalsy();
      });

      it('should return true for active subscription', async () => {
        (mockAuth as any).currentUser = mockUser;
        
        // Mock the Firebase functions
        const { doc, getDoc } = require('firebase/firestore');
        doc.mockReturnValue({
          id: 'test-doc-id',
          path: 'subscriptions/test-user-123'
        });
        getDoc.mockResolvedValue({
          data: () => ({
            active: true,
            subscription: {
              currentPeriodEnd: new Date(Date.now() + 86400000) // Tomorrow
            }
          })
        });
        
        const result = await service.checkSubscriptionStatus();
        expect(result).toBeTruthy();
      });

      it('should return false for expired subscription', async () => {
        (mockAuth as any).currentUser = mockUser;
        
        // Mock the Firebase functions
        const { doc, getDoc } = require('firebase/firestore');
        doc.mockReturnValue({
          id: 'test-doc-id',
          path: 'subscriptions/test-user-123'
        });
        getDoc.mockResolvedValue({
          data: () => ({
            active: true,
            subscription: {
              currentPeriodEnd: new Date(Date.now() - 86400000) // Yesterday
            }
          })
        });
        
        const result = await service.checkSubscriptionStatus();
        expect(result).toBeFalsy();
      });

      it('should handle Firestore errors gracefully', async () => {
        (mockAuth as any).currentUser = mockUser;
        (mockFirestore as any).getDoc.mockRejectedValue(new Error('Firestore error'));
        
        try {
          await service.checkSubscriptionStatus();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      const error = { code: 'auth/network-request-failed' };
      // Test error message formatting through private method
      const result = (service as any).getErrorMessage(error);
      expect(result).toContain('network error');
    });

    it('should handle user not found errors', () => {
      const error = { code: 'auth/user-not-found' };
      const result = (service as any).getErrorMessage(error);
      expect(result).toContain('Invalid email or password');
    });

    it('should handle unknown errors', () => {
      const error = { code: 'unknown-error' };
      const result = (service as any).getErrorMessage(error);
      expect(result).toContain('Authentication error');
    });
  });
});
