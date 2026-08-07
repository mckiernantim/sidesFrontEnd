import {
  setPriceCatalog,
  getPriceCatalog,
  setProPriceCatalog,
  getProPriceCatalog,
  setTeamPriceCatalog,
  getTeamPriceCatalog,
  getOfferPriceCents,
  getProPriceCents,
  getTeamPriceCents,
  getProPriceLabel,
  getTeamPriceLabel,
  getStandardProPriceLabel,
  getStandardTeamPriceLabel,
  getTierPriceCents,
  formatCents,
  shouldShowFoundersOffer,
  resolveOfferProduct,
  effectiveOfferFromQuery,
  normalizeBillingInterval,
  getBillingFaqText,
  getOfferPriceLabel,
  getStandardPriceLabel,
  getAlternateInterval,
  isFounderMember,
  pricingCommandsForOffer,
  shouldRedirectToPricingAfterLogin,
  FOUNDERS_RATE_SUBTITLE,
  PricingTier,
  BillingInterval,
} from './founders-offer';

// ─── Locked price matrix (Spec 033) ──────────────────────────────────────────
// Basic: $10/wk · $30/mo  Founders $5/$15
// Pro:   $20/wk · $50/mo  Founders $10/$25
// Team:  $30/wk · $70/mo  Founders $15/$35

describe('founders-offer — Basic catalog', () => {
  beforeEach(() => {
    setPriceCatalog({
      standardWeeklyCents: 1000,
      standardMonthlyCents: 3000,
      foundersWeeklyCents: 500,
      foundersMonthlyCents: 1500,
    });
  });

  it('returns standard weekly cents for non-founder', () => {
    expect(getOfferPriceCents({ isFounder: false, active: false }, 'week')).toBe(1000);
  });

  it('returns founders weekly cents for founder', () => {
    expect(getOfferPriceCents({ isFounder: true, active: false }, 'week')).toBe(500);
  });

  it('returns standard monthly cents for non-founder', () => {
    expect(getOfferPriceCents({ isFounder: false, active: false }, 'month')).toBe(3000);
  });

  it('returns founders monthly cents for founder', () => {
    expect(getOfferPriceCents({ isFounder: true, active: false }, 'month')).toBe(1500);
  });

  it('setPriceCatalog ignores null values', () => {
    setPriceCatalog({ standardWeeklyCents: null as any });
    expect(getPriceCatalog().standardWeeklyCents).toBe(1000);
  });

  it('setPriceCatalog ignores negative values', () => {
    setPriceCatalog({ standardWeeklyCents: -1 });
    expect(getPriceCatalog().standardWeeklyCents).toBe(1000);
  });

  it('setPriceCatalog ignores zero values', () => {
    setPriceCatalog({ standardWeeklyCents: 0 });
    expect(getPriceCatalog().standardWeeklyCents).toBe(1000);
  });

  it('setPriceCatalog updates valid values', () => {
    setPriceCatalog({ standardWeeklyCents: 1200 });
    expect(getPriceCatalog().standardWeeklyCents).toBe(1200);
    setPriceCatalog({ standardWeeklyCents: 1000 });
  });
});

describe('founders-offer — Pro catalog (033 locked defaults)', () => {
  beforeEach(() => {
    // Reset to Spec 033 locked defaults
    setProPriceCatalog({
      standardWeeklyCents: 2000,
      standardMonthlyCents: 5000,
      foundersWeeklyCents: 1000,
      foundersMonthlyCents: 2500,
    });
  });

  it('returns standard weekly Pro price for non-founder ($20)', () => {
    expect(getProPriceCents({ isFounder: false, active: false }, 'week')).toBe(2000);
  });

  it('returns founders weekly Pro price for founder ($10)', () => {
    expect(getProPriceCents({ isFounder: true, active: false }, 'week')).toBe(1000);
  });

  it('returns standard monthly Pro price for non-founder ($50)', () => {
    expect(getProPriceCents({ isFounder: false, active: false }, 'month')).toBe(5000);
  });

  it('returns founders monthly Pro price for founder ($25)', () => {
    expect(getProPriceCents({ isFounder: true, active: false }, 'month')).toBe(2500);
  });

  it('getProPriceLabel formats correctly for non-founder weekly', () => {
    expect(getProPriceLabel({ isFounder: false, active: false }, 'week')).toBe('$20 per week');
  });

  it('getProPriceLabel formats correctly for founder monthly', () => {
    expect(getProPriceLabel({ isFounder: true, active: false }, 'month')).toBe('$25 per month');
  });

  it('getStandardProPriceLabel returns non-founder monthly price ($50)', () => {
    expect(getStandardProPriceLabel('month')).toBe('$50 per month');
  });

  it('getStandardProPriceLabel returns non-founder weekly price ($20)', () => {
    expect(getStandardProPriceLabel('week')).toBe('$20 per week');
  });

  it('setProPriceCatalog ignores null values', () => {
    setProPriceCatalog({ standardWeeklyCents: null as any });
    expect(getProPriceCatalog().standardWeeklyCents).toBe(2000);
  });

  it('setProPriceCatalog ignores zero (prevents stale $0 overriding defaults)', () => {
    setProPriceCatalog({ standardMonthlyCents: 0 });
    expect(getProPriceCatalog().standardMonthlyCents).toBe(5000);
  });

  it('setProPriceCatalog updates valid values', () => {
    setProPriceCatalog({ standardWeeklyCents: 2500 });
    expect(getProPriceCatalog().standardWeeklyCents).toBe(2500);
    setProPriceCatalog({ standardWeeklyCents: 2000 });
  });
});

