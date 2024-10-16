// src/app/modules/firebase-module/firebase.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics, setUserId } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

const { firebaseConfig } = environment;

@NgModule({
  imports: [
    CommonModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAnalytics(() => {
      const analytics = getAnalytics();
      // Ensure no user ID is set
      setUserId(analytics, null); 
      return analytics;
    }),
    provideFirestore(() => getFirestore()),
  ],
  exports: [],
})
export class FirebaseModule {}
