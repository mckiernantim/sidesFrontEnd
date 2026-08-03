import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { Observable, firstValueFrom, take } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { fadeInOutAnimation } from '../../animations/animations';
import {
  BillingInterval,
  effectiveOfferFromQuery,
  getBillingFaqText,
  getOfferPlanTitle,
  getOfferPriceCents,
  getOfferPriceLabel,
  getStandardPriceLabel,
  formatCents,
  shouldShowFoundersOffer,
  FOUNDERS_RATE_SUBTITLE
} from '../../utils/founders-offer';

@Component({
    selector: 'app-pricing',
    templateUrl: './pricing.component.html',
    styleUrls: ['./pricing.component.css'],
    animations: [fadeInOutAnimation],
    standalone: false
})
export class PricingComponent implements OnInit {
  user$: Observable<User | null>;
  currentUser: User | null = null;
  subscriptionStatus$: Observable<SubscriptionStatus>;
  isLoading = true;
  isFounder = false;
  showFoundersOffer = false;
  planTitle = 'Professional Plan';
  priceLabel = getOfferPriceLabel({ isFounder: false, active: false }, 'week');
  priceDollars = getOfferPriceCents({ isFounder: false, active: false }, 'week') / 100;
  priceAmount = formatCents(getOfferPriceCents({ isFounder: false, active: false }, 'week'));
  selectedInterval: BillingInterval = 'week';
  billingFaqText = getBillingFaqText({ isFounder: false, active: false }, 'week');
  readonly foundersRateSubtitle = FOUNDERS_RATE_SUBTITLE;
  /** Test-mode warning must disappear on its own once Stripe is switched to live keys */
  showTestModeBanner = false;
  private offerQuery: string | null = null;
  
  constructor(
    private stripeService: StripeService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.showTestModeBanner = !this.stripeService.isLive;
    this.user$ = this.authService.user$;
    this.subscriptionStatus$ = this.stripeService.subscriptionStatus$;
    this.offerQuery = this.route.snapshot.queryParamMap.get('offer');
    
    this.user$.pipe(take(1)).subscribe(user => {
      this.currentUser = user;
    
      if (user) {
        this.stripeService.getSubscriptionStatus(user.uid).subscribe(status => {
          this.applyEligibility(status);
        });
      } else {
        this.applyEligibility({ isFounder: false, active: false } as SubscriptionStatus);
      }
      
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    });

    this.subscriptionStatus$.subscribe(status => {
      if (status) {
        this.applyEligibility(status);
      }
    });
  }

  private applyEligibility(status: Pick<SubscriptionStatus, 'isFounder' | 'active'>): void {
    const eligibility = {
      isFounder: Boolean(status?.isFounder),
      active: Boolean(status?.active)
    };
    // Query param is display-only; forged ?offer=founders cannot elevate non-founders
    effectiveOfferFromQuery(eligibility, this.offerQuery);
    this.isFounder = eligibility.isFounder;
    this.showFoundersOffer = shouldShowFoundersOffer(eligibility);
    this.planTitle = getOfferPlanTitle(eligibility);
    this.refreshPriceCopy(eligibility);
  }

  private refreshPriceCopy(eligibility = {
    isFounder: this.isFounder,
    active: false
  }): void {
    const cents = getOfferPriceCents(eligibility, this.selectedInterval);
    this.priceDollars = cents / 100;
    this.priceAmount = formatCents(cents);
    this.priceLabel = getOfferPriceLabel(eligibility, this.selectedInterval);
    this.billingFaqText = getBillingFaqText(eligibility, this.selectedInterval);
  }

  selectInterval(interval: BillingInterval): void {
    this.selectedInterval = interval;
    this.refreshPriceCopy({ isFounder: this.isFounder, active: false });
  }

  getStruckThroughPrice(): string {
    return getStandardPriceLabel(this.selectedInterval);
  }

  getIntervalSuffix(): string {
    return this.selectedInterval === 'month' ? '/month' : '/week';
  }

  /** Active and set to renew — not canceled / cancel-at-period-end. */
  isRenewingSubscription(status: SubscriptionStatus | null | undefined): boolean {
    if (!status?.active || !status.subscription) return false;
    return !this.isCancelingSubscription(status);
  }

  /**
   * Canceled in Stripe but still inside the paid period, OR cancel_at_period_end.
   * These must NOT show the same “You're subscribed / Manage” CTA as a renewing sub.
   */
  isCancelingSubscription(status: SubscriptionStatus | null | undefined): boolean {
    if (!status?.active || !status.subscription) return false;
    if (status.subscription.cancelAtPeriodEnd) return true;
    return status.subscription.status === 'active_until_period_end';
  }

  signIn(): void {
    this.authService.signInWithGoogle();
  }

  async subscribe(): Promise<void> {
    const user = this.currentUser || await firstValueFrom(this.user$.pipe(take(1)));
    
    if (!user) {
      console.error('No user found');
      return;
    }

    // No client priceId — backend selects Founders vs standard from founders/{uid} + interval
    this.stripeService.createPortalSession(
      user.uid,
      user.email,
      undefined,
      this.selectedInterval
    ).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          window.location.href = response.url;
        }
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
      }
    });
  }

  manageSubscription(): void {
    if (this.currentUser) {
      this.stripeService.createPortalSession(this.currentUser.uid, this.currentUser.email).subscribe({
        next: (response) => {
          if (response.success && response.url) {
            window.location.href = response.url;
          }
        },
        error: (error) => {
          console.error('Error creating portal session:', error);
        }
      });
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString();
    }
    return '';
  }
}
