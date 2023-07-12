// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  stripe: 'pk_test_51IEIywBojwZRnVT4jdQQwACDdPb6Zy0ceGk09ZXvUWoeseNOakmMrGB5F9aVY73b0VQqwhZD6jCOE74GTGXbV4Tj00ggYYXpjQ',
  firebaseConfig:{
    apiKey: "AIzaSyBXD5kQfAS4lrmSJxYAuEUq8sxvXgWmCio",
    authDomain: "scriptthing.firebaseapp.com",
    databaseURL: "https://scriptthing.firebaseio.com",
    projectId: "scriptthing",
    storageBucket: "scriptthing.appspot.com",
    messagingSenderId: "195325163986",
    appId: "1:195325163986:web:e7a70646f087850353300b",
    measurementId: "G-XM3P84P6N7"
  },
  url:"http://localhost:8080",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
