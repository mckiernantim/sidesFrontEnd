import { Injectable, isDevMode } from '@angular/core';
import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  User, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  inMemoryPersistence,
  AuthError
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  deleteDoc
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { HttpClient } from '@angular/common/http';
import { StripeSession } from 'src/app/types/user';
import { getConfig } from 'src/environments/environment';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';

// Define the auth state interface
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Create a BehaviorSubject with the auth state
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    loading: true,
    error: null
  });
  
  // Expose the auth state as an Observable
  authState$: Observable<AuthState> = this.authStateSubject.asObservable();
  
  // Add user$ property that extracts just the user from authState
  user$ = this.authState$.pipe(map(state => state.user));
  
  // Get the correct environment configuration
  private config = getConfig(!isDevMode());
  apiUrl = this.config.url;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private http: HttpClient,
    private router: Router
  ) {
    console.log('AUTH_SERVICE_INIT', { currentUser: this.auth.currentUser?.uid });
    
   
    // Listen for auth state changes
    onAuthStateChanged(this.auth, 
      (user) => {
        console.log('AUTH_STATE_CHANGED', { 
          userId: user?.uid,
          isAnonymous: user?.isAnonymous,
          emailVerified: user?.emailVerified,
          timestamp: new Date().toISOString()
        });
        
        // Store auth state in localStorage for debugging
        if (user) {
          localStorage.setItem('auth_debug_user_id', user.uid);
          localStorage.setItem('auth_debug_timestamp', Date.now().toString());
        } else {
          localStorage.removeItem('auth_debug_user_id');
          localStorage.removeItem('auth_debug_timestamp');
        }
        
        // Update auth state with user
        this.authStateSubject.next({
          user,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error('AUTH_STATE_ERROR', error);
        // Handle auth state error
        this.authStateSubject.next({
          user: null,
          loading: false,
          error: this.getErrorMessage(error)
        });
      }
    );
    
  }
  
  // Alternative method to set persistence
  private async setAlternativePersistence(): Promise<void> {
    try {
      // Try using the compat version if available
      const auth = this.auth as any;
      if (auth.setPersistence) {
        await auth.setPersistence('local');
        console.log('AUTH_COMPAT_PERSISTENCE_SET');
      } else {
        console.warn('AUTH_NO_PERSISTENCE_AVAILABLE');
      }
    } catch (error) {
      console.error('AUTH_ALTERNATIVE_PERSISTENCE_FAILED', error);
    }
  }
  
  // Check if we have persisted auth that doesn't match current state
  private checkPersistedAuth(): void {
    try {
      const persistedUserId = localStorage.getItem('auth_debug_user_id');
      const currentUserId = this.auth.currentUser?.uid;
      
      console.log('AUTH_PERSISTENCE_CHECK', { 
        persistedUserId, 
        currentUserId,
        match: persistedUserId === currentUserId
      });
      
      // If we have a persisted user but no current user, there might be a sync issue
      if (persistedUserId && !currentUserId) {
        console.warn('AUTH_PERSISTENCE_MISMATCH', 'Persisted user exists but no current user');
        
        // Instead of using onAuthStateChanged which might cause another error,
        // just log the issue and let the normal auth flow handle it
        console.log('AUTH_WAITING_FOR_STATE_CHANGE');
      }
    } catch (error) {
      console.error('AUTH_PERSISTENCE_CHECK_ERROR', error);
    }
  }
  
  // Simple, focused Google sign-in with popup only
  async signInWithGoogle(): Promise<void> {
    try {
      // Update loading state
      this.authStateSubject.next({
        ...this.authStateSubject.value,
        loading: true,
        error: null
      });
      
      // Create Google provider with minimal configuration
      const provider = new GoogleAuthProvider();
      
      // Attempt sign in with popup
      const userCredential = await signInWithPopup(this.auth, provider);
      
      // If successful, update user data
      if (userCredential.user) {
        await this.updateUserData(userCredential.user);
        
        // Update auth state with user
        this.authStateSubject.next({
          user: userCredential.user,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Update auth state with error
      this.authStateSubject.next({
        ...this.authStateSubject.value,
        loading: false,
        error: this.getErrorMessage(error)
      });
    }
  }
  
  // Update user data in Firestore
  private async updateUserData(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date()
    };
    
    await setDoc(userRef, userData, { merge: true });
  }
  
  // Sign out
  async signOut(): Promise<void> {
    try {
      // Set loading state
      this.authStateSubject.next({
        ...this.authStateSubject.value,
        loading: true
      });
      
      await signOut(this.auth);
      
      // Update auth state
      this.authStateSubject.next({
        user: null,
        loading: false,
        error: null
      });
      
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Sign out error:', error);
      // Update auth state with error
      this.authStateSubject.next({
        ...this.authStateSubject.value,
        loading: false,
        error: this.getErrorMessage(error)
      });
    }
  }
  
  // Helper method to get error message
  private getErrorMessage(error: any): string {
    const errorCode = error.code || '';
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Invalid password';
      case 'auth/invalid-email':
        return 'Invalid email';
      case 'auth/user-disabled':
        return 'User account has been disabled';
      case 'auth/popup-closed-by-user':
        return 'Authentication popup was closed';
      case 'auth/popup-blocked':
        return 'Authentication popup was blocked';
      case 'auth/cancelled-popup-request':
        return 'Authentication request was cancelled';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed';
      default:
        return error.message || 'An unknown error occurred';
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  private listenToSubscription(userId: string) {
    const subscriptionRef = doc(this.firestore, `subscriptions/${userId}`);
    
    onSnapshot(subscriptionRef, (snapshot) => {
      const subscription = snapshot.data() as SubscriptionStatus | undefined;

      this.authStateSubject.next({
        ...this.authStateSubject.value,
        user: this.auth.currentUser
      });
    });
  }

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

  async deleteAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user found');

    try {
      // Delete user data collections
      await deleteDoc(doc(this.firestore, `users/${user.uid}`));
      await deleteDoc(doc(this.firestore, `subscriptions/${user.uid}`));
      
      // Finally delete the auth user
      await user.delete();
      
      // Clear local auth state
      this.authStateSubject.next({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async initiateSubscription(email: string): Promise<{ success: boolean; checkoutUrl?: string }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Must be logged in to subscribe');

    try {
      const response = await this.http
        .post<StripeSession>(`${this.apiUrl}/stripe/create-subscription`, {
          email,
          userId: user.uid,
        })
        .toPromise();

      if (!response?.checkoutUrl) throw new Error('No checkout URL received');

      // Instead of using a popup which can cause COOP errors, redirect to Stripe
      window.location.href = response.checkoutUrl;
      
      // Return a placeholder - the actual flow will continue after redirect back
      return { success: true, checkoutUrl: response.checkoutUrl };
      
      /* Removing popup approach to avoid COOP errors
      // Open Stripe checkout in popup
      const popupWidth = 500;
      const popupHeight = 700;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;

      const popup = window.open(
        response.checkoutUrl,
        'StripeCheckout',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
      );
      */
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  // Add a method to ensure user is loaded
  ensureUserLoaded(): Observable<User | null> {
    return this.user$.pipe(
      take(1),
      switchMap(user => {
        if (user !== undefined) {
          // User state is already determined
          return of(user);
        } else {
          // Wait for auth state to be determined
          return this.user$.pipe(
            filter(u => u !== undefined),
            take(1)
          );
        }
      })
    );
  }
}