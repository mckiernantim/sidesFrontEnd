import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  browserPopupRedirectResolver,
  onAuthStateChanged
} from '@angular/fire/auth';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public authState = new BehaviorSubject<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Derive all streams from the authState BehaviorSubject
  user$: Observable<User | null> = this.authState.pipe(
    map(state => state.user)
  );
  
  loading$: Observable<boolean> = this.authState.pipe(
    map(state => state.loading)
  );
  
  error$: Observable<string | null> = this.authState.pipe(
    map(state => state.error)
  );

  constructor(private auth: Auth) {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (user) => {
      this.authState.next({
        user,
        loading: false,
        error: null
      });
    });
  }

  async signIn(): Promise<User | null> {
    console.log("signing in")
    try {
      this.authState.next({
        ...this.authState.value,
        loading: true,
        error: null
      });

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(
        this.auth, 
        provider,
      );

      this.authState.next({
        user: result.user,
        loading: false,
        error: null
      });

      return result.user;

    } catch (error: any) {
      let errorMessage = 'Authentication failed';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in window was closed. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked by browser. Please enable pop-ups and try again.';
      }

      this.authState.next({
        ...this.authState.value,
        loading: false,
        error: errorMessage
      });

      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      this.authState.next({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      this.authState.next({
        ...this.authState.value,
        error: 'Error signing out'
      });
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}