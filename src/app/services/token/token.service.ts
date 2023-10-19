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

  validateCookie():null |  number  {
    debugger
    const cookieWithRemainingTime = Cookies.get("downloadTimeRemaining")
    if(cookieWithRemainingTime) this.setDeleteTimer(cookieWithRemainingTime)
    return cookieWithRemainingTime ? Number(cookieWithRemainingTime) : null;
  };
    
  



  private clearExpirationTimer(): void {
    clearTimeout(this.expirationTime);
  }


  setDeleteTimer(token: string): void {
    debugger
    this.expirationTime = Number(token);
    // interval creates an observable
    this.countdown$ = interval(1000).pipe(
      map(() => this.expirationTime - Math.floor(Date.now() / 1000)),
      takeWhile(countdown => countdown > 0)
    );
  }

  getCountdown(): Observable<number> {
    return this.countdown$;
  }

  
}
