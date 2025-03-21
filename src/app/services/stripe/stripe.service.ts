import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, SubscriptionResponse } from 'src/app/types/SubscriptionTypes';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe(environment.stripe);
  public apiUrl: string = environment.url;
  
  // Subscription status as a BehaviorSubject
  private subscriptionStatusSubject = new BehaviorSubject<SubscriptionStatus | null>(null);
  public subscriptionStatus$ = this.subscriptionStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  // Get auth headers for API requests
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.auth.getCurrentUser()?.getIdToken() || Promise.resolve(null)).pipe(
      map(token => {
        if (!token) throw new Error('No authentication token available');
        return new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });
      })
    );
  }

  // Get subscription status - returns an Observable
  getSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('STRIPE: Getting subscription for user', userId);
    
    // Return cached value if available
    if (this.subscriptionStatusSubject.value) {
      console.log('STRIPE: Returning cached subscription', this.subscriptionStatusSubject.value);
      return of(this.subscriptionStatusSubject.value);
    }
    
    // Otherwise fetch fresh data
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.get<any>(
          `${this.apiUrl}/stripe/subscription-status/${userId}`,
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            console.log('STRIPE: Raw subscription response', response);
            
            // Handle empty response
            if (!response || typeof response !== 'object') {
              console.log('STRIPE: Empty response, returning default status');
              const emptyStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return emptyStatus;
            }
            
            // Transform response to standard format
            const status: SubscriptionStatus = {
              active: response.active || response.subscription?.status === 'active',
              subscription: {
                status: response.subscription?.status || null,
                originalStartDate: response.subscription?.originalStartDate || null,
                currentPeriodEnd: response.subscription?.currentPeriodEnd || null,
                willAutoRenew: response.subscription?.willAutoRenew || false
              },
              usage: {
                pdfsGenerated: response.usage?.pdfsGenerated || 0
              }
            };
            
            // Cache the result
            this.subscriptionStatusSubject.next(status);
            console.log('STRIPE: Processed subscription status', status);
            
            return status;
          }),
          catchError(error => {
            console.error('STRIPE: Error getting subscription status', error);
            
            // For 404, return empty status
            if (error.status === 404) {
              console.log('STRIPE: 404 error, returning empty status');
              const emptyStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return of(emptyStatus);
            }
            
            // For other errors, return empty status but log the error
            console.error('STRIPE: Unexpected error', error);
            return of(this.createEmptyStatus());
          })
        );
      })
    );
  }
  
  // Create empty subscription status
  private createEmptyStatus(): SubscriptionStatus {
    return {
      active: false,
      subscription: {
        status: null,
        originalStartDate: null,
        currentPeriodEnd: null,
        willAutoRenew: false
      },
      usage: { pdfsGenerated: 0 }
    };
  }

  // Clear cache (call when subscription might have changed)
  clearCache(): void {
    console.log('STRIPE: Clearing subscription cache');
    this.subscriptionStatusSubject.next(null);
  }

  // Create subscription - returns an Observable
  createSubscription(userId: string, userEmail: string): Observable<{ success: boolean; url?: string; checkoutUrl?: string }> {
    console.log('STRIPE: Creating subscription', { userId, userEmail });
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post<any>(
          `${this.apiUrl}/stripe/create-portal-session`,
          { userId, userEmail },
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            console.log('STRIPE: Create subscription response', response);
            
            // Check for url in the response
            if (response?.url) {
              // Clear cache since subscription status will change
              this.clearCache();
              
              return { 
                success: true, 
                url: response.url,
                checkoutUrl: response.url // Add both properties for backward compatibility
              };
            } else if (response?.checkoutUrl) {
              // Clear cache since subscription status will change
              this.clearCache();
              
              return { 
                success: true, 
                url: response.checkoutUrl, // Add both properties for backward compatibility
                checkoutUrl: response.checkoutUrl
              };
            } else {
              console.error('No URL found in response:', response);
              return { 
                success: false 
              };
            }
          }),
          catchError(error => {
            console.error('STRIPE: Error creating subscription', error);
            return of({ 
              success: false 
            });
          })
        );
      })
    );
  }

  // Open customer portal - returns an Observable
  createPortalSession(userId: string, userEmail: string): Observable<{ success: boolean; url?: string }> {
    console.log('STRIPE: Creating portal session', { userId, userEmail });
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post<{ url: string }>(
          `${this.apiUrl}/stripe/create-portal-session`,
          { 
            userId,
            userEmail,
            returnUrl: `${window.location.origin}/dashboard`
          },
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            console.log('STRIPE: Portal session response', response);
            debugger
            if (!response?.url) {
              throw new Error('No portal URL received');
            }
            
            // Clear cache since subscription status might change in portal
            this.clearCache();
            
            return { 
              success: true, 
              url: response.url 
            };
          }),
          catchError(error => {
            console.error('STRIPE: Error creating portal session', error);
            return of({ 
              success: false 
            });
          })
        );
      })
    );
  }

  // Cancel subscription
  cancelSubscription(subscriptionId: string): Observable<any> {
    console.log('STRIPE_CANCEL_CALLED', { subscriptionId });
    
    const cancelSub$ = this.getAuthHeaders().pipe(
      switchMap(headers => {
        const cancelRequest$ = this.http.post(
          `${this.apiUrl}/subscriptions/cancel`,
          { subscriptionId },
          { headers, withCredentials: true }
        );
        
        return cancelRequest$.pipe(
          tap(response => console.log('STRIPE_CANCEL_RESPONSE', response)),
          catchError(error => {
            console.error('STRIPE_CANCEL_ERROR', error);
            return this.handleError(error);
          })
        );
      })
    );
    
    return cancelSub$;
  }

  // Handle payment redirect
  async handlePaymentRedirect(sessionId: string): Promise<boolean> {
    console.log('STRIPE_PAYMENT_REDIRECT', { sessionId });
    
    try {
      const headers = await this.getAuthHeaders().toPromise();
      const response = await this.http.get<{ status: string }>(
        `${this.apiUrl}/subscriptions/session-status/${sessionId}`,
        { headers, withCredentials: true }
      ).toPromise();
      
      console.log('STRIPE_REDIRECT_RESPONSE', response);
      
      if (response?.status === 'complete') {
        this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('STRIPE_REDIRECT_ERROR', error);
      return false;
    }
  }

  // Error handler
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('STRIPE_ERROR_HANDLER', error);
    return throwError(() => ({
      message: error.error?.message || error.message || 'Unknown error',
      statusCode: error.status
    }));
  }
}