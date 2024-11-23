import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  Observable,
  map,
  of,
  throwError,
  firstValueFrom,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StripeSession } from 'src/app/types/user';
import { environment } from 'src/environments/environment';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  subscription?: SubscriptionStatus;
}

interface SubscriptionStatus {
  active: boolean;
  currentPeriodEnd: Date;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public authState = new BehaviorSubject<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  user$ = this.authState.pipe(map((state) => state.user));
  loading$ = this.authState.pipe(map((state) => state.loading));
  error$ = this.authState.pipe(map((state) => state.error));
  subscription$ = this.authState.pipe(map((state) => state.subscription));
  apiUrl = environment.url;
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private http: HttpClient
  ) {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Start listening to subscription changes
        this.listenToSubscription(user.uid);
      }

      this.authState.next({
        user,
        loading: false,
        error: null,
      });
    });
  }

  private listenToSubscription(userId: string) {
    const subscriptionRef = doc(this.firestore, `subscriptions/${userId}`);
    onSnapshot(subscriptionRef, (snapshot) => {
      const subscription = snapshot.data() as SubscriptionStatus | undefined;

      this.authState.next({
        ...this.authState.value,
        subscription,
      });
    });
  }

  async signIn(): Promise<User | null> {
    try {
      this.authState.next({
        ...this.authState.value,
        loading: true,
        error: null,
      });

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(this.auth, provider);

      // Create or update user document
      await setDoc(
        doc(this.firestore, `users/${result.user.uid}`),
        {
          email: result.user.email,
          lastLogin: new Date(),
          firebaseUid: result.user.uid,
        },
        { merge: true }
      );

      return result.user;
    } catch (error: any) {
      const errorMessage = this.getAuthErrorMessage(error.code);
      this.authState.next({
        ...this.authState.value,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  private getAuthErrorMessage(code: string): string {
    const errorMessages = {
      'auth/popup-closed-by-user':
        'Sign-in window was closed. Please try again.',
      'auth/popup-blocked':
        'Pop-up was blocked by browser. Please enable pop-ups and try again.',
    };
    return errorMessages[code] || 'Authentication failed';
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    const subscriptionDoc = await getDoc(
      doc(this.firestore, `subscriptions/${user.uid}`)
    );
    const subscription = subscriptionDoc.data() as SubscriptionStatus;

    return (
      subscription?.active &&
      new Date(subscription.currentPeriodEnd) > new Date()
    );
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      this.authState.next({
        user: null,
        loading: false,
        error: null,
        subscription: undefined,
      });
    } catch (error) {
      this.authState.next({
        ...this.authState.value,
        error: 'Error signing out',
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
  async initiateSubscription(email: string): Promise<{ success: boolean; checkoutUrl?: string }> {
    const user = await firstValueFrom(this.user$);
    if (!user) throw new Error('Must be logged in to subscribe');

    try {
      const response = await this.http
        .post<StripeSession>(`${this.apiUrl}/stripe/create-subscription`, {
          email,
          userId: user.uid,
        })
        .toPromise();

      if (!response?.checkoutUrl) throw new Error('No checkout URL received');

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

      // Return a promise that resolves when subscription is complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          try {
            // Check subscription status
            const status = await this.checkSubscriptionStatus();
            if (status) {
              clearInterval(checkInterval);
              if (popup) popup.close();
              resolve({ success: true });
            }
          } catch (error) {
            clearInterval(checkInterval);
            reject(error);
          }
        }, 1000);

        // Handle popup close
        const popupCheck = setInterval(() => {
          if (popup?.closed) {
            clearInterval(popupCheck);
            clearInterval(checkInterval);
            resolve({ success: false, checkoutUrl: response.checkoutUrl });
          }
        }, 500);
      });
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
}}
