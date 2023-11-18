import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/Firestore';
import { environment } from '../../../environments/environment'

const { firebaseConfig } = environment

@NgModule({
  exports: [],
  imports: [
    CommonModule,
    AngularFireModule,
    AngularFireAnalyticsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule,
  
  ]
})
export class FirebaseModule { }