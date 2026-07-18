/**
 * Founders Rate display + routing helpers (UX only).
 * Stripe Price ID selection remains server-side.
 */

export type OfferProduct = 'founders' | 'standard' | 'subscribed';
export type BillingInterval = 'week' | 'month';

export interface FounderEligibility {
  isFounder: boolean;
  active: boolean;
}

/** Standard catalog + Founders at exactly 50% off. */
export const STANDARD_WEEKLY_CENTS = 2000; // $20/week
export const STANDARD_MONTHLY_CENTS = 6000; // $60/month
export const FOUNDERS_WEEKLY_CENTS = 1000; // $10/week = 50% of $20
export const FOUNDERS_MONTHLY_CENTS = 3000; // $30/month = 50% of $60

/** Consistent copy for Founder members (nav badge, profile tag, plan titles). */
export const FOUNDERS_MEMBER_TAG = 'Founder';
export const FOUNDERS_RATE_LABEL = 'Founders Rate';
export const FOUNDERS_RATE_SUBTITLE = 'Founders Rate — 50% off for life';

export function isFounderMember(eligibility: Pick<FounderEligibility, 'isFounder'>): boolean {
  return Boolean(eligibility?.isFounder);
}

export function shouldShowFoundersOffer(eligibility: FounderEligibility): boolean {
  return Boolean(eligibility?.isFounder) && !eligibility?.active;
}

export function resolveOfferProduct(eligibility: FounderEligibility): OfferProduct {
  if (eligibility?.active) {
    return 'subscribed';
  }
  if (eligibility?.isFounder) {
    return 'founders';
  }
  return 'standard';
}

/** Query param is display-only; never trust it over isFounder. */
export function effectiveOfferFromQuery(
  eligibility: FounderEligibility,
  offerQuery: string | null | undefined
): OfferProduct {
  const resolved = resolveOfferProduct(eligibility);
  if (resolved !== 'standard') {
    return resolved;
  }
  // Forged ?offer=founders must not elevate a non-founder
  if (offerQuery === 'founders' && !eligibility.isFounder) {
    return 'standard';
  }
  return resolved;
}

export function normalizeBillingInterval(interval: string | null | undefined): BillingInterval {
  if (interval === 'month' || interval === 'monthly') {
    return 'month';
  }
  return 'week';
}

/** Display price cents for a given interval (Founders always 50% off). */
export function getOfferPriceCents(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): number {
  if (interval === 'month') {
    return isFounderMember(eligibility) ? FOUNDERS_MONTHLY_CENTS : STANDARD_MONTHLY_CENTS;
  }
  return isFounderMember(eligibility) ? FOUNDERS_WEEKLY_CENTS : STANDARD_WEEKLY_CENTS;
}

/** @deprecated Prefer getOfferPriceCents(eligibility, 'week') */
export function getOfferWeeklyPriceCents(eligibility: FounderEligibility): number {
  return getOfferPriceCents(eligibility, 'week');
}

export function getOfferPlanTitle(eligibility: FounderEligibility): string {
  return isFounderMember(eligibility) ? FOUNDERS_RATE_LABEL : 'Professional Plan';
}

export function getOfferPriceLabel(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): string {
  const dollars = getOfferPriceCents(eligibility, interval) / 100;
  return interval === 'month' ? `$${dollars} per month` : `$${dollars} per week`;
}

export function getStandardPriceLabel(interval: BillingInterval): string {
  const dollars = (interval === 'month' ? STANDARD_MONTHLY_CENTS : STANDARD_WEEKLY_CENTS) / 100;
  return interval === 'month' ? `$${dollars} per month` : `$${dollars} per week`;
}

export function getAlternateInterval(interval: BillingInterval): BillingInterval {
  return interval === 'month' ? 'week' : 'month';
}

export function getBillingFaqText(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): string {
  const amount = interval === 'month'
    ? (isFounderMember(eligibility) ? '$30' : '$60')
    : (isFounderMember(eligibility) ? '$10' : '$20');
  const cadence = interval === 'month' ? 'month' : 'week';
  return `You'll be charged ${amount} every ${cadence} until you cancel. Your subscription will automatically renew each ${cadence}.`;
}

/**
 * Whether post-login should navigate to pricing for an offer.
 * Active users / mid-app reloads should not be hijacked.
 */
export function shouldRedirectToPricingAfterLogin(
  eligibility: FounderEligibility,
  options: { explicitSignIn: boolean; currentPath?: string } = { explicitSignIn: true }
): boolean {
  if (!options.explicitSignIn) {
    return false;
  }
  if (eligibility.active) {
    return false;
  }
  const path = options.currentPath || '';
  // Already on pricing — no need to re-navigate (caller may still set query)
  if (path.startsWith('/pricing')) {
    return false;
  }
  return true;
}

export function pricingCommandsForOffer(offer: OfferProduct): { path: string; queryParams?: { offer: string } } {
  if (offer === 'founders') {
    return { path: '/pricing', queryParams: { offer: 'founders' } };
  }
  return { path: '/pricing' };
}
