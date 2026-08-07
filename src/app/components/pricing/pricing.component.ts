import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { AuthModalService } from '../../services/auth-modal/auth-modal.service';
import { Observable, firstValueFrom, take } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { fadeInOutAnimation } from '../../animations/animations';
import {
  BillingInterval,
  PricingTier,
  effectiveOfferFromQuery,
  getBillingFaqText,
  formatCents,
  shouldShowFoundersOffer,
  FOUNDERS_RATE_SUBTITLE,
  getOfferPriceCents,
  getOfferPriceLabel,
  getStandardPriceLabel,
  getProPriceCents,
  getProPriceLabel,
  getStandardProPriceLabel,
  getTeamPriceCents,
  getTeamPriceLabel,
  getStandardTeamPriceLabel
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
  selectedInterval: BillingInterval = 'week';
  /** Which tier card is visually emphasized (default: pro). Updated by ?tier= query. */
  emphasizedTier: PricingTier = 'pro';
  readonly foundersRateSubtitle = FOUNDERS_RATE_SUBTITLE;
  showTestModeBanner = false;

  /** In-flight state for Basic subscribe / downgrade CTA */
  isSubscribingBasic = false;
  /** In-flight state for Pro subscribe / upgrade / downgrade CTA */
  isSubscribingPro = false;
  /** In-flight state for Team subscribe / upgrade CTA */
  isSubscribingTeam = false;
  /** Error message to display under CTA buttons */
  ctaError: string | null = null;

  private offerQuery: string | null = null;

  constructor(
    private stripeService: StripeService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.showTestModeBanner = !this.stripeService.isLive;
    this.user$ = this.authService.user$;
    this.subscriptionStatus$ = this.stripeService.subscriptionStatus$;

    this.offerQuery = this.route.snapshot.queryParamMap.get('offer');
    const tierQuery = this.route.snapshot.queryParamMap.get('tier') as PricingTier | null;
    if (tierQuery === 'basic' || tierQuery === 'pro' || tierQuery === 'team') {
      this.emphasizedTier = tierQuery;
    }

    this.user$.pipe(take(1)).subscribe(user => {
      this.currentUser = user;

      if (user) {
        this.stripeService.getSubscriptionStatus(user.uid).subscribe(status => {
          this.applyEligibility(status);
        });
      } else {
        this.applyEligibility({ isFounder: false, active: false } as SubscriptionStatus);
      }

      setTimeout(() => { this.isLoading = false; }, 1000);
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
    effectiveOfferFromQuery(eligibility, this.offerQuery);
    this.isFounder = eligibility.isFounder;
    this.showFoundersOffer = shouldShowFoundersOffer(eligibility);
  }

  // ─── Interval toggle ────────────────────────────────────────────────────────

  selectInterval(interval: BillingInterval): void {
    this.selectedInterval = interval;
  }

  getIntervalSuffix(): string {
    return this.selectedInterval === 'month' ? '/month' : '/week';
  }

  // ─── Basic tier display ─────────────────────────────────────────────────────

  getBasicPriceAmount(): string {
    return formatCents(getOfferPriceCents({ isFounder: this.isFounder, active: false }, this.selectedInterval));
  }

  getBasicPriceLabel(): string {
    return getOfferPriceLabel({ isFounder: this.isFounder, active: false }, this.selectedInterval);
  }

  getBasicStandardPriceLabel(): string {
    return getStandardPriceLabel(this.selectedInterval);
  }

  // ─── Pro tier display ───────────────────────────────────────────────────────

  getProPriceAmount(): string {
    return formatCents(getProPriceCents({ isFounder: this.isFounder, active: false }, this.selectedInterval));
  }

  getProPriceLabel(): string {
    return getProPriceLabel({ isFounder: this.isFounder, active: false }, this.selectedInterval);
  }

  getProStandardPriceLabel(): string {
    return getStandardProPriceLabel(this.selectedInterval);
  }

  // ─── Team tier display ──────────────────────────────────────────────────────

  getTeamPriceAmount(): string {
    return formatCents(getTeamPriceCents({ isFounder: this.isFounder, active: false }, this.selectedInterval));
  }

  getTeamPriceLabel(): string {
    return getTeamPriceLabel({ isFounder: this.isFounder, active: false }, this.selectedInterval);
  }

  getTeamStandardPriceLabel(): string {
    return getStandardTeamPriceLabel(this.selectedInterval);
  }

  // ─── Subscription state helpers ─────────────────────────────────────────────

  /** Returns true when the subscription is active and set to renew. */
  isRenewingSubscription(status: SubscriptionStatus | null | undefined): boolean {
    if (!status?.active || !status.subscription) return false;
    return !this.isCancelingSubscription(status);
  }

  isCancelingSubscription(status: SubscriptionStatus | null | undefined): boolean {
    if (!status?.active || !status.subscription) return false;
    if (status.subscription.cancelAtPeriodEnd) return true;
    return status.subscription.status === 'active_until_period_end';
  }

  /**
   * True only for active subscribers on the plain Basic tier
   * (no scheduling and no team tier).
   */
  isBasicSubscriber(status: SubscriptionStatus | null | undefined): boolean {
    return Boolean(status?.active) && !status?.hasSchedulingTier && !status?.hasTeamTier;
  }

  /**
   * True only for active subscribers on the Pro/Scheduling tier
   * (has scheduling tier but NOT on the Team tier above it).
   */
  isProSubscriber(status: SubscriptionStatus | null | undefined): boolean {
    return Boolean(status?.active) && Boolean(status?.hasSchedulingTier) && !status?.hasTeamTier;
  }

  /**
   * True for active subscribers on the Team tier (the highest tier).
   */
  isTeamSubscriber(status: SubscriptionStatus | null | undefined): boolean {
    return Boolean(status?.active) && Boolean(status?.hasTeamTier);
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    if (typeof timestamp === 'object' && timestamp !== null) {
      const ts = timestamp as { seconds?: number };
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    }
    return '';
  }

  getBillingFaqText(): string {
    return getBillingFaqText({ isFounder: this.isFounder, active: false }, this.selectedInterval);
  }

  // ─── Auth / CTA actions ──────────────────────────────────────────────────────

  signIn(): void {
    this.authModal.open();
  }

  /**
   * Subscribe / downgrade to Basic.
   *
   * - Active Pro or Team subscriber: call createBasicCheckoutSession (in-place
   *   downgrade). On success refresh status and navigate to /profile.
   * - Inactive user: fall through to createPortalSession (fresh checkout).
   */
  async subscribeBasic(currentStatus?: SubscriptionStatus | null): Promise<void> {
    const user = this.currentUser || await firstValueFrom(this.user$.pipe(take(1)));
    if (!user) {
      this.authModal.open();
      return;
    }

    this.isSubscribingBasic = true;
    this.ctaError = null;

    // Active Pro/Team → in-place downgrade via createBasicCheckoutSession
    if (currentStatus?.active && (currentStatus.hasSchedulingTier || currentStatus.hasTeamTier)) {
      this.stripeService.createBasicCheckoutSession(
        user.uid,
        user.email ?? '',
        this.selectedInterval
      ).subscribe({
        next: (response) => {
          this.isSubscribingBasic = false;
          if (!response.success) {
            this.ctaError = response.message || response.error || 'Failed to start downgrade';
            return;
          }
          if (response.upgraded) {
            if (this.currentUser) {
              this.stripeService.refreshSubscriptionStatus(this.currentUser.uid).subscribe();
            }
            this.router.navigate(['/profile']);
          }
          // Checkout redirect handled by window.location in service
        },
        error: () => {
          this.isSubscribingBasic = false;
          this.ctaError = 'An error occurred. Please try again.';
        }
      });
      return;
    }

    // Inactive user — fresh checkout via portal session
    this.stripeService.createPortalSession(
      user.uid,
      user.email ?? '',
      undefined,
      this.selectedInterval
    ).subscribe({
      next: (response) => {
        this.isSubscribingBasic = false;
        if (!response.success) {
          this.ctaError = response.error || 'Failed to start subscription';
        }
      },
      error: () => {
        this.isSubscribingBasic = false;
        this.ctaError = 'An error occurred. Please try again.';
      }
    });
  }

  /**
   * Pro subscribe or upgrade — uses the scheduling checkout / in-place upgrade path.
   * ONE Stripe subscription per account: upgrades in place if one exists.
   */
  async subscribePro(): Promise<void> {
    const user = this.currentUser || await firstValueFrom(this.user$.pipe(take(1)));
    if (!user) {
      this.authModal.open();
      return;
    }
    this.isSubscribingPro = true;
    this.ctaError = null;
    this.stripeService.createSchedulingCheckoutSession(
      user.uid,
      user.email ?? '',
      this.selectedInterval
    ).subscribe({
      next: (response) => {
        this.isSubscribingPro = false;
        if (!response.success) {
          this.ctaError = response.message || response.error || 'Failed to start upgrade';
          return;
        }
        if (response.upgraded) {
          // In-place upgrade complete — refresh status, navigate to profile to confirm
          if (this.currentUser) {
            this.stripeService.refreshSubscriptionStatus(this.currentUser.uid).subscribe();
          }
          this.router.navigate(['/profile']);
        }
        // Checkout redirect case: service handles window.location
      },
      error: () => {
        this.isSubscribingPro = false;
        this.ctaError = 'An error occurred. Please try again.';
      }
    });
  }

  /**
   * Team subscribe — calls createTeamCheckoutSession on StripeService.
   * On 503 (Team prices not yet configured) the service returns
   * error: 'TEAM_PRICES_NOT_CONFIGURED' with a friendly message; we show
   * that message so the Team card remains a visible marketing surface.
   */
  async subscribeTeam(): Promise<void> {
    const user = this.currentUser || await firstValueFrom(this.user$.pipe(take(1)));
    if (!user) {
      this.authModal.open();
      return;
    }

    this.isSubscribingTeam = true;
    this.ctaError = null;

    this.stripeService.createTeamCheckoutSession(user.uid, user.email ?? '', this.selectedInterval).subscribe({
      next: (response) => {
        this.isSubscribingTeam = false;
        if (!response.success) {
          if (response.error === 'TEAM_PRICES_NOT_CONFIGURED') {
            // 503 — prices not configured yet; keep on-page with friendly message
            this.ctaError = response.message || 'Team plan coming online soon — contact us';
          } else {
            this.ctaError = response.message || response.error || 'Failed to start Team checkout';
          }
        }
        // On success the service either navigates (Checkout) or upgraded=true
        // — no additional action needed here
      },
      error: () => {
        this.isSubscribingTeam = false;
        this.ctaError = 'An error occurred. Please try again.';
      }
    });
  }

  /**
   * Open Stripe Customer Portal to manage / cancel an existing subscription.
   */
  manageSubscription(): void {
    if (this.currentUser) {
      this.stripeService.createPortalSession(this.currentUser.uid, this.currentUser.email ?? '').subscribe({
        next: (response) => {
          if (!response.success) {
            this.ctaError = response.error || 'Failed to open portal';
          }
        },
        error: () => { this.ctaError = 'An error occurred. Please try again.'; }
      });
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * CTA label helper for the Basic card — varies by current subscription tier.
   * Used in tests and can be used in templates if needed.
   */
  getBasicCtaLabel(status: SubscriptionStatus | null | undefined): string {
    if (!status?.active) return 'Subscribe Basic';
    if (this.isBasicSubscriber(status)) return 'Current plan';
    return 'Downgrade to Basic';
  }

  /**
   * CTA label helper for the Pro card.
   */
  getProCtaLabel(status: SubscriptionStatus | null | undefined): string {
    if (!status?.active) return 'Subscribe Pro';
    if (this.isProSubscriber(status)) return 'Current plan';
    if (this.isBasicSubscriber(status)) return 'Upgrade to Pro';
    return 'Downgrade to Pro';
  }

  /**
   * CTA label helper for the Team card.
   */
  getTeamCtaLabel(status: SubscriptionStatus | null | undefined): string {
    if (!status?.active) return 'Get Team Access';
    if (this.isTeamSubscriber(status)) return 'Current plan';
    return 'Upgrade to Team';
  }
}
