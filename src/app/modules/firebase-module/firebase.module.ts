// src/app/modules/firebase-module/firebase.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics, setUserId } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';

const { firebaseConfig } = environment;

@NgModule({
  imports: [
    CommonModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAnalytics(() => {
      const analytics = getAnalytics();
      // We're not setting a user ID initially
      return analytics;
    }),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()), // Add this line to enable authentication
  ],
  exports: [],
})
export class FirebaseModule {}