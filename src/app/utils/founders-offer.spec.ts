import {
  shouldShowFoundersOffer,
  resolveOfferProduct,
  effectiveOfferFromQuery,
  getOfferWeeklyPriceCents,
  getOfferPlanTitle,
  getOfferPriceLabel,
  getBillingFaqText,
  shouldRedirectToPricingAfterLogin,
  pricingCommandsForOffer,
  FOUNDERS_WEEKLY_CENTS,
  STANDARD_WEEKLY_CENTS
} from './founders-offer';

describe('founders-offer helpers', () => {
  describe('E — offer visibility', () => {
    it('E2: founder inactive shows founders offer ($10)', () => {
      const e = { isFounder: true, active: false };
      expect(shouldShowFoundersOffer(e)).toBe(true);
      expect(getOfferWeeklyPriceCents(e)).toBe(FOUNDERS_WEEKLY_CENTS);
      expect(getOfferPlanTitle(e)).toBe('Founders Rate');
      expect(getOfferPriceLabel(e)).toBe('$10 per week');
    });

    it('E3: non-founder shows standard $20', () => {
      const e = { isFounder: false, active: false };
      expect(shouldShowFoundersOffer(e)).toBe(false);
      expect(getOfferWeeklyPriceCents(e)).toBe(STANDARD_WEEKLY_CENTS);
      expect(getOfferPlanTitle(e)).toBe('Professional Plan');
      expect(getOfferPriceLabel(e)).toBe('$20 per week');
    });

    it('E4: logged-out-like eligibility (not founder) is $20', () => {
      const e = { isFounder: false, active: false };
      expect(getOfferWeeklyPriceCents(e)).toBe(2000);
    });

    it('E5: founder with active sub is subscribed product but keeps Founders Rate copy', () => {
      expect(resolveOfferProduct({ isFounder: true, active: true })).toBe('subscribed');
      expect(shouldShowFoundersOffer({ isFounder: true, active: true })).toBe(false);
      expect(getOfferPlanTitle({ isFounder: true, active: true })).toBe('Founders Rate');
      expect(getOfferPriceLabel({ isFounder: true, active: true })).toBe('$10 per week');
    });

    it('E7/E9: founder inactive/canceled-style inactive shows $10 for profile', () => {
      expect(getOfferPriceLabel({ isFounder: true, active: false })).toBe('$10 per week');
    });

    it('E8: non-founder profile price is $20 per week', () => {
      expect(getOfferPriceLabel({ isFounder: false, active: false })).toBe('$20 per week');
    });

    it('E10: active founder still sees Founders Rate in plan title', () => {
      expect(getOfferPlanTitle({ isFounder: true, active: true })).toBe('Founders Rate');
      expect(getOfferPlanTitle({ isFounder: true, active: false })).toBe('Founders Rate');
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
    it('billing FAQ uses $10 for founders and $20 for everyone else', () => {
      expect(getBillingFaqText({ isFounder: true, active: false })).toContain('$10');
      expect(getBillingFaqText({ isFounder: false, active: false })).toContain('$20');
    });
  });
});
