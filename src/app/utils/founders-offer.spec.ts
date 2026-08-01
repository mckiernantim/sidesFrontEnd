import {
  shouldShowFoundersOffer,
  resolveOfferProduct,
  effectiveOfferFromQuery,
  getOfferWeeklyPriceCents,
  getOfferPriceCents,
  getOfferPlanTitle,
  getOfferPriceLabel,
  getBillingFaqText,
  shouldRedirectToPricingAfterLogin,
  pricingCommandsForOffer,
  getPriceCatalog,
  setPriceCatalog,
  PriceCatalog
} from './founders-offer';

describe('founders-offer helpers', () => {
  let originalCatalog: PriceCatalog;

  beforeEach(() => {
    originalCatalog = getPriceCatalog();
  });

  // Catalog is module-level mutable state; restore so hydration tests don't leak
  afterEach(() => {
    setPriceCatalog(originalCatalog);
  });

  describe('E — offer visibility', () => {
    it('E2: founder inactive shows founders offer ($5)', () => {
      const e = { isFounder: true, active: false };
      expect(shouldShowFoundersOffer(e)).toBe(true);
      expect(getOfferWeeklyPriceCents(e)).toBe(getPriceCatalog().foundersWeeklyCents);
      expect(getOfferPlanTitle(e)).toBe('Founders Rate');
      expect(getOfferPriceLabel(e)).toBe('$5 per week');
    });

    it('E3: non-founder shows standard $10', () => {
      const e = { isFounder: false, active: false };
      expect(shouldShowFoundersOffer(e)).toBe(false);
      expect(getOfferWeeklyPriceCents(e)).toBe(getPriceCatalog().standardWeeklyCents);
      expect(getOfferPlanTitle(e)).toBe('Professional Plan');
      expect(getOfferPriceLabel(e)).toBe('$10 per week');
    });

    it('E4: logged-out-like eligibility (not founder) is $10', () => {
      const e = { isFounder: false, active: false };
      expect(getOfferWeeklyPriceCents(e)).toBe(1000);
    });

    it('E5: founder with active sub is subscribed product but keeps Founders Rate copy', () => {
      expect(resolveOfferProduct({ isFounder: true, active: true })).toBe('subscribed');
      expect(shouldShowFoundersOffer({ isFounder: true, active: true })).toBe(false);
      expect(getOfferPlanTitle({ isFounder: true, active: true })).toBe('Founders Rate');
      expect(getOfferPriceLabel({ isFounder: true, active: true })).toBe('$5 per week');
    });

    it('E7/E9: founder inactive/canceled-style inactive shows $5 for profile', () => {
      expect(getOfferPriceLabel({ isFounder: true, active: false })).toBe('$5 per week');
    });

    it('E8: non-founder profile price is $10 per week', () => {
      expect(getOfferPriceLabel({ isFounder: false, active: false })).toBe('$10 per week');
    });

    it('E10: active founder still sees Founders Rate in plan title', () => {
      expect(getOfferPlanTitle({ isFounder: true, active: true })).toBe('Founders Rate');
      expect(getOfferPlanTitle({ isFounder: true, active: false })).toBe('Founders Rate');
    });

    it('E11: monthly prices are $30 standard / $15 founders', () => {
      const catalog = getPriceCatalog();
      expect(getOfferPriceCents({ isFounder: false, active: false }, 'month')).toBe(catalog.standardMonthlyCents);
      expect(getOfferPriceCents({ isFounder: true, active: false }, 'month')).toBe(catalog.foundersMonthlyCents);
      expect(getOfferPriceLabel({ isFounder: true, active: false }, 'month')).toBe('$15 per month');
      expect(getOfferPriceLabel({ isFounder: false, active: false }, 'month')).toBe('$30 per month');
    });
  });

  describe('G — login routing', () => {
    it('G2: founder inactive redirects to pricing with founders query', () => {
      const offer = resolveOfferProduct({ isFounder: true, active: false });
      expect(offer).toBe('founders');
      expect(pricingCommandsForOffer(offer)).toEqual({
        path: '/pricing',
        queryParams: { offer: 'founders' }
      });
      expect(
        shouldRedirectToPricingAfterLogin(
          { isFounder: true, active: false },
          { explicitSignIn: true, currentPath: '/landing' }
        )
      ).toBe(true);
    });

    it('G3: non-founder inactive redirects to standard pricing', () => {
      const offer = resolveOfferProduct({ isFounder: false, active: false });
      expect(offer).toBe('standard');
      expect(pricingCommandsForOffer(offer)).toEqual({ path: '/pricing' });
    });

    it('G4: active subscriber does not force pricing redirect', () => {
      expect(
        shouldRedirectToPricingAfterLogin(
          { isFounder: true, active: true },
          { explicitSignIn: true, currentPath: '/upload' }
        )
      ).toBe(false);
    });

    it('G5: page reload (not explicit sign-in) does not force redirect', () => {
      expect(
        shouldRedirectToPricingAfterLogin(
          { isFounder: true, active: false },
          { explicitSignIn: false, currentPath: '/dashboard' }
        )
      ).toBe(false);
    });

    it('G6: forged ?offer=founders for non-founder stays standard', () => {
      expect(
        effectiveOfferFromQuery({ isFounder: false, active: false }, 'founders')
      ).toBe('standard');
    });

    it('G7: founders offer path does not embed a client priceId', () => {
      const cmd = pricingCommandsForOffer('founders');
      expect(JSON.stringify(cmd)).not.toContain('price_');
      expect((cmd as any).priceId).toBeUndefined();
    });
  });

  describe('copy', () => {
    it('billing FAQ uses $5 for founders and $10 for everyone else', () => {
      expect(getBillingFaqText({ isFounder: true, active: false })).toContain('$5');
      expect(getBillingFaqText({ isFounder: false, active: false })).toContain('$10');
    });

    it('defaults mirror the live Stripe catalog and keep Founders at 50%', () => {
      const catalog = getPriceCatalog();
      expect(catalog.standardWeeklyCents).toBe(1000);
      expect(catalog.standardMonthlyCents).toBe(3000);
      expect(catalog.foundersWeeklyCents * 2).toBe(catalog.standardWeeklyCents);
      expect(catalog.foundersMonthlyCents * 2).toBe(catalog.standardMonthlyCents);
    });
  });

  describe('price catalog hydration', () => {
    it('adopts amounts pushed from the backend', () => {
      setPriceCatalog({ standardWeeklyCents: 2000, foundersWeeklyCents: 1000 });
      expect(getOfferPriceLabel({ isFounder: false, active: false })).toBe('$20 per week');
      expect(getOfferPriceLabel({ isFounder: true, active: false })).toBe('$10 per week');
    });

    it('ignores null, negative, and missing amounts so a partial response cannot zero the UI', () => {
      const before = getPriceCatalog();
      setPriceCatalog({
        standardWeeklyCents: undefined,
        standardMonthlyCents: -100,
        foundersWeeklyCents: null as unknown as number
      });
      expect(getPriceCatalog()).toEqual(before);
    });

    it('tolerates a null payload entirely', () => {
      const before = getPriceCatalog();
      setPriceCatalog(null);
      expect(getPriceCatalog()).toEqual(before);
    });

    it('renders non-round amounts with cents', () => {
      setPriceCatalog({ standardWeeklyCents: 1250 });
      expect(getOfferPriceLabel({ isFounder: false, active: false })).toBe('$12.50 per week');
    });
  });
});
