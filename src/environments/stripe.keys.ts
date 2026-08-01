/**
 * Stripe publishable keys + go-live switch.
 *
 * Flip STRIPE_IS_LIVE to true when ready to process real card payments.
 * - false → pk_test_… (safe; no real charges)
 * - true  → pk_live_… (pairs with sk_live_ on Heroku sides3)
 *
 * Publishable keys are safe in the browser. Never put sk_ secret keys here.
 */

/** Master switch — set true only when you intend to take live payments. */
export const STRIPE_IS_LIVE = true;

export const STRIPE_PUBLISHABLE_TEST =
  'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ';

export const STRIPE_PUBLISHABLE_LIVE =
  'pk_live_51IEIywBojwZRnVT4M5fK3YxRsaWi7icPS2QIycwt7kjHVHUbt0vIfWj36vq8wbj7QSR7nGNpuI8HBPb7bQ5NLvJy00LnOGJ2ZC';

export function resolveStripePublishableKey(isLive: boolean = STRIPE_IS_LIVE): string {
  return isLive ? STRIPE_PUBLISHABLE_LIVE : STRIPE_PUBLISHABLE_TEST;
}
