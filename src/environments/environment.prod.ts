export const environment = {
  production: true,
  
  // ⚠️⚠️⚠️ CRITICAL: CHANGE TO REAL STRIPE PRODUCTION KEY BEFORE GOING LIVE! ⚠️⚠️⚠️
  // Current key is TEST mode - will NOT process real payments!
  // Replace with: pk_live_... (your real production publishable key)
  stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ',
  
  firebaseConfig:{
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
  password:"NOTEWORTHY",
  maintenanceMode: true
};

export const environmentProd = environment;

// Helper function to get the right environment
export function getConfig(isProd = false) {
  return environment;
}




