import { NgModule, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders } from '@angular/core';

// Import Firebase modules
import { initializeApp } from '@angular/fire/app';
import { getAuth } from '@angular/fire/auth';
import { getFirestore } from '@angular/fire/firestore';
import { getStorage } from '@angular/fire/storage';
import { provideFirebaseApp, FirebaseAppModule } from '@angular/fire/app';
import { provideAuth, AuthModule } from '@angular/fire/auth';
import { provideFirestore, FirestoreModule } from '@angular/fire/firestore';
import { provideStorage, StorageModule } from '@angular/fire/storage';
import { getConfig } from '../../../environments/environment';

// Get the correct config based on mode
const config = getConfig(!isDevMode());
const { firebaseConfig } = config;

@NgModule({
  imports: [
    CommonModule,
    FirebaseAppModule,
    AuthModule,
    FirestoreModule,
    StorageModule
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    { 
      provide: 'FIREBASE_CONFIG', 
      useFactory: () => {
        console.log(`Using ${isDevMode() ? 'development' : 'production'} Firebase configuration`);
        return firebaseConfig;
      }
    }
  ]
})
export class FirebaseModule {
  static forRoot(): ModuleWithProviders<FirebaseModule> {
    return {
      ngModule: FirebaseModule,
      providers: [
        provideFirebaseApp(() => initializeApp(firebaseConfig)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage())
      ]
    };
  }
}