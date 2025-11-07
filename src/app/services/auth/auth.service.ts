import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  browserLocalPersistence
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Simple auth state
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSubject.asObservable();
  
  // Track if we're in the middle of an auth redirect
  private isRedirecting = false;
  
  // Track if auth state has been initialized
  private authInitialized = false;
  
  // Track admin whitelist status for maintenance mode bypass
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    console.log('AuthService constructor called');
    
    // Set up auth state listener immediately
    this.setupAuthStateListener();
    
    // Set persistence to local (survives page reloads)
    // FIXED: Using the method on the auth instance instead of a standalone function
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
  
  // Set up auth state listener
  private setupAuthStateListener(): void {
    // Listen for auth state changes
    onAuthStateChanged(this.auth, 
      async (user) => {
        debugger
        console.log('Auth state changed:', user?.uid || 'No user');
        this.userSubject.next(user);
        this.authInitialized = true;
        
        // Check admin whitelist status when user signs in
        if (user) {
          await this.checkAdminWhitelist(user);
          // Update user data in Firestore
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

  // Handle redirect result
  async handleRedirectResult(): Promise<void> {
    // This is now a no-op since we're using popup
    return Promise.resolve();
  }

  // Add a method to update user data in Firestore
  private async updateUserData(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date()
    };
    
    try {
      await setDoc(userRef, userData, { merge: true });
      console.log('User data updated in Firestore');
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  // Sign in with Google using popup
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

  // Simple sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      // User is automatically updated via onAuthStateChanged
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  // Helper to get current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
  
  // Wait for auth to be initialized and get user
  getAuthenticatedUser(): Observable<User | null> {
    // If auth is already initialized, just return the current user
    if (this.authInitialized) {
      return this.user$;
    }
    
    // Otherwise, wait for auth to be initialized
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
      
      // Return cleanup function
      return unsubscribe;
    });
  }
  
  // Check if user is in admin whitelist (for maintenance mode bypass)
  private async checkAdminWhitelist(user: User): Promise<void> {
    try {
      if (!user.email) {
        this.isAdminSubject.next(false);
        return;
      }
  
      // Encode email to make it a valid Firestore document ID
      const encodedEmail = user.email.replace(/\./g, '_dot_').replace(/@/g, '_at_');
      debugger
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

  // Check subscription status
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
  
  // Helper method to format error messages
  private getErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'auth/account-exists-with-different-credential':
          return 'An account already exists with the same email address but different sign-in credentials.';
        case 'auth/user-disabled':
          return 'This account has been disabled.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Invalid email or password.';
        case 'auth/network-request-failed':
          return 'A network error occurred. Please check your connection.';
        default:
          return `Authentication error: ${error.message || error}`;
      }
    }
    return error.message || 'An unknown error occurred';
  }
}