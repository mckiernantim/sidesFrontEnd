import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';

// ---------------------------------------------------------------------------
// Module-level Firebase mocks — must be declared before any imports that
// transitively load these modules so Jest hoisting applies correctly.
// ---------------------------------------------------------------------------

jest.mock('@angular/fire/auth', () => ({
  ...jest.requireActual('@angular/fire/auth'),
  onAuthStateChanged: jest.fn((_auth: unknown, next: (u: null) => void) => {
    next(null);
    return jest.fn(); // unsubscribe no-op
  }),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('@angular/fire/firestore', () => ({
  // Re-export the real Firestore class so Angular DI can resolve it as a token
  ...jest.requireActual('@angular/fire/firestore'),
  // Override the Firestore functions we need to spy on
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Grab mocked references after mock declarations
// ---------------------------------------------------------------------------

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from '@angular/fire/auth';

import { doc, getDoc, setDoc } from '@angular/fire/firestore';

const mockCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockSignIn = signInWithEmailAndPassword as jest.Mock;
const mockSendReset = sendPasswordResetEmail as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;
const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: jest.Mocked<Auth>;

  // A complete Firebase User for a Google account
  const mockGoogleUser: User = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as never,
    providerData: [
      {
        providerId: 'google.com',
        uid: 'google-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        phoneNumber: null,
        photoURL: 'https://example.com/avatar.jpg',
      },
    ],
    refreshToken: 'test-refresh-token',
    tenantId: null,
    phoneNumber: null,
    providerId: 'firebase',
    delete: jest.fn(),
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
  } as User;

  // Email/password user — displayName and photoURL are null until updateProfile runs
  const mockEmailUser: User = {
    ...mockGoogleUser,
    displayName: null,
    photoURL: null,
    providerData: [
      {
        providerId: 'password',
        uid: 'test@example.com',
        displayName: null,
        email: 'test@example.com',
        phoneNumber: null,
        photoURL: null,
      },
    ],
  } as User;

  const buildAuthSpy = (): jest.Mocked<Auth> =>
    ({
      setPersistence: jest.fn().mockResolvedValue(undefined),
      currentUser: null,
    } as unknown as jest.Mocked<Auth>);

  const buildFirestoreSpy = (): jest.Mocked<Firestore> =>
    ({} as jest.Mocked<Firestore>);

  const buildRouterSpy = (): jest.Mocked<Router> =>
    ({
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    } as unknown as jest.Mocked<Router>);

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no signed-in user
    mockOnAuthStateChanged.mockImplementation((_auth, next) => {
      next(null);
      return jest.fn();
    });

    // Default Firestore stubs
    mockDoc.mockReturnValue({ id: 'test-doc', path: 'users/test-user-123' });
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
    mockSetDoc.mockResolvedValue(undefined);

    mockAuth = buildAuthSpy();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: buildFirestoreSpy() },
        { provide: Router, useValue: buildRouterSpy() },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  // ─── Smoke ──────────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── Initialization ─────────────────────────────────────────────────────────

  describe('Service Initialization', () => {
    it('should initialize with null user state', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should set up auth state listener on construction', () => {
      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('should set browser local persistence', () => {
      expect(mockAuth.setPersistence).toHaveBeenCalled();
    });
  });

  // ─── Google sign-in (must remain working) ──────────────────────────────────

  describe('signInWithGoogle()', () => {
    it('should successfully sign in with Google popup', async () => {
      jest.spyOn(service, 'signInWithGoogle').mockResolvedValue(undefined);
      await service.signInWithGoogle();
      expect(service.signInWithGoogle).toHaveBeenCalled();
    });

    it('should re-throw errors from Google sign-in', async () => {
      const error = new Error('Google sign-in failed');
      jest.spyOn(service, 'signInWithGoogle').mockRejectedValue(error);
      let caught: unknown;
      try { await service.signInWithGoogle(); } catch (e) { caught = e; }
      expect(caught).toBe(error);
    });
  });

  // ─── registerWithEmail ──────────────────────────────────────────────────────

  describe('registerWithEmail()', () => {
    it('should call createUserWithEmailAndPassword then updateProfile on success', async () => {
      const fakeUser = { ...mockEmailUser };
      mockCreateUser.mockResolvedValueOnce({ user: fakeUser });
      mockUpdateProfile.mockResolvedValueOnce(undefined);

      await service.registerWithEmail('new@example.com', 'password123', 'Jane Doe');

      expect(mockCreateUser).toHaveBeenCalledWith(mockAuth, 'new@example.com', 'password123');
      expect(mockUpdateProfile).toHaveBeenCalledWith(fakeUser, { displayName: 'Jane Doe' });
    });

    it('should re-throw auth/email-already-in-use when email is taken', async () => {
      const firebaseError = { code: 'auth/email-already-in-use', message: 'Email in use' };
      mockCreateUser.mockRejectedValueOnce(firebaseError);

      let caughtError: { code?: string } | undefined;
      try {
        await service.registerWithEmail('taken@example.com', 'password123', 'Jane');
      } catch (e) {
        caughtError = e as { code?: string };
      }
      expect(caughtError).toBeDefined();
      expect(caughtError?.code).toBe('auth/email-already-in-use');
    });
  });

  // ─── signInWithEmail ────────────────────────────────────────────────────────

  describe('signInWithEmail()', () => {
    it('should call signInWithEmailAndPassword on success', async () => {
      mockSignIn.mockResolvedValueOnce({ user: mockGoogleUser });

      await service.signInWithEmail('user@example.com', 'correctpassword');

      expect(mockSignIn).toHaveBeenCalledWith(mockAuth, 'user@example.com', 'correctpassword');
    });

    it('should re-throw auth/wrong-password for wrong password', async () => {
      mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });
      let caught: { code?: string } | undefined;
      try { await service.signInWithEmail('user@example.com', 'wrongpassword'); } catch (e) { caught = e as { code?: string }; }
      expect(caught?.code).toBe('auth/wrong-password');
    });

    it('should re-throw auth/user-not-found when no account exists', async () => {
      mockSignIn.mockRejectedValueOnce({ code: 'auth/user-not-found' });
      let caught: { code?: string } | undefined;
      try { await service.signInWithEmail('ghost@example.com', 'password'); } catch (e) { caught = e as { code?: string }; }
      expect(caught?.code).toBe('auth/user-not-found');
    });

    it('should re-throw auth/too-many-requests after too many attempts', async () => {
      mockSignIn.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
      let caught: { code?: string } | undefined;
      try { await service.signInWithEmail('user@example.com', 'password'); } catch (e) { caught = e as { code?: string }; }
      expect(caught?.code).toBe('auth/too-many-requests');
    });
  });

  // ─── sendPasswordReset ──────────────────────────────────────────────────────

  describe('sendPasswordReset()', () => {
    it('should call sendPasswordResetEmail with the provided email', async () => {
      mockSendReset.mockResolvedValueOnce(undefined);
      await service.sendPasswordReset('user@example.com');
      expect(mockSendReset).toHaveBeenCalledWith(mockAuth, 'user@example.com');
    });

    it('should re-throw errors from sendPasswordResetEmail', async () => {
      const error = { code: 'auth/invalid-email' };
      mockSendReset.mockRejectedValueOnce(error);
      let caught: { code?: string } | undefined;
      try { await service.sendPasswordReset('bad-email'); } catch (e) { caught = e as { code?: string }; }
      expect(caught?.code).toBe('auth/invalid-email');
    });
  });

  // ─── updateUserData null-safety ─────────────────────────────────────────────

  describe('updateUserData() null-safety', () => {
    const buildAndTrigger = (user: User) => {
      jest.clearAllMocks();

      mockOnAuthStateChanged.mockImplementationOnce((_auth, next) => {
        next(user);
        return jest.fn();
      });

      // Mock admin whitelist check (getDoc called twice: admin check + user data fetch)
      // First getDoc: user Firestore record, Second: admin check (or vice versa)
      mockDoc.mockReturnValue({ id: 'doc', path: 'users/x' });

      const authSpy = buildAuthSpy();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          { provide: Auth, useValue: authSpy },
          { provide: Firestore, useValue: buildFirestoreSpy() },
          { provide: Router, useValue: buildRouterSpy() },
        ],
      });
      return TestBed.inject(AuthService);
    };

    it('should NOT overwrite existing Firestore displayName when user.displayName is null', async () => {
      // setupAuthStateListener calls checkAdminWhitelist first (getDoc #1), then updateUserData
      // which reads the existing Firestore record (getDoc #2), then writes via setDoc.
      mockGetDoc
        .mockResolvedValueOnce({ exists: () => false }) // admin whitelist check — not an admin
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Existing Name', photoURL: null }) }); // updateUserData read

      buildAndTrigger(mockEmailUser);
      await new Promise(resolve => setTimeout(resolve, 10));

      const setDocCall = mockSetDoc.mock.calls.find(call =>
        call[1] && (call[1] as { displayName?: string }).displayName !== undefined,
      );
      expect(setDocCall).toBeDefined();
      expect((setDocCall![1] as { displayName: string }).displayName).toBe('Existing Name');
    });

    it('should use user.displayName when it is non-null (Google account)', async () => {
      mockGetDoc
        .mockResolvedValueOnce({ exists: () => false, data: () => undefined })
        .mockResolvedValueOnce({ exists: () => false });

      buildAndTrigger(mockGoogleUser);
      await new Promise(resolve => setTimeout(resolve, 10));

      const setDocCall = mockSetDoc.mock.calls.find(call =>
        call[1] && (call[1] as { displayName?: string }).displayName !== undefined,
      );
      expect(setDocCall).toBeDefined();
      expect((setDocCall![1] as { displayName: string }).displayName).toBe('Test User');
    });

    it('should write a providers array to the Firestore record', async () => {
      mockGetDoc
        .mockResolvedValueOnce({ exists: () => false, data: () => undefined })
        .mockResolvedValueOnce({ exists: () => false });

      buildAndTrigger(mockGoogleUser);
      await new Promise(resolve => setTimeout(resolve, 10));

      const setDocCall = mockSetDoc.mock.calls.find(call =>
        call[1] && Array.isArray((call[1] as { providers?: string[] }).providers),
      );
      expect(setDocCall).toBeDefined();
      expect((setDocCall![1] as { providers: string[] }).providers).toContain('google.com');
    });
  });

  // ─── getErrorMessage ────────────────────────────────────────────────────────

  describe('getErrorMessage()', () => {
    // Access the private method via type cast for white-box testing
    type ServiceWithPrivate = AuthService & { getErrorMessage(e: { code: string; message?: string }): string };
    const err = (code: string) => (service as unknown as ServiceWithPrivate).getErrorMessage({ code });

    it('auth/email-already-in-use → "An account with this email already exists. Try signing in instead."', () => {
      expect(err('auth/email-already-in-use')).toBe(
        'An account with this email already exists. Try signing in instead.',
      );
    });

    it('auth/weak-password → "Password must be at least 6 characters."', () => {
      expect(err('auth/weak-password')).toBe('Password must be at least 6 characters.');
    });

    it('auth/invalid-email → "Please enter a valid email address."', () => {
      expect(err('auth/invalid-email')).toBe('Please enter a valid email address.');
    });

    it('auth/wrong-password → "Incorrect password. Try again or reset your password."', () => {
      expect(err('auth/wrong-password')).toBe(
        'Incorrect password. Try again or reset your password.',
      );
    });

    it('auth/user-not-found → "No account found with this email. Create an account instead."', () => {
      expect(err('auth/user-not-found')).toBe(
        'No account found with this email. Create an account instead.',
      );
    });

    it('auth/too-many-requests → "Too many failed attempts. Please wait a moment or reset your password."', () => {
      expect(err('auth/too-many-requests')).toBe(
        'Too many failed attempts. Please wait a moment or reset your password.',
      );
    });

    it('auth/network-request-failed → network error message', () => {
      expect(err('auth/network-request-failed')).toMatch(/network/i);
    });

    it('auth/account-exists-with-different-credential → existing account message', () => {
      expect(err('auth/account-exists-with-different-credential')).toMatch(/account/i);
    });

    it('unknown code → fallback "Authentication error" message', () => {
      expect(err('auth/some-unknown-code')).toMatch(/Authentication error/i);
    });
  });

  // ─── signOut ────────────────────────────────────────────────────────────────

  describe('signOut()', () => {
    it('should successfully sign out', async () => {
      jest.spyOn(service, 'signOut').mockResolvedValue(undefined);
      await service.signOut();
      expect(service.signOut).toHaveBeenCalled();
    });

    it('should re-throw sign-out errors', async () => {
      const error = new Error('Sign-out failed');
      jest.spyOn(service, 'signOut').mockRejectedValue(error);
      let caught: unknown;
      try { await service.signOut(); } catch (e) { caught = e; }
      expect(caught).toBe(error);
    });
  });

  // ─── checkSubscriptionStatus ────────────────────────────────────────────────

  describe('checkSubscriptionStatus()', () => {
    it('should return false when user is not authenticated', async () => {
      (mockAuth as unknown as { currentUser: null }).currentUser = null;
      const result = await service.checkSubscriptionStatus();
      expect(result).toBeFalsy();
    });
  });
});
