import { Injectable, isDevMode } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { getConfig } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError, BehaviorSubject, of, combineLatest } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus, SubscriptionResponse } from 'src/app/types/SubscriptionTypes';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

interface StripeError {
  code: string;
  message: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private config = getConfig(!isDevMode());
  private stripePromise = loadStripe(this.config.stripe);
  public apiUrl: string = this.config.url;
  
  private subscriptionStatusSubject = new BehaviorSubject<SubscriptionStatus | null>(null);
  public subscriptionStatus$ = this.subscriptionStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private firestore: Firestore
  ) {}

  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.auth.getCurrentUser()?.getIdToken() || Promise.resolve(null)).pipe(
      map(token => {
        if (!token) {
          console.error('STRIPE: No authentication token available');
          throw new Error('No authentication token available');
        }
        return new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });
      }),
      catchError(error => {
        console.error('STRIPE: Error getting auth headers', error);
        return throwError(() => new Error('Failed to get authentication headers'));
      })
    );
  }

  getSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('STRIPE: Getting subscription for user', userId);
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        // Get subscription status from API
        const subscription$ = this.http.get<any>(
          `${this.apiUrl}/stripe/subscription-status/${userId}`,
          { headers, withCredentials: true }
        );

        // Get usage data from Firebase
        const usage$ = from(getDoc(doc(this.firestore, 'users', userId))).pipe(
          map(docSnapshot => {
            if (!docSnapshot.exists()) {
              return {
                pdfsGenerated: 0,
                lastPdfGeneration: null,
                pdfUsageLimit: null
              };
            }
            const data = docSnapshot.data();
            return {
              pdfsGenerated: data['pdfsGenerated'] || 0,
              lastPdfGeneration: data['lastPdfGeneration'] || null,
              pdfUsageLimit: data['pdfUsageLimit'] || null
            };
          }),
          catchError(error => {
            console.error('STRIPE: Error fetching usage from Firebase', error);
            return of({
              pdfsGenerated: 0,
              lastPdfGeneration: null,
              pdfUsageLimit: null
            });
          })
        );

        // Combine both observables
        return combineLatest([subscription$, usage$]).pipe(
          map(([subscriptionResponse, usageData]) => {
            if (!subscriptionResponse) {
              console.log('STRIPE: No subscription response, returning default status');
              const emptyStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return emptyStatus;
            }

            const status: SubscriptionStatus = {
              active: subscriptionResponse.subscription?.status === 'active',
              subscription: subscriptionResponse.subscription ? {
                id: subscriptionResponse.subscription.id || '',
                status: subscriptionResponse.subscription.status || null,
                created: subscriptionResponse.subscription.created || null,
                currentPeriodEnd: subscriptionResponse.subscription.currentPeriodEnd || null,
                currentPeriodStart: subscriptionResponse.subscription.currentPeriodStart || null,
                cancelAtPeriodEnd: subscriptionResponse.subscription.cancelAtPeriodEnd || false,
                willAutoRenew: subscriptionResponse.subscription.willAutoRenew || false,
                originalStartDate: subscriptionResponse.subscription.created || null,
                plan: subscriptionResponse.subscription.plan ? {
                  amount: subscriptionResponse.subscription.plan.amount,
                  interval: subscriptionResponse.subscription.plan.interval,
                  nickname: subscriptionResponse.subscription.plan.nickname
                } : null
              } : null,
              usage: {
                pdfsGenerated: usageData.pdfsGenerated,
                lastPdfGeneration: usageData.lastPdfGeneration,
                pdfUsageLimit: usageData.pdfUsageLimit,
                subscriptionStatus: subscriptionResponse.subscription?.status || 'inactive',
                subscriptionFeatures: {
                  pdfGeneration: subscriptionResponse.subscription?.features?.pdfGeneration || false,
                  unlimitedPdfs: subscriptionResponse.subscription?.features?.unlimitedPdfs || false,
                  pdfLimit: subscriptionResponse.subscription?.features?.pdfLimit || null
                }
              },
              plan: subscriptionResponse.subscription?.plan?.nickname || null
            };
            
            this.subscriptionStatusSubject.next(status);
            return status;
          }),
          catchError(error => {
            console.error('STRIPE: Error processing subscription status', error);
            const emptyStatus = this.createEmptyStatus();
            this.subscriptionStatusSubject.next(emptyStatus);
            return of(emptyStatus);
          })
        );
      })
    );
  }

  private createEmptyStatus(): SubscriptionStatus {
    return {
      active: false,
      subscription: {
        id: '',
        status: null,
        created: null,
        currentPeriodEnd: null,
        currentPeriodStart: null,
        cancelAtPeriodEnd: false,
        willAutoRenew: false,
        originalStartDate: null,
        plan: null
      },
      usage: {
        pdfsGenerated: 0,
        lastPdfGeneration: null,
        pdfUsageLimit: null,
        subscriptionStatus: 'inactive',
        subscriptionFeatures: {
          pdfGeneration: false,
          unlimitedPdfs: false,
          pdfLimit: null
        }
      }
    };
  }

  clearCache(): void {
    console.log('STRIPE: Clearing subscription cache');
    this.subscriptionStatusSubject.next(null);
  }

  createPortalSession(userId: string, userEmail: string, returnUrl?: string): Observable<{ success: boolean; url?: string; error?: string; type?: string }> {
    console.log('STRIPE: Creating portal session', { userId, userEmail, returnUrl });
    debugger
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        // Ensure we use http for localhost
        const baseUrl = window.location.origin;
        const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
        const host = baseUrl.replace(/^https?:\/\//, '');
        const safeReturnUrl = returnUrl || `${protocol}://${host}/profile`;
        debugger

        const requestBody = {
          userId,
          userEmail,
          returnUrl: safeReturnUrl,
          locale: 'en-US'
        };

        console.log('STRIPE: Portal session request body', requestBody);

        return this.http.post<{ 
          success: boolean; 
          url: string; 
          type: 'portal' | 'checkout';
          message?: string;
          error?: string;
        }>(
          `${this.apiUrl}/stripe/create-portal-session`,
          requestBody,
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            console.log('STRIPE: Portal session response', response);
            
            if (!response?.success) {
              throw new Error(response?.error || 'Failed to create portal session');
            }

            if (!response?.url) {
              throw new Error('No portal URL received from server');
            }

            try {
              // Log the URL before any manipulation
              console.log('STRIPE: Raw URL from server:', response.url);
              
              // Create a URL object to validate the format
              const url = new URL(response.url);
              console.log('STRIPE: Parsed URL:', url.toString());
              
              if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid URL protocol');
              }
              
              // Use the validated URL
              const finalUrl = url.toString();
              console.log('STRIPE: Final URL to redirect to:', finalUrl);
              
              this.clearCache();
              window.location.href = finalUrl;
              
              return { 
                success: true, 
                url: finalUrl,
                type: response.type,
                message: response.message
              };
            } catch (e) {
              console.error('STRIPE: URL validation error:', e);
              console.error('STRIPE: Invalid URL received:', response.url);
              throw new Error('Invalid URL format received from server');
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('STRIPE: Error creating portal session', error);
            
            let errorMessage = 'An error occurred while creating the portal session';
            
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.error?.error) {
              errorMessage = error.error.error;
            } else if (error.status === 401) {
              errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to perform this action.';
            }
            
            return of({ 
              success: false,
              error: errorMessage
            });
          })
        );
      }),
      catchError(error => {
        console.error('STRIPE: Error in portal session creation flow', error);
        return of({ 
          success: false,
          error: 'Failed to create portal session'
        });
      })
    );
  }
}