import {
  STRIPE_IS_LIVE,
  STRIPE_PUBLISHABLE_LIVE,
  STRIPE_PUBLISHABLE_TEST,
  resolveStripePublishableKey
} from './stripe.keys';

describe('stripe.keys go-live switch', () => {
  it('defaults to test mode (isLive false)', () => {
    expect(STRIPE_IS_LIVE).toBe(false);
  });

  it('resolveStripePublishableKey(false) returns test publishable key', () => {
    const key = resolveStripePublishableKey(false);
    expect(key).toBe(STRIPE_PUBLISHABLE_TEST);
    expect(key.startsWith('pk_test_')).toBe(true);
  });

  it('resolveStripePublishableKey(true) returns live publishable key', () => {
    const key = resolveStripePublishableKey(true);
    expect(key).toBe(STRIPE_PUBLISHABLE_LIVE);
    expect(key.startsWith('pk_live_')).toBe(true);
  });

  it('default resolve matches STRIPE_IS_LIVE', () => {
    expect(resolveStripePublishableKey()).toBe(
      STRIPE_IS_LIVE ? STRIPE_PUBLISHABLE_LIVE : STRIPE_PUBLISHABLE_TEST
    );
  });
});
