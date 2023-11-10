import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';

import { environment } from '../../../environments/environment';

const { firebaseConfig } = environment;

@NgModule({
  exports: [],
  imports: [CommonModule],
  providers: [
    // provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // provideFirestore(() => getFirestore()),
    // provideAnalytics(() => getAnalytics()),
  ],
})
export class FirebaseModule {}
