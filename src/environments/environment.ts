// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

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

// For development
export const environment = {
  production: false,
  stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ',
  firebaseConfig: devFirebaseConfig,
  url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com',
  password:"NOTEWORTHY",
  maintenanceMode: false
};

// Fallback for production build (used by environment.prod.ts if not properly loaded)
export const environmentProd = {
  production: true,
  stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ',
  firebaseConfig: prodFirebaseConfig,
  url: 'https://sides3.herokuapp.com',
  password: "NOTEWORTHY",
  maintenanceMode: false 
};

/**
 * Dynamic configuration helper
 * Automatically detects environment and returns appropriate config
 *
 * Environment Detection:
 * - localhost / 127.0.0.1 -> DEV Firebase + backend at same host:8080
 * - scriptthing-dev.web.app -> DEV Firebase + DEV Heroku backend
 * - scriptthing.web.app -> PROD Firebase + PROD Heroku backend
 */
export function getConfig(isProd = false) {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return isProd ? environmentProd : environment;
  }

  const { hostname, protocol } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // Same host as the page, local backend port
    const backendUrl = `${protocol}//${hostname}:8080`;

    console.log('🏠 Running on localhost - Using DEV Firebase');
    console.log(`📡 Backend: ${backendUrl} (from page URL)`);
    console.log('🔥 Firebase: scriptthing-dev');
    
    return {
      ...environment,
      production: false,
      firebaseConfig: devFirebaseConfig,
      url: backendUrl
    };
  }
  
  // Dev staging environment
  if (hostname === 'scriptthing-dev.web.app' || hostname === 'scriptthing-dev.firebaseapp.com') {
    console.log('🧪 Running on DEV staging - Using DEV environment');
    return {
      ...environment,
      production: true,
      firebaseConfig: devFirebaseConfig,
      url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com'
    };
  }
  
  // Production environment
  if (hostname === 'scriptthing.web.app' || hostname === 'scriptthing.firebaseapp.com') {
    console.log('🚀 Running on PRODUCTION');
    return {
      ...environment,
      production: true,
      firebaseConfig: prodFirebaseConfig,
      url: 'https://sides3.herokuapp.com',
      stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ'
    };
  }
  
  // Default fallback
  return isProd ? environmentProd : environment;
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
