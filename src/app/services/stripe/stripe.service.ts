import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, switchMap, tap, shareReplay, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, FirestoreSubscription, SubscriptionResponse } from 'src/app/types/SubscriptionTypes';

export interface ApiError {
  error: string;
  reason?: string;
  status: number;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe(environment.stripe);
  public API_URL: string = environment.url;
  
  // Cache for subscription status with initial loading state
  private subscriptionStatusSubject = new BehaviorSubject<SubscriptionStatus | null>(null);
  public subscriptionStatus$ = this.subscriptionStatusSubject.asObservable();
  
  // Track if we've attempted to load subscription data
  private hasAttemptedLoad = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {
    console.log('StripeService initialized');
    
    // Initialize subscription status when user authenticates
    this.auth.user$.pipe(
      tap(user => {
        console.log('Auth user changed:', user?.uid);
        if (!user && this.hasAttemptedLoad) {
          console.log('User logged out, clearing subscription status');
          this.subscriptionStatusSubject.next(null);
        }
      }),
      switchMap(user => {
        if (!user) {
          return of(null);
        }
        
        console.log('Fetching subscription for user:', user.uid);
        this.hasAttemptedLoad = true;
        return this.fetchSubscriptionStatus(user.uid);
      })
    ).subscribe({
      next: result => console.log('Subscription init result:', result),
      error: err => console.error('Error in subscription init:', err)
    });
  }

  // Private method to fetch subscription status
  private fetchSubscriptionStatus(userId: string): Observable<SubscriptionStatus | null> {
    console.log('Fetching subscription status for:', userId);
    
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.get<any>(
          `${this.API_URL}/stripe/subscription-status/${userId}`,
          { headers, withCredentials: true }
        ).pipe(
          tap(response => {
            console.log('Raw subscription response:', response);
            
            // Handle empty or invalid response
            if (!response || response === '' || typeof response !== 'object') {
              console.warn('Invalid subscription response, using default');
              const emptyStatus: SubscriptionStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return;
            }
            
            // Transform and store valid response
            const status = this.normalizeSubscriptionResponse(response);
            console.log('Normalized subscription status:', status);
            this.subscriptionStatusSubject.next(status);
          }),
          map(response => {
            if (!response || response === '' || typeof response !== 'object') {
              return this.createEmptyStatus();
            }
            return this.normalizeSubscriptionResponse(response);
          }),
          catchError(error => {
            console.error('Subscription status error:', error);
            
            if (error.status === 404) {
              const emptyStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return of(emptyStatus);
            }
            
            // For other errors, don't update the subject to avoid clearing valid data
            return this.handleError(error);
          }),
          finalize(() => {
            console.log('Subscription status request completed');
          })
        );
      })
    );
  }
  
  // Helper to create empty status object
  private createEmptyStatus(): SubscriptionStatus {
    return {
      active: false,
      subscription: {
        originalStartDate: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      },
      usage: { pdfsGenerated: 0 }
    };
  }
  
  // Helper to normalize API response
  private normalizeSubscriptionResponse(response: any): SubscriptionStatus {
    return {
      active: response.active || response.subscription?.status === 'active',
      subscription: {
        originalStartDate: response.subscription?.originalStartDate || null,
        currentPeriodEnd: response.subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: response.subscription?.cancelAtPeriodEnd || false
      },
      usage: {
        pdfsGenerated: response.usage?.pdfsGenerated || 0
      }
    };
  }

  // Public method to get subscription status (uses cache)
  getSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('getSubscriptionStatus called for:', userId);
    
    // Return cached value if available, otherwise fetch
    if (this.subscriptionStatusSubject.value) {
      console.log('Returning cached subscription status');
      return this.subscriptionStatus$ as Observable<SubscriptionStatus>;
    }
    
    console.log('No cached value, fetching subscription status');
    return this.fetchSubscriptionStatus(userId) as Observable<SubscriptionStatus>;
  }

  // Method to refresh subscription status
  refreshSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('Refreshing subscription status for:', userId);
    return this.fetchSubscriptionStatus(userId) as Observable<SubscriptionStatus>;
  }

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.auth.getIdToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createSubscription(userId: string, userEmail: string): Observable<SubscriptionResponse> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post<SubscriptionResponse>(
          `${this.API_URL}/stripe/create-portal-session`,
          { userId, userEmail },
          { 
            headers,
            withCredentials: true 
          }
        ).pipe(
          tap(() => this.refreshSubscriptionStatus(userId)),
          catchError(this.handleError)
        );
      })
    );
  }


  startCheckout(expirationTime: number, jwtToken: string, downloadTimeRemaining: number): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        const body = {
          test: true,
          expirationTime: expirationTime,
          jwtToken
        };

        return this.http.post(
          `${this.API_URL}/start-checkout`, 
          body, 
          {
            headers,
            withCredentials: true
          }
        );
      }),
      catchError(this.handleError)
    );
  }


  /**
   * Opens Stripe Customer Portal for subscription management
   */
  createPortalSession(userId: string, userEmail: string): Observable<{ url: string }> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post<{ url: string }>(
          `${this.API_URL}/stripe/create-portal-session`,
          { 
            userId,
            userEmail,
            returnUrl: `${window.location.origin}/profile`
          },
          { headers, withCredentials: true }
        );
      }),
      catchError(this.handleError)
    );
  }

  cancelSubscription(subscriptionId: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post(
          `${this.API_URL}/subscriptions/cancel`,
          { subscriptionId },
          { 
            headers,
            withCredentials: true 
          }
        );
      }),
      catchError(this.handleError)
    );
  }

  async handlePaymentRedirect(sessionId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.http.get<{ status: string }>(
        `${this.API_URL}/subscriptions/session-status/${sessionId}`,
        { 
          headers,
          withCredentials: true 
        }
      ).toPromise();
      
      if (response?.status === 'complete') {
        this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  private handleError(res: HttpErrorResponse): Observable<never> {
    console.error('Stripe API error:', res);
    // Extract and rename fields for clarity
    return throwError(() => ({
      message: res.error?.message || res.message || 'Unknown res',
      details: res.error?.details || '',
      statusCode: res.status
    }));
  }
}