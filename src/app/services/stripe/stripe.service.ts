import { Injectable, isDevMode } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { getConfig } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError, BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';
import {
  pricingCommandsForOffer,
  resolveOfferProduct,
  setPriceCatalog,
  shouldRedirectToPricingAfterLogin,
  BillingInterval,
  OfferProduct
} from '../../utils/founders-offer';

interface StripePriceCatalogResponse {
  success: boolean;
  testMode?: boolean;
  prices: {
    standardWeekly: number | null;
    standardMonthly: number | null;
    foundersWeekly: number | null;
    foundersMonthly: number | null;
    student: number | null;
  } | null;
}

interface StripeError {
  code: string;
  message: string;
  type: string;
}

// Backend response interface - matches the new consolidated structure
interface BackendSubscriptionResponse {
  active: boolean;
  isFounder?: boolean;
  isStudent?: boolean;
  subscription: {
    status: string;
    subscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    willAutoRenew?: boolean;
    plan: {
      id: string;
      nickname: string;
      amount: number;
      interval: string; // Allow any string interval from Stripe
    } | null;
    pendingPlanChange?: {
      fromInterval: string;
      toInterval: string;
      amount?: number | null;
      effectiveAt: string;
      priceId?: string;
      scheduleId?: string;
    } | null;
    createdAt: string | null;
    lastUpdated: string;
    lastPaymentStatus?: 'succeeded' | 'failed' | 'pending';
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
  };
  usage: {
    pdfsGenerated: number;
    lastPdfGeneration: string | null;
    resetDate?: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private config = getConfig(!isDevMode());
  private stripePromise = loadStripe(this.config.stripe);
  public apiUrl: string = this.config.url;
  /** Mirrors environment isLive — false = test Stripe, true = real charges */
  public readonly isLive: boolean = Boolean(this.config.isLive);
  
  private subscriptionStatusSubject = new BehaviorSubject<SubscriptionStatus | null>(null);
  public subscriptionStatus$ = this.subscriptionStatusSubject.asObservable();

  private isFounderSubject = new BehaviorSubject<boolean>(false);
  public isFounder$ = this.isFounderSubject.asObservable();

  private isStudentSubject = new BehaviorSubject<boolean>(false);
  public isStudent$ = this.isStudentSubject.asObservable();

  private offerProductSubject = new BehaviorSubject<OfferProduct>('standard');
  public offerProduct$ = this.offerProductSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
    // Removed Firestore dependency - no longer needed!
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

  /**
   * Hydrate advertised pricing from the live Stripe catalog at bootstrap.
   * Never rejects — on failure the bundled defaults in founders-offer stand,
   * so a Stripe outage degrades to slightly stale copy rather than a blank page.
   */
  loadPriceCatalog(): Promise<void> {
    return firstValueFrom(
      this.http.get<StripePriceCatalogResponse>(`${this.apiUrl}/stripe/prices`).pipe(
        catchError(error => {
          console.warn('STRIPE: Falling back to bundled prices', error?.message ?? error);
          return of(null);
        })
      )
    ).then(response => {
      if (!response?.success || !response.prices) return;
      const { standardWeekly, standardMonthly, foundersWeekly, foundersMonthly } = response.prices;
      setPriceCatalog({
        standardWeeklyCents: standardWeekly ?? undefined,
        standardMonthlyCents: standardMonthly ?? undefined,
        foundersWeeklyCents: foundersWeekly ?? undefined,
        foundersMonthlyCents: foundersMonthly ?? undefined
      });
    });
  }

  getSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('STRIPE: Getting consolidated subscription data for user', userId);
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        // Single API call - everything comes from the consolidated backend
        return this.http.get<BackendSubscriptionResponse>(
          `${this.apiUrl}/stripe/subscription-status/${userId}`,
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            console.log('STRIPE: Backend response:', response);
            
            if (!response) {
              console.log('STRIPE: No response, returning default status');
              const emptyStatus = this.createEmptyStatus();
              this.subscriptionStatusSubject.next(emptyStatus);
              return emptyStatus;
            }

            // Map the consolidated backend response to frontend format
            const status: SubscriptionStatus = {
              active: response.active,
              isFounder: Boolean(response.isFounder),
              isStudent: Boolean(response.isStudent),
              subscription: response.subscription ? {
                id: response.subscription.subscriptionId || '',
                status: response.subscription.status,
                created: response.subscription.createdAt,
                currentPeriodEnd: response.subscription.currentPeriodEnd,
                currentPeriodStart: response.subscription.currentPeriodStart,
                cancelAtPeriodEnd: response.subscription.cancelAtPeriodEnd,
                willAutoRenew:
                  typeof response.subscription.willAutoRenew === 'boolean'
                    ? response.subscription.willAutoRenew
                    : response.subscription.status === 'active' &&
                      !response.subscription.cancelAtPeriodEnd,
                // Firestore-fallback responses omit createdAt; period start keeps the UI truthful
                originalStartDate: response.subscription.createdAt || response.subscription.currentPeriodStart || null,
                plan: response.subscription.plan ? {
                  id: response.subscription.plan.id,
                  amount: response.subscription.plan.amount,
                  interval: response.subscription.plan.interval,
                  nickname: response.subscription.plan.nickname
                } : null,
                pendingPlanChange: response.subscription.pendingPlanChange || null
              } : null,
              usage: {
                pdfsGenerated: response.usage.pdfsGenerated,
                lastPdfGeneration: response.usage.lastPdfGeneration,
                pdfUsageLimit: 0,
                subscriptionStatus: response.subscription?.status || 'inactive',
                subscriptionFeatures: {
                  pdfGeneration: response.active,
                  // An active subscription grants unlimited generation — there is no per-period cap.
                  unlimitedPdfs: true,
                  pdfLimit: 0
                },
                resetDate: response.usage.resetDate || null,
                remainingPdfs: 0
              },
              plan: response.subscription?.plan?.nickname || null,
              // Additional fields from new backend
              lastPayment: response.subscription?.lastPaymentStatus ? {
                status: response.subscription.lastPaymentStatus as 'succeeded' | 'failed' | 'pending',
                amount: response.subscription.lastPaymentAmount || 0,
                date: response.subscription.lastPaymentDate || null
              } : null
            };
            
            console.log('STRIPE: Processed consolidated status:', status);
            this.subscriptionStatusSubject.next(status);
            this.isFounderSubject.next(Boolean(status.isFounder));
            this.isStudentSubject.next(Boolean(status.isStudent));
            this.offerProductSubject.next(
              resolveOfferProduct({ isFounder: Boolean(status.isFounder), active: status.active })
            );
            return status;
          }),
          catchError(error => {
            console.error('STRIPE: Error fetching subscription status', error);
            
            // Handle specific error cases
            if (error.status === 401) {
              console.error('STRIPE: Authentication failed');
            } else if (error.status === 404) {
              console.warn('STRIPE: User not found, returning empty status');
            }
            
            const emptyStatus = this.createEmptyStatus();
            this.subscriptionStatusSubject.next(emptyStatus);
            return of(emptyStatus);
          })
        );
      }),
      catchError(error => {
        console.error('STRIPE: Error in subscription status flow', error);
        const emptyStatus = this.createEmptyStatus();
        this.subscriptionStatusSubject.next(emptyStatus);
        return of(emptyStatus);
      })
    );
  }

  private createEmptyStatus(): SubscriptionStatus {
    return {
      active: false,
      isFounder: false,
      isStudent: false,
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
        pdfUsageLimit: 0,
        subscriptionStatus: 'inactive',
        subscriptionFeatures: {
          pdfGeneration: false,
          unlimitedPdfs: false,
          pdfLimit: 0
        },
        resetDate: null,
        remainingPdfs: 0
      },
      plan: null,
      lastPayment: null
    };
  }

  /**
   * After explicit sign-in: refresh eligibility and route inactive users to the correct product.
   * Does not hijack mid-app reloads (explicitSignIn=false).
   */
  async resolveAndRouteAfterLogin(
    userId: string,
    options: { explicitSignIn?: boolean; currentPath?: string } = {}
  ): Promise<SubscriptionStatus> {
    const explicitSignIn = options.explicitSignIn !== false;
    const status = await firstValueFrom(this.getSubscriptionStatus(userId));
    const eligibility = {
      isFounder: Boolean(status.isFounder),
      active: status.active
    };
    const offer = resolveOfferProduct(eligibility);

    if (
      shouldRedirectToPricingAfterLogin(eligibility, {
        explicitSignIn,
        currentPath: options.currentPath || this.router.url
      })
    ) {
      const cmd = pricingCommandsForOffer(offer);
      await this.router.navigate([cmd.path], cmd.queryParams ? { queryParams: cmd.queryParams } : {});
    }

    return status;
  }

  /** Silent eligibility refresh on reload — no forced redirect. */
  async refreshEligibility(userId: string): Promise<SubscriptionStatus> {
    return firstValueFrom(this.getSubscriptionStatus(userId));
  }

  // Method to refresh subscription status (useful after subscription changes)
  refreshSubscriptionStatus(userId: string): Observable<SubscriptionStatus> {
    console.log('STRIPE: Refreshing subscription status for user', userId);
    this.clearCache();
    return this.getSubscriptionStatus(userId);
  }

  // Method to check if user can generate PDFs
  canGeneratePdf(subscriptionStatus: SubscriptionStatus): boolean {
    if (!subscriptionStatus.active) {
      return false;
    }
    
    const usage = subscriptionStatus.usage;
    if (usage.subscriptionFeatures.unlimitedPdfs) {
      return true;
    }
    
    return (usage.remainingPdfs || 0) > 0;
  }

  // Method to get user's PDF usage info
  getUsageInfo(subscriptionStatus: SubscriptionStatus): {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string | null;
    canGenerate: boolean;
  } {
    const usage = subscriptionStatus.usage;
    
    return {
      used: usage.pdfsGenerated,
      limit: usage.pdfUsageLimit || 0,
      remaining: usage.remainingPdfs || 0,
      resetDate: usage.resetDate,
      canGenerate: this.canGeneratePdf(subscriptionStatus)
    };
  }

  clearCache(): void {
    console.log('STRIPE: Clearing subscription cache');
    this.subscriptionStatusSubject.next(null);
    this.isFounderSubject.next(false);
    this.isStudentSubject.next(false);
    this.offerProductSubject.next('standard');
  }

  createPortalSession(
    userId: string,
    userEmail: string,
    returnUrl?: string,
    interval: BillingInterval = 'week'
  ): Observable<{ success: boolean; url?: string; error?: string; type?: string }> {
    console.log('STRIPE: Creating portal session', { userId, userEmail, returnUrl, interval });
    
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        // Ensure we use http for localhost
        const baseUrl = window.location.origin;
        const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
        const host = baseUrl.replace(/^https?:\/\//, '');
        const safeReturnUrl = returnUrl || `${protocol}://${host}/profile`;
        
        const requestBody = {
          userId,
          userEmail,
          returnUrl: safeReturnUrl,
          locale: 'en-US',
          interval
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
              
              // Clear cache since subscription might change
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

  /**
   * Schedule a weekly ↔ monthly plan change at the end of the current billing period.
   * Price IDs are selected server-side from founders eligibility.
   */
  changePlan(
    userId: string,
    userEmail: string,
    interval: BillingInterval
  ): Observable<{
    success: boolean;
    unchanged?: boolean;
    interval?: string;
    fromInterval?: string;
    amount?: number | null;
    effectiveAt?: string;
    message?: string;
    error?: string;
    pendingPlanChange?: {
      fromInterval: string;
      toInterval: string;
      amount?: number | null;
      effectiveAt: string;
    };
  }> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => {
        return this.http.post<{
          success: boolean;
          unchanged?: boolean;
          interval?: string;
          fromInterval?: string;
          amount?: number | null;
          effectiveAt?: string;
          message?: string;
          error?: string;
          pendingPlanChange?: {
            fromInterval: string;
            toInterval: string;
            amount?: number | null;
            effectiveAt: string;
          };
        }>(
          `${this.apiUrl}/stripe/change-plan`,
          { userId, userEmail, interval },
          { headers, withCredentials: true }
        ).pipe(
          map(response => {
            if (!response?.success) {
              return {
                success: false,
                error: response?.error || response?.message || 'Failed to change plan'
              };
            }
            return response;
          }),
          catchError((error: HttpErrorResponse) => {
            const errorMessage =
              error.error?.message ||
              error.error?.error ||
              'An error occurred while changing your plan';
            return of({ success: false, error: errorMessage });
          })
        );
      }),
      catchError(() => of({ success: false, error: 'Failed to change plan' }))
    );
  }
}