// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// For development
export const environment = {
  production: false,
  stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ',
  // firebaseConfig:{
  //   apiKey: "AIzaSyBXD5kQfAS4lrmSJxYAuEUq8sxvXgWmCio",
  //   authDomain: "scriptthing.firebaseapp.com",
  //   databaseURL: "https://scriptthing.firebaseio.com",
  //   projectId: "scriptthing",
  //   storageBucket: "scriptthing.appspot.com",
  //   messagingSenderId: "195325163986",
  //   appId: "1:195325163986:web:e7a70646f087850353300b",
  //   measurementId: "G-XM3P84P6N7"
  // },
  firebaseConfig: {
    apiKey: "AIzaSyCr0Gemya880xoOnAYWtTcZWssg5Uc2HY0",
    authDomain: "scriptthing-dev.firebaseapp.com",
    projectId: "scriptthing-dev",
    storageBucket: "scriptthing-dev.firebasestorage.app",
    messagingSenderId: "401150394674",
    appId: "1:401150394674:web:760ffe3a546b2d01a8d72b",
    measurementId: "G-1JF7DG5L5H"
  },
  // url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com',
  url: 'http://localhost:8080',
  password:"NOTEWORTHY"
};

// For production - this will be used if environment.prod.ts isn't properly loaded
export const environmentProd = {
  production: true,
  stripe: "pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ",
  firebaseConfig: {
    apiKey: "AIzaSyCr0Gemya880xoOnAYWtTcZWssg5Uc2HY0",
    authDomain: "scriptthing-dev.firebaseapp.com",
    projectId: "scriptthing-dev",
    storageBucket: "scriptthing-dev.firebasestorage.app",
    messagingSenderId: "401150394674",
    appId: "1:401150394674:web:760ffe3a546b2d01a8d72b",
    measurementId: "G-1JF7DG5L5H"
  },
  url: 'https://sides3-dev-e045a1d9ac46.herokuapp.com',
  password:"NOTEWORTHY"
};

// Helper function to get the right environment
export function getConfig(isProd = false) {
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
