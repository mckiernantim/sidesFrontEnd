import {
  STRIPE_IS_LIVE,
  STRIPE_PUBLISHABLE_LIVE,
  STRIPE_PUBLISHABLE_TEST,
  resolveStripePublishableKey
} from './stripe.keys';

/**
 * Production build env.
 *
 * Flip STRIPE_IS_LIVE in stripe.keys.ts to true when ready for real payments.
 * Until then isLive stays false → pk_test_ (no real charges from the browser).
 */
export const environment = {
  production: true,
  /** false = test Stripe; true = Live Stripe (real money). Controlled by stripe.keys.ts */
  isLive: STRIPE_IS_LIVE,
  stripeTest: STRIPE_PUBLISHABLE_TEST,
  stripeLive: STRIPE_PUBLISHABLE_LIVE,
  stripe: resolveStripePublishableKey(STRIPE_IS_LIVE),

  firebaseConfig: {
    apiKey: "AIzaSyBXD5kQfAS4lrmSJxYAuEUq8sxvXgWmCio",
    authDomain: "scriptthing.firebaseapp.com",
    databaseURL: "https://scriptthing.firebaseio.com",
    projectId: "scriptthing",
    storageBucket: "scriptthing.firebasestorage.app",
    messagingSenderId: "195325163986",
    appId: "1:195325163986:web:e7a70646f087850353300b",
    measurementId: "G-XM3P84P6N7"
  },
  url: 'https://sides3.herokuapp.com',

  // DEV SET UP
  // firebaseConfig: {
  //   apiKey: "AIzaSyCr0Gemya880xoOnAYWtTcZWssg5Uc2HY0",
  //   authDomain: "scriptthing-dev.firebaseapp.com",
  //   projectId: "scriptthing-dev",
  //   storageBucket: "scriptthing-dev.firebasestorage.app",
  //   messagingSenderId: "401150394674",
  //   appId: "1:401150394674:web:760ffe3a546b2d01a8d72b",
  //   measurementId: "G-1JF7DG5L5H"
  // },
  // url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com',
  password: "NOTEWORTHY",
  maintenanceMode: false
};

export const environmentProd = environment;

// Helper function to get the right environment
export function getConfig(isProd = false) {
  // Check if we're on the dev staging URL
  if (typeof window !== 'undefined' && window.location.hostname === 'scriptthing-dev.web.app') {
    return {
      ...environment,
      isLive: STRIPE_IS_LIVE,
      stripeTest: STRIPE_PUBLISHABLE_TEST,
      stripeLive: STRIPE_PUBLISHABLE_LIVE,
      stripe: resolveStripePublishableKey(STRIPE_IS_LIVE),
      firebaseConfig: {
        apiKey: "AIzaSyCr0Gemya880xoOnAYWtTcZWssg5Uc2HY0",
        authDomain: "scriptthing-dev.firebaseapp.com",
        projectId: "scriptthing-dev",
        storageBucket: "scriptthing-dev.firebasestorage.app",
        messagingSenderId: "401150394674",
        appId: "1:401150394674:web:760ffe3a546b2d01a8d72b",
        measurementId: "G-1JF7DG5L5H"
      },
      url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com'
    };
  }

  // PRODUCTION CONFIG (default) — Stripe mode still gated by STRIPE_IS_LIVE
  return {
    ...environment,
    isLive: STRIPE_IS_LIVE,
    stripe: resolveStripePublishableKey(STRIPE_IS_LIVE)
  };
}
