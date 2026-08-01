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

export interface PriceCatalog {
  standardWeeklyCents: number;
  standardMonthlyCents: number;
  foundersWeeklyCents: number;
  foundersMonthlyCents: number;
}

/**
 * Advertised amounts, hydrated at bootstrap from GET /stripe/prices so displayed
 * pricing tracks the live Stripe catalog. Defaults mirror the current live
 * catalog and are only used if that request fails.
 */
const priceCatalog: PriceCatalog = {
  standardWeeklyCents: 1000,
  standardMonthlyCents: 3000,
  foundersWeeklyCents: 500,
  foundersMonthlyCents: 1500
};

/** Ignores null/negative amounts so a partial Stripe response can't zero the UI. */
export function setPriceCatalog(next: Partial<PriceCatalog> | null | undefined): void {
  if (!next) return;
  (Object.keys(priceCatalog) as Array<keyof PriceCatalog>).forEach(key => {
    const amount = next[key];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) {
      priceCatalog[key] = amount;
    }
  });
}

export function getPriceCatalog(): PriceCatalog {
  return { ...priceCatalog };
}

export function formatCents(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

/** Always two decimals — legal copy should read "$10.00", never "$10". */
export function formatCentsPrecise(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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
    return isFounderMember(eligibility)
      ? priceCatalog.foundersMonthlyCents
      : priceCatalog.standardMonthlyCents;
  }
  return isFounderMember(eligibility)
    ? priceCatalog.foundersWeeklyCents
    : priceCatalog.standardWeeklyCents;
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
  const amount = formatCents(getOfferPriceCents(eligibility, interval));
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

export function getStandardPriceLabel(interval: BillingInterval): string {
  const amount = formatCents(
    interval === 'month' ? priceCatalog.standardMonthlyCents : priceCatalog.standardWeeklyCents
  );
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

export function getAlternateInterval(interval: BillingInterval): BillingInterval {
  return interval === 'month' ? 'week' : 'month';
}

export function getBillingFaqText(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): string {
  const amount = formatCents(getOfferPriceCents(eligibility, interval));
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
