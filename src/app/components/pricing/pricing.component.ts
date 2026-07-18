import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { Observable, firstValueFrom, take } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { fadeInOutAnimation } from '../../animations/animations';
import {
  effectiveOfferFromQuery,
  getBillingFaqText,
  getOfferPlanTitle,
  getOfferPriceLabel,
  getOfferWeeklyPriceCents,
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
  priceLabel = '$20 per week';
  weeklyDollars = 20;
  billingFaqText = getBillingFaqText({ isFounder: false, active: false });
  readonly foundersRateSubtitle = FOUNDERS_RATE_SUBTITLE;
  private offerQuery: string | null = null;
  
  constructor(
    private stripeService: StripeService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
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
    // Founders always see Founders Rate copy ($10); non-founders see Professional ($20)
    this.planTitle = getOfferPlanTitle(eligibility);
    this.weeklyDollars = getOfferWeeklyPriceCents(eligibility) / 100;
    this.priceLabel = getOfferPriceLabel(eligibility);
    this.billingFaqText = getBillingFaqText(eligibility);
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

    // No client priceId — backend selects Founders vs weekly from founders/{uid}
    this.stripeService.createPortalSession(user.uid, user.email).subscribe({
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
