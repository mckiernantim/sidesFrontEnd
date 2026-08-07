/**
 * Founders Rate display + routing helpers (UX only).
 * Stripe Price ID selection remains server-side.
 *
 * Locked price matrix (033, Aug 2026):
 *   Basic:  $10/wk · $30/mo  — Founders $5/$15
 *   Pro:    $20/wk · $50/mo  — Founders $10/$25
 *   Team:   $30/wk · $70/mo  — Founders $15/$35
 *
 * The per-tier catalogs are hydrated from GET /stripe/prices at bootstrap.
 * Pro/Team amounts are ONLY updated when the explicit pro- or team-prefixed
 * keys are present in the response.  Legacy schedulingWeekly aliases are
 * intentionally ignored for display so a stale Stripe catalog (e.g. the old
 * $40 Pro month price) can never override the locked defaults listed above.
 */

export type OfferProduct = 'founders' | 'standard' | 'subscribed';
export type BillingInterval = 'week' | 'month';
/** The UI tier a user is viewing or subscribing to. */
export type PricingTier = 'basic' | 'pro' | 'team';

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

/** Pro tier display prices — only updated via setProPriceCatalog with pro* keys. */
export interface ProPriceCatalog {
  standardWeeklyCents: number;
  standardMonthlyCents: number;
  foundersWeeklyCents: number;
  foundersMonthlyCents: number;
}

/** Team tier display prices — only updated via setTeamPriceCatalog with team* keys. */
export interface TeamPriceCatalog {
  standardWeeklyCents: number;
  standardMonthlyCents: number;
  foundersWeeklyCents: number;
  foundersMonthlyCents: number;
}

/**
 * Basic plan prices — hydrated at bootstrap from GET /stripe/prices.
 * Defaults: $10/wk · $30/mo; Founders 50% off ($5/$15).
 */
const priceCatalog: PriceCatalog = {
  standardWeeklyCents: 1000,
  standardMonthlyCents: 3000,
  foundersWeeklyCents: 500,
  foundersMonthlyCents: 1500
};

/**
 * Pro plan prices — locked defaults $20/wk · $50/mo; Founders $10/$25.
 * Only overwritten when explicit pro* keys are returned from /stripe/prices.
 */
const proPriceCatalog: ProPriceCatalog = {
  standardWeeklyCents: 2000,
  standardMonthlyCents: 5000,
  foundersWeeklyCents: 1000,
  foundersMonthlyCents: 2500
};

/**
 * Team plan prices — locked defaults $30/wk · $70/mo; Founders $15/$35.
 * Only overwritten when explicit team* keys are returned from /stripe/prices.
 */
const teamPriceCatalog: TeamPriceCatalog = {
  standardWeeklyCents: 3000,
  standardMonthlyCents: 7000,
  foundersWeeklyCents: 1500,
  foundersMonthlyCents: 3500
};

// ─── Catalog setters / getters ─────────────────────────────────────────────

/** Ignores null/negative amounts so a partial Stripe response can't zero the UI. */
export function setPriceCatalog(next: Partial<PriceCatalog> | null | undefined): void {
  if (!next) return;
  (Object.keys(priceCatalog) as Array<keyof PriceCatalog>).forEach(key => {
    const amount = next[key];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      priceCatalog[key] = amount;
    }
  });
}

export function getPriceCatalog(): PriceCatalog {
  return { ...priceCatalog };
}

/**
 * Set Pro tier prices from live catalog.
 * Only call this when the response includes explicit pro* keys — do NOT pass
 * legacy schedulingWeekly values here so stale amounts can never replace
 * the locked defaults.
 */
export function setProPriceCatalog(next: Partial<ProPriceCatalog> | null | undefined): void {
  if (!next) return;
  (Object.keys(proPriceCatalog) as Array<keyof ProPriceCatalog>).forEach(key => {
    const amount = next[key];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      proPriceCatalog[key] = amount;
    }
  });
}

export function getProPriceCatalog(): ProPriceCatalog {
  return { ...proPriceCatalog };
}

/** Set Team tier prices from live catalog (team* keys only). */
export function setTeamPriceCatalog(next: Partial<TeamPriceCatalog> | null | undefined): void {
  if (!next) return;
  (Object.keys(teamPriceCatalog) as Array<keyof TeamPriceCatalog>).forEach(key => {
    const amount = next[key];
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      teamPriceCatalog[key] = amount;
    }
  });
}

export function getTeamPriceCatalog(): TeamPriceCatalog {
  return { ...teamPriceCatalog };
}

// ─── Price helpers ─────────────────────────────────────────────────────────

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

// ─── Basic tier ────────────────────────────────────────────────────────────

/** Display price cents for Basic (Founders always 50% off). */
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

// ─── Pro tier ──────────────────────────────────────────────────────────────

/** Display price cents for the Pro tier. */
export function getProPriceCents(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): number {
  if (interval === 'month') {
    return isFounderMember(eligibility)
      ? proPriceCatalog.foundersMonthlyCents
      : proPriceCatalog.standardMonthlyCents;
  }
  return isFounderMember(eligibility)
    ? proPriceCatalog.foundersWeeklyCents
    : proPriceCatalog.standardWeeklyCents;
}

/** Formatted price label for the Pro tier. */
export function getProPriceLabel(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): string {
  const amount = formatCents(getProPriceCents(eligibility, interval));
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

/** Standard (non-founder) Pro price label for strikethrough display. */
export function getStandardProPriceLabel(interval: BillingInterval): string {
  const amount = formatCents(
    interval === 'month' ? proPriceCatalog.standardMonthlyCents : proPriceCatalog.standardWeeklyCents
  );
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

// ─── Team tier ─────────────────────────────────────────────────────────────

/** Display price cents for the Team tier. */
export function getTeamPriceCents(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): number {
  if (interval === 'month') {
    return isFounderMember(eligibility)
      ? teamPriceCatalog.foundersMonthlyCents
      : teamPriceCatalog.standardMonthlyCents;
  }
  return isFounderMember(eligibility)
    ? teamPriceCatalog.foundersWeeklyCents
    : teamPriceCatalog.standardWeeklyCents;
}

/** Formatted price label for the Team tier. */
export function getTeamPriceLabel(
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): string {
  const amount = formatCents(getTeamPriceCents(eligibility, interval));
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

/** Standard (non-founder) Team price label for strikethrough display. */
export function getStandardTeamPriceLabel(interval: BillingInterval): string {
  const amount = formatCents(
    interval === 'month' ? teamPriceCatalog.standardMonthlyCents : teamPriceCatalog.standardWeeklyCents
  );
  return interval === 'month' ? `${amount} per month` : `${amount} per week`;
}

// ─── Cross-tier ────────────────────────────────────────────────────────────

/** Get price cents for a specific tier and interval. */
export function getTierPriceCents(
  tier: PricingTier,
  eligibility: FounderEligibility,
  interval: BillingInterval = 'week'
): number {
  if (tier === 'pro') return getProPriceCents(eligibility, interval);
  if (tier === 'team') return getTeamPriceCents(eligibility, interval);
  return getOfferPriceCents(eligibility, interval);
}

// ─── Other helpers ─────────────────────────────────────────────────────────

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
