import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { isUploadAllowed } from '../../../environments/upload-allowlist';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Auth state
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();

  // Track if we're in the middle of an auth redirect
  private isRedirecting = false;

  // Track if auth state has been initialized
  private authInitialized = false;

  // Track admin whitelist status for maintenance mode bypass
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  /**
   * True when the user may upload. Driven by UPLOAD_ALLOWLIST at build time
   * (see environment.uploadAllowlist). Empty allowlist = open to everyone.
   */
  canUpload(user: User | null | undefined): boolean {
    return isUploadAllowed(user?.email, environment.uploadAllowlist || []);
  }

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    console.log('AuthService constructor called');

    // Set up auth state listener immediately
    this.setupAuthStateListener();

    // Set persistence to local (survives page reloads)
    try {
      this.auth.setPersistence(browserLocalPersistence)
        .then(() => {
          console.log('Auth persistence set to local');
        })
        .catch(error => console.error('Error setting auth persistence:', error));
    } catch (error) {
      console.error('Error setting up auth persistence:', error);
    }

    // Check for redirect result on service initialization
    this.handleRedirectResult();
  }

  // ─── Auth state listener ────────────────────────────────────────────────────

  private setupAuthStateListener(): void {
    onAuthStateChanged(
      this.auth,
      async (user) => {
        console.log('Auth state changed:', user?.uid || 'No user');
        this.userSubject.next(user);
        this.authInitialized = true;

        if (user) {
          await this.checkAdminWhitelist(user);
          this.updateUserData(user);
        } else {
          this.isAdminSubject.next(false);
        }
      },
      (error) => {
        console.error('Auth state error:', error);
        this.authInitialized = true;
      }
    );
  }

  // Handle redirect result (no-op — we use popups)
  async handleRedirectResult(): Promise<void> {
    return Promise.resolve();
  }

  // ─── Firestore user record ──────────────────────────────────────────────────

  /**
   * Write the user's data to Firestore.
   *
   * For email/password accounts, `user.displayName` and `user.photoURL` are
   * null until `updateProfile` is called.  We read the existing Firestore
   * document first and fall back to whatever is already stored so we never
   * overwrite a display name with null.
   */
  private async updateUserData(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);

    // Read existing record to preserve fields that may be null on the Firebase User
    let existingDisplayName: string | null = null;
    let existingPhotoURL: string | null = null;
    try {
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const existing = snapshot.data() as { displayName?: string | null; photoURL?: string | null };
        existingDisplayName = existing.displayName ?? null;
        existingPhotoURL = existing.photoURL ?? null;
      }
    } catch (readError) {
      console.error('Error reading existing user data:', readError);
    }

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? existingDisplayName,
      photoURL: user.photoURL ?? existingPhotoURL,
      lastLogin: new Date(),
      providers: user.providerData.map(p => p.providerId),
    };

    try {
      await setDoc(userRef, userData, { merge: true });
      console.log('User data updated in Firestore');
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  // ─── Google sign-in ─────────────────────────────────────────────────────────

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      // User is automatically updated via onAuthStateChanged
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  // ─── Email/Password sign-in ─────────────────────────────────────────────────

  /**
   * Register a new account with email and password, then immediately set the
   * display name via updateProfile so the Firestore record reflects the name
   * the user entered during registration.
   */
  async registerWithEmail(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName });
    // onAuthStateChanged fires automatically after createUserWithEmailAndPassword;
    // updateUserData will pick up the display name from the updated profile.
  }

  /**
   * Sign in with an existing email/password account.
   * Throws the raw Firebase error so the caller can map it via getErrorMessage.
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
    // User is automatically updated via onAuthStateChanged
  }

  /**
   * Send a password-reset email.
   * Always called with the user-supplied address — Firebase handles the rest.
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  // ─── Sign out ───────────────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      // User is automatically updated via onAuthStateChanged
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // ─── User helpers ───────────────────────────────────────────────────────────

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getAuthenticatedUser(): Observable<User | null> {
    if (this.authInitialized) {
      return this.user$;
    }

    return new Observable<User | null>(observer => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        user => {
          observer.next(user);
          observer.complete();
        },
        error => {
          observer.error(error);
        }
      );
      return unsubscribe;
    });
  }

  // ─── Admin whitelist ────────────────────────────────────────────────────────

  private async checkAdminWhitelist(user: User): Promise<void> {
    try {
      if (!user.email) {
        this.isAdminSubject.next(false);
        return;
      }

      const encodedEmail = user.email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
      const adminDocRef = doc(this.firestore, `listed/${encodedEmail}`);
      const adminSnapshot = await getDoc(adminDocRef);

      const isAdmin = adminSnapshot.exists();
      console.log(`Admin whitelist check for ${user.email}:`, isAdmin);
      this.isAdminSubject.next(isAdmin);
    } catch (error) {
      console.error('Error checking admin whitelist:', error);
      this.isAdminSubject.next(false);
    }
  }

  // ─── Subscription ───────────────────────────────────────────────────────────

  async checkSubscriptionStatus(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;

    const subscriptionDocRef = doc(this.firestore, `subscriptions/${user.uid}`);
    const subscriptionSnapshot = await getDoc(subscriptionDocRef);
    const response = subscriptionSnapshot.data() as SubscriptionStatus;

    return (
      response?.active &&
      new Date(response.subscription.currentPeriodEnd) > new Date()
    );
  }

  // ─── Error message helper ───────────────────────────────────────────────────

  /**
   * Maps Firebase Auth error codes to user-facing strings.
   * Called by UI components that catch errors from auth methods.
   */
  getErrorMessage(error: { code?: string; message?: string }): string {
    if (error.code) {
      switch (error.code) {
        // ── Existing codes ──────────────────────────────────────────────────
        case 'auth/account-exists-with-different-credential':
          return 'An account already exists with the same email address but different sign-in credentials.';
        case 'auth/user-disabled':
          return 'This account has been disabled.';
        case 'auth/network-request-failed':
          return 'A network error occurred. Please check your connection.';
        case 'auth/popup-blocked':
          return 'Sign-in popup was blocked. Please allow popups for this site.';
        case 'auth/popup-closed-by-user':
          return 'Sign-in was cancelled.';

        // ── Email/password codes ────────────────────────────────────────────
        case 'auth/email-already-in-use':
          return 'An account with this email already exists. Try signing in instead.';
        case 'auth/weak-password':
          return 'Password must be at least 6 characters.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/wrong-password':
          return 'Incorrect password. Try again or reset your password.';
        case 'auth/user-not-found':
          return 'No account found with this email. Create an account instead.';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please wait a moment or reset your password.';

        default:
          return `Authentication error: ${error.message || error}`;
      }
    }
    return error.message || 'An unknown error occurred';
  }
}
