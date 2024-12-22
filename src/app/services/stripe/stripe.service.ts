import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, FirestoreSubscription, SubscriptionResponse } from 'src/app/types/SubscriptionTypes';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe(environment.stripe);
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

  createSubscription(userId: string, userEmail: string): Observable<SubscriptionResponse> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post<SubscriptionResponse>(
          `${this.API_URL}/stripe/create-subscription`,
          { userId, userEmail },
          { 
            headers,
            withCredentials: true 
          }
        );
      }),
      catchError(this.handleError)
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


  createPortalSession(userId: string): Observable<{ url: string }> {
    return from(this.getAuthHeaders()).pipe(
      switchMap(headers => {
        return this.http.post<{ url: string }>(
          `${this.API_URL}/stripe/create-portal-session`,
          { userId },
          { 
            headers,
            withCredentials: true 
          }
        );
      }),
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