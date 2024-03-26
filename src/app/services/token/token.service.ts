import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import { Observable, timer, of, BehaviorSubject } from 'rxjs';
import { concatWith, map, takeWhile, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';

interface DecodedToken {
  sessionId: string;
  exp: number; // Expiration time in seconds
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'token_expiry';
  private tokenValiditySource = new BehaviorSubject<boolean>(true);
  public tokenValidity$ = this.tokenValiditySource.asObservable();
  private countdownSource = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSource.asObservable().pipe(shareReplay(1));

  constructor() {
    this.initializeCountdown();
  }

  private getCookieValue(): string | null {
    return Cookies.get(this.tokenKey);
  }
  setDeleteTimer(expirationTimeInMilliseconds: number): void {
    this.startCountdown(expirationTimeInMilliseconds);
  }
  
  private initializeCountdown(): void {
    const token = this.getCookieValue();
    if (token) {
      const expirationTime = parseInt(token, 10);
      const currentTime = Date.now();
      const timeLeft = expirationTime - currentTime;
      
      if (timeLeft > 0) {
        this.startCountdown(expirationTime);
      } else {
        this.tokenValiditySource.next(false);
      }
    } else {
      this.tokenValiditySource.next(false);
    }
  }

  private startCountdown(expirationTime: number): void {
    timer(0, 1000).pipe(
      map(() => {
        const currentTime = Date.now();
        const timeLeft = Math.max(expirationTime - currentTime, 0);
        return timeLeft;
      }),
      takeWhile(timeLeft => timeLeft >= 0, true)
    ).subscribe(timeLeft => {
      this.countdownSource.next(Math.floor(timeLeft / 1000));
      if (timeLeft <= 0) {
        this.tokenValiditySource.next(false);
      }
    });
  }

  isTokenValid(): Observable<boolean> {
    // Directly use tokenValidity$ for guard or other checks
    return this.tokenValidity$;
  }
}