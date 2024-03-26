import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

const { firebaseConfig } = environment

@NgModule({
  exports: [],
  imports: [
    CommonModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAnalytics(() => getAnalytics()),
    provideFirestore(() => getFirestore())
  ]
})
export class FirebaseModule { }