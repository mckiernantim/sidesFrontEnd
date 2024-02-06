import { Injectable, NgZone } from '@angular/core';
import { User } from '../../types/user';
import {  AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, collectionData, collection, doc, docData, setDoc} from '@angular/fire/firestore';
   /*
  DEPRECATED - WE MAY RETURN TO THIS DOWN THE ROAD IF WE NEED TO CREATE USER AUTH FOR 
  CREATING SCHEDULING;
  */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any; 

  constructor(
    public firestore:Firestore,
    public afAuth: AngularFireAuth, 
    public router: Router,
    public ngZone: NgZone 
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.onAuthStateChanged((user) => {
      if (user) {
        this.userData = user;
        console.log(this.userData)
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        this.userData = null;
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    });
  }
  // Sign in with email/password

  // Sign in with Google
  // Auth logic to run auth providers
 loginWithGoogle() {
    return this.afAuth.signInWithPopup(new GoogleAuthProvider())
      .then((result) => {
        console.log(result)
        this.ngZone.run(() => {
          return true
        });
        this.SetUserData(result.user);
      })
      .catch((error) => {
        window.alert(error);
      });
  }
  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  async SetUserData (user: any) {
    const userRef = doc(this.firestore,  `users/${user.uid}`)
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
    return await setDoc(userRef, userData)
    
  }
  // Sign out
  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      alert("You've beens signed out.")
    });
  }
}
