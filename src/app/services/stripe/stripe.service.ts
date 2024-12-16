import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, Subscription, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, FirestoreSubscription, SubscriptionResponse } from 'src/app/types/SubscriptionTypes';
import { user } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe(environment.stripe);
  private priceId = 'price_1NRjH8BojwZRnVT43UC6rDPf';
  private paymentComplete = false;
  public API_URL: string = environment.url;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  private async getAuthHeaders(): Promise<HttpHeaders> {
    const token = await this.auth.getIdToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // For new subscriptions
  createSubscription(userId: string, userEmail:string): Observable<any> {
    debugger
    const data = { userId, userEmail };
    return this.http.post(
      `${this.API_URL}/stripe/create-subscription`,
      {data},
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // For managing existing subscriptions
  createPortalSession(userId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.API_URL}/stripe/create-portal-session`,
      { userId },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }
  getSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.get<SubscriptionStatus>(
          `${this.API_URL}/subscriptions/status/${userId}`,
          { 
            headers,
            withCredentials: true 
          }
        );
      }),
      map(response => ({
        status: response.subscription?.status || 'inactive',
        usage: response.usage || {
          pdfsGenerated: 0,
          scriptsProcessed: 0,
          storageUsed: 0
        },
        subscription: response.subscription
      })),
      catchError(error => this.handleError(error))
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
      catchError(error => this.handleError(error))
    );
  }

  updateSubscription(subscriptionId: string, newPriceId: string): Observable<any> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post(
          `${this.API_URL}/subscriptions/update`,
          { subscriptionId, newPriceId },
          { 
            headers,
            withCredentials: true 
          }
        );
      }),
      catchError(error => this.handleError(error))
    );
  }

  async handlePaymentRedirect(sessionId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await this.http.get(
        `${this.API_URL}/subscriptions/session-status/${sessionId}`,
        { 
          headers,
          withCredentials: true 
        }
      ).toPromise();
      
      if (response && response['status'] === 'complete') {
        this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
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

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status) {
      errorMessage = `Error: ${error.error.message || error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}