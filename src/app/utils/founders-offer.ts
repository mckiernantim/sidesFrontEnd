/**
 * Founders Rate display + routing helpers (UX only).
 * Stripe Price ID selection remains server-side.
 */

export type OfferProduct = 'founders' | 'standard' | 'subscribed';

export interface FounderEligibility {
  isFounder: boolean;
  active: boolean;
}

export const FOUNDERS_WEEKLY_CENTS = 1000;
export const STANDARD_WEEKLY_CENTS = 2000;

/** Consistent copy for Founder members (nav badge, profile tag, plan titles). */
export const FOUNDERS_MEMBER_TAG = 'Founder';
export const FOUNDERS_RATE_LABEL = 'Founders Rate';
export const FOUNDERS_RATE_SUBTITLE = 'Founders Rate — 50% off';

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

/** Display price for Founders (even when subscribed) — their rate is always $10. */
export function getOfferWeeklyPriceCents(eligibility: FounderEligibility): number {
  return isFounderMember(eligibility) ? FOUNDERS_WEEKLY_CENTS : STANDARD_WEEKLY_CENTS;
}

export function getOfferPlanTitle(eligibility: FounderEligibility): string {
  return isFounderMember(eligibility) ? FOUNDERS_RATE_LABEL : 'Professional Plan';
}

export function getOfferPriceLabel(eligibility: FounderEligibility): string {
  const dollars = getOfferWeeklyPriceCents(eligibility) / 100;
  return `$${dollars} per week`;
}

export function getBillingFaqText(eligibility: FounderEligibility): string {
  const amount = isFounderMember(eligibility) ? '$10' : '$20';
  return `You'll be charged ${amount} every week until you cancel. Your subscription will automatically renew each week.`;
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
