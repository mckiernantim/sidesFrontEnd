import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import { Observable, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

interface DecodedToken {
  sessionId: string;
  exp: number; // Expiration time in seconds
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'dltr_sidesWays';
  public countdown$: Observable<number>;
  private decodedToken: string | null = null;

  constructor() {
    this.initializeCountdown();
  }

  getCookieValue(): string | null {
    console.log(Cookies.get())
    return Cookies.get(this.tokenKey);
  }

  decodeToken(token: string): void {
    // this.decodedToken = jwt_decode<DecodedToken>(token);
  }
  initializeCountdown(): void {
    const token = this.getCookieValue();
    if (token) {
      const expirationTimeInMilliseconds = parseInt(token);
      this.startCountdown(expirationTimeInMilliseconds);
    }
  }
  startCountdown(expirationTimeInMilliseconds: number): void {
    const currentTimeInMilliseconds = Date.now();
    const timeLeftInMilliseconds = expirationTimeInMilliseconds - currentTimeInMilliseconds; // Time left in milliseconds
    this.countdown$ = timer(0, 1000).pipe(
      map((elapsed) => Math.floor((timeLeftInMilliseconds - (elapsed * 1000)) / 1000)),
      takeWhile((remaining) => remaining >= 0, true)
    );
  }
  getCountdown () {
    return this.countdown$
  }
  setDeleteTimer(time) {
    this.startCountdown(time)
  }

  getDeleteTimer() {
    
  } 

}
