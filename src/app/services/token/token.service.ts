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
  private expirationTime: number = 0;
  private countdown$: Observable<number>;

  getDeleteTimer(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // setDeleteTimer(token: string): void {
  //   localStorage.setItem(this.tokenKey, token);
  //   this.expirationTime = Number(token);
  // }

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
    console.log("starting timer");
    const tokenTime = this.getDeleteTimer();
    if (tokenTime) {
      // Clear any existing expiration timer
      this.clearExpirationTimer();
  

    }
  }

  private clearExpirationTimer(): void {
    clearTimeout(this.expirationTime);
  }

  startCountdown() {
    this.startExpirationTimer();
    console.log(this.expirationTime)
    return this.getCountdown()
  }
  setDeleteTimer(token: string): void {
    this.expirationTime = Number(token);
    this.countdown$ = timer(0, 1000);
  }

  getCountdown(): Observable<number> {
    return this.countdown$;
  }

  
}