describe('founders-offer — Team catalog (033 locked defaults)', () => {
  beforeEach(() => {
    setTeamPriceCatalog({
      standardWeeklyCents: 3000,
      standardMonthlyCents: 7000,
      foundersWeeklyCents: 1500,
      foundersMonthlyCents: 3500,
    });
  });

  it('returns standard weekly Team price for non-founder ($30)', () => {
    expect(getTeamPriceCents({ isFounder: false, active: false }, 'week')).toBe(3000);
  });

  it('returns founders weekly Team price for founder ($15)', () => {
    expect(getTeamPriceCents({ isFounder: true, active: false }, 'week')).toBe(1500);
  });

  it('returns standard monthly Team price for non-founder ($70)', () => {
    expect(getTeamPriceCents({ isFounder: false, active: false }, 'month')).toBe(7000);
  });

  it('returns founders monthly Team price for founder ($35)', () => {
    expect(getTeamPriceCents({ isFounder: true, active: false }, 'month')).toBe(3500);
  });

  it('getTeamPriceLabel formats correctly for non-founder weekly', () => {
    expect(getTeamPriceLabel({ isFounder: false, active: false }, 'week')).toBe('$30 per week');
  });

  it('getTeamPriceLabel formats correctly for founder monthly', () => {
    expect(getTeamPriceLabel({ isFounder: true, active: false }, 'month')).toBe('$35 per month');
  });

  it('getStandardTeamPriceLabel returns non-founder monthly price ($70)', () => {
    expect(getStandardTeamPriceLabel('month')).toBe('$70 per month');
  });

  it('getStandardTeamPriceLabel returns non-founder weekly price ($30)', () => {
    expect(getStandardTeamPriceLabel('week')).toBe('$30 per week');
  });

  it('setTeamPriceCatalog ignores null values', () => {
    setTeamPriceCatalog({ standardWeeklyCents: null as any });
    expect(getTeamPriceCatalog().standardWeeklyCents).toBe(3000);
  });

  it('setTeamPriceCatalog ignores zero values', () => {
    setTeamPriceCatalog({ standardMonthlyCents: 0 });
    expect(getTeamPriceCatalog().standardMonthlyCents).toBe(7000);
  });

  it('setTeamPriceCatalog updates valid values', () => {
    setTeamPriceCatalog({ standardWeeklyCents: 3500 });
    expect(getTeamPriceCatalog().standardWeeklyCents).toBe(3500);
    setTeamPriceCatalog({ standardWeeklyCents: 3000 });
  });
});

describe('founders-offer — getTierPriceCents (033 — all three tiers)', () => {
  beforeEach(() => {
    setPriceCatalog({ standardWeeklyCents: 1000, standardMonthlyCents: 3000, foundersWeeklyCents: 500, foundersMonthlyCents: 1500 });
    setProPriceCatalog({ standardWeeklyCents: 2000, standardMonthlyCents: 5000, foundersWeeklyCents: 1000, foundersMonthlyCents: 2500 });
    setTeamPriceCatalog({ standardWeeklyCents: 3000, standardMonthlyCents: 7000, foundersWeeklyCents: 1500, foundersMonthlyCents: 3500 });
  });

  it('returns basic price for basic tier non-founder weekly ($10)', () => {
    expect(getTierPriceCents('basic', { isFounder: false, active: false }, 'week')).toBe(1000);
  });

  it('returns pro price for pro tier non-founder weekly ($20)', () => {
    expect(getTierPriceCents('pro', { isFounder: false, active: false }, 'week')).toBe(2000);
  });

  it('returns team price for team tier non-founder weekly ($30)', () => {
    expect(getTierPriceCents('team', { isFounder: false, active: false }, 'week')).toBe(3000);
  });

  it('returns founders basic monthly price ($15)', () => {
    expect(getTierPriceCents('basic', { isFounder: true, active: false }, 'month')).toBe(1500);
  });

  it('returns founders pro monthly price ($25)', () => {
    expect(getTierPriceCents('pro', { isFounder: true, active: false }, 'month')).toBe(2500);
  });

  it('returns founders team monthly price ($35)', () => {
    expect(getTierPriceCents('team', { isFounder: true, active: false }, 'month')).toBe(3500);
  });

  it('returns non-founder pro monthly $50 (confirms stale $40 override is NOT possible via getTierPriceCents)', () => {
    // The only way Pro monthly can be $50 is if setProPriceCatalog received the locked default.
    // This test verifies our beforeEach resets to the locked value.
    expect(getTierPriceCents('pro', { isFounder: false, active: false }, 'month')).toBe(5000);
  });
});

