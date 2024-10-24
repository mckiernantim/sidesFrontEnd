import { Injectable } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = new Observable((subscriber) => {
      this.auth.onAuthStateChanged(subscriber);
    });
  }

  async signIn() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  }
}