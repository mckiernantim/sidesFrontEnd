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
  private readonly tokenKey = 'checkoutSession';
  public countdown$: Observable<number>;

  constructor() {
    this.initializeCountdown();
  }

  getCookieValue(): string | null {
    return Cookies.get(this.tokenKey);
  }

  decodeToken(token: string): DecodedToken {
    return jwt_decode<DecodedToken>(token);
  }

  initializeCountdown(): void {
    const token = this.getCookieValue();
    if (token) {
      const decoded = this.decodeToken(token);
      this.startCountdown(decoded.exp);
    }
  }

  startCountdown(expirationTime: number): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = expirationTime - currentTime; // Time left in seconds
    this.countdown$ = timer(0, 1000).pipe(
      map((elapsed) => timeLeft - elapsed),
      takeWhile((remaining) => remaining >= 0)
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
