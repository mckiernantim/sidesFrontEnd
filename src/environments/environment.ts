// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {
  STRIPE_IS_LIVE,
  STRIPE_PUBLISHABLE_LIVE,
  STRIPE_PUBLISHABLE_TEST,
  resolveStripePublishableKey
} from './stripe.keys';

// Base development configuration
const devFirebaseConfig = {
  apiKey: "AIzaSyCr0Gemya880xoOnAYWtTcZWssg5Uc2HY0",
  authDomain: "scriptthing-dev.firebaseapp.com",
  projectId: "scriptthing-dev",
  storageBucket: "scriptthing-dev.firebasestorage.app",
  messagingSenderId: "401150394674",
  appId: "1:401150394674:web:760ffe3a546b2d01a8d72b",
  measurementId: "G-1JF7DG5L5H"
};

const prodFirebaseConfig = {
  apiKey: "AIzaSyBXD5kQfAS4lrmSJxYAuEUq8sxvXgWmCio",
  authDomain: "scriptthing.firebaseapp.com",
  databaseURL: "https://scriptthing.firebaseio.com",
  projectId: "scriptthing",
  storageBucket: "scriptthing.firebasestorage.app",
  messagingSenderId: "195325163986",
  appId: "1:195325163986:web:e7a70646f087850353300b",
  measurementId: "G-XM3P84P6N7"
};

/** Apply isLive → correct publishable key (never trust a stale stripe field). */
function withStripeMode<T extends { isLive?: boolean }>(config: T) {
  const isLive = Boolean(config.isLive);
  return {
    ...config,
    isLive,
    stripeTest: STRIPE_PUBLISHABLE_TEST,
    stripeLive: STRIPE_PUBLISHABLE_LIVE,
    stripe: resolveStripePublishableKey(isLive)
  };
}

// For development — isLive comes from stripe.keys.ts (false until go-live)
export const environment = withStripeMode({
  production: false,
  isLive: STRIPE_IS_LIVE,
  firebaseConfig: devFirebaseConfig,
  url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com',
  password: "NOTEWORTHY",
  maintenanceMode: false
});

// Fallback for production build (used by environment.prod.ts if not properly loaded)
export const environmentProd = withStripeMode({
  production: true,
  isLive: STRIPE_IS_LIVE,
  firebaseConfig: prodFirebaseConfig,
  url: 'https://sides3.herokuapp.com',
  password: "NOTEWORTHY",
  maintenanceMode: false
});

/**
 * Dynamic configuration helper
 * Automatically detects environment and returns appropriate config
 *
 * Environment Detection:
 * - localhost / 127.0.0.1 -> DEV Firebase + backend at same host:8080
 * - scriptthing-dev.web.app -> DEV Firebase + DEV Heroku backend
 * - scriptthing.web.app -> PROD Firebase + PROD Heroku backend
 *
 * Stripe mode is controlled ONLY by isLive / STRIPE_IS_LIVE — flip that to take real payments.
 */
export function getConfig(isProd = false) {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return isProd ? environmentProd : environment;
  }

  const { hostname, protocol } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    const backendUrl = `${protocol}//${hostname}:8080`;
    const config = withStripeMode({
      ...environment,
      production: false,
      isLive: STRIPE_IS_LIVE,
      firebaseConfig: devFirebaseConfig,
      url: backendUrl
    });
    console.log('🏠 Running on localhost - Using DEV Firebase');
    console.log(`📡 Backend: ${backendUrl} (from page URL)`);
    console.log(`💳 Stripe: ${config.isLive ? 'LIVE (real charges)' : 'TEST mode'}`);
    return config;
  }

  // Dev staging environment
  if (hostname === 'scriptthing-dev.web.app' || hostname === 'scriptthing-dev.firebaseapp.com') {
    const config = withStripeMode({
      ...environment,
      production: true,
      isLive: STRIPE_IS_LIVE,
      firebaseConfig: devFirebaseConfig,
      url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com'
    });
    console.log('🧪 Running on DEV staging');
    console.log(`💳 Stripe: ${config.isLive ? 'LIVE (real charges)' : 'TEST mode'}`);
    return config;
  }

  // Production environment
  if (hostname === 'scriptthing.web.app' || hostname === 'scriptthing.firebaseapp.com') {
    const config = withStripeMode({
      ...environment,
      production: true,
      isLive: STRIPE_IS_LIVE,
      firebaseConfig: prodFirebaseConfig,
      url: 'https://sides3.herokuapp.com'
    });
    console.log('🚀 Running on PRODUCTION');
    console.log(`💳 Stripe: ${config.isLive ? 'LIVE (real charges)' : 'TEST mode — flip STRIPE_IS_LIVE to go live'}`);
    return config;
  }

  // Default fallback
  return isProd ? environmentProd : environment;
}
