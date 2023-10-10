import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode'
import Cookies from 'js-cookie';
import {interval, Observable, timer} from 'rxjs';
import { map, takeWhile } from 'rxjs/operators'
interface DecodedToken {
  exp: number; // The property representing the expiration time in seconds
}
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = 'sides-ways-delete-timer';
  public expirationTime:number = 0;
  private expirationTimer: any;

  getDeleteTimer(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setDeleteTimer(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.expirationTime = Number(token);
    this.startExpirationTimer()
    
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.clearExpirationTimer();
  }
  validateCookie() {
    const pdfCookie = Cookies.get('pdfToken')
    if (pdfCookie) return pdfCookie
    return null;
  
  };

  private startExpirationTimer(): void {
    console.log("starting timer")
    const tokenTime = this.getDeleteTimer();
    if (tokenTime) {
  // Convert expiration time to milliseconds
      const currentTime = Date.now();
      const expirationMillis = Number(tokenTime) - currentTime;
      this.clearExpirationTimer();

      // Set a new timer to update the expiration time
      this.expirationTimer = setTimeout(() => {
        this.expirationTime = 0; // Expiration time has elapsed
      }, expirationMillis);
  }
}

  private clearExpirationTimer(): void {
    clearTimeout(this.expirationTimer);
  }

  getCountdown(): Observable<number> {
  
    
    return timer(0, 1000).pipe(
      map(() => {
        console.log("emitting")
        // Calculate the remaining time in seconds
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = this.expirationTime - currentTime;

        // Ensure the countdown doesn't go negative
        const countdownValue = Math.max(0, remainingTime);

        return countdownValue;
      }),
      takeWhile(countdownValue => countdownValue > 0)
    );
  }
}