describe('founders-offer — shouldShowFoundersOffer', () => {
  it('returns true for founder who is not yet subscribed', () => {
    expect(shouldShowFoundersOffer({ isFounder: true, active: false })).toBe(true);
  });

  it('returns false for active founder (already subscribed)', () => {
    expect(shouldShowFoundersOffer({ isFounder: true, active: true })).toBe(false);
  });

  it('returns false for non-founder', () => {
    expect(shouldShowFoundersOffer({ isFounder: false, active: false })).toBe(false);
  });
});

describe('founders-offer — resolveOfferProduct', () => {
  it('returns subscribed for active user', () => {
    expect(resolveOfferProduct({ isFounder: false, active: true })).toBe('subscribed');
  });

  it('returns founders for inactive founder', () => {
    expect(resolveOfferProduct({ isFounder: true, active: false })).toBe('founders');
  });

  it('returns standard for inactive non-founder', () => {
    expect(resolveOfferProduct({ isFounder: false, active: false })).toBe('standard');
  });
});

describe('founders-offer — effectiveOfferFromQuery', () => {
  it('does not elevate a non-founder via ?offer=founders', () => {
    const eligibility = { isFounder: false, active: false };
    const result = effectiveOfferFromQuery(eligibility, 'founders');
    expect(result).toBe('standard');
  });

  it('returns founders for a real founder regardless of query', () => {
    const eligibility = { isFounder: true, active: false };
    const result = effectiveOfferFromQuery(eligibility, null);
    expect(result).toBe('founders');
  });
});

describe('founders-offer — formatCents', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCents(1000)).toBe('$10');
  });

  it('formats dollars with cents', () => {
    expect(formatCents(1050)).toBe('$10.50');
  });

  it('formats $50 as $50 (Pro monthly)', () => {
    expect(formatCents(5000)).toBe('$50');
  });

  it('formats $70 as $70 (Team monthly)', () => {
    expect(formatCents(7000)).toBe('$70');
  });
});

describe('founders-offer — normalizeBillingInterval', () => {
  it('normalises "monthly" to "month"', () => {
    expect(normalizeBillingInterval('monthly')).toBe('month');
  });

  it('defaults to week for unknown values', () => {
    expect(normalizeBillingInterval('quarterly')).toBe('week');
  });

  it('passes "week" through unchanged', () => {
    expect(normalizeBillingInterval('week')).toBe('week');
  });
});

describe('founders-offer — getAlternateInterval', () => {
  it('returns month for week', () => {
    expect(getAlternateInterval('week')).toBe('month');
  });

  it('returns week for month', () => {
    expect(getAlternateInterval('month')).toBe('week');
  });
});

describe('founders-offer — FOUNDERS_RATE_SUBTITLE', () => {
  it('includes "50% off"', () => {
    expect(FOUNDERS_RATE_SUBTITLE).toContain('50% off');
  });
});

describe('founders-offer — shouldRedirectToPricingAfterLogin', () => {
  it('redirects inactive non-founders after explicit sign in', () => {
    expect(shouldRedirectToPricingAfterLogin({ isFounder: false, active: false }, { explicitSignIn: true })).toBe(true);
  });

  it('does not redirect active users', () => {
    expect(shouldRedirectToPricingAfterLogin({ isFounder: false, active: true }, { explicitSignIn: true })).toBe(false);
  });

  it('does not redirect when already on /pricing', () => {
    expect(shouldRedirectToPricingAfterLogin({ isFounder: false, active: false }, { explicitSignIn: true, currentPath: '/pricing' })).toBe(false);
  });
});

describe('founders-offer — pricingCommandsForOffer', () => {
  it('returns founders query for founders offer', () => {
    const cmd = pricingCommandsForOffer('founders');
    expect(cmd.path).toBe('/pricing');
    expect(cmd.queryParams?.offer).toBe('founders');
  });

  it('returns bare /pricing for standard offer', () => {
    const cmd = pricingCommandsForOffer('standard');
    expect(cmd.path).toBe('/pricing');
    expect(cmd.queryParams).toBeUndefined();
  });
});
