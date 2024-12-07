import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import Cookies from 'js-cookie';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  public readonly tokenKey = 'dltr_sidesWays';
  public readonly pdfKey = "pdf_sidesWays";
  public pdfToken: string;
  private initialTimeSource = new BehaviorSubject<number>(0);
  public countdown$: Observable<number>;

  constructor() {
    this.countdown$ = this.initialTimeSource.pipe(
      switchMap(initialTime => {
        if (initialTime <= 0) return new BehaviorSubject(0);
        
        return timer(0, 1000).pipe(
          map(() => Math.max(initialTime - Date.now(), 0)),
          takeWhile(timeLeft => timeLeft > 0, true)
        );
      })
    );
  }

  public initializeCountdown(expirationTime: number): void {
    // Store both the token and expiration time
    Cookies.set(this.tokenKey, String(expirationTime));
    
    if (expirationTime > Date.now()) {
      this.initialTimeSource.next(expirationTime);
    } else {
      this.initialTimeSource.next(0);
    }
  }

  public isTokenValid(): boolean {
    const expirationTime = Number(Cookies.get(this.tokenKey));
    return expirationTime && expirationTime > Date.now();
  }

  public removeToken(): void {
    Cookies.remove(this.tokenKey);
    this.initialTimeSource.next(0);
  }

  public getCountdownObservable(): Observable<number> {
    return this.countdown$;
  }

  // Helper method to debug token state
  public getTokenDebugInfo(): { 
    hasToken: boolean; 
    expirationTime: number; 
    currentTime: number;
    timeRemaining: number;
  } {
    const expirationTime = Number(Cookies.get(this.tokenKey));
    const currentTime = Date.now();
    return {
      hasToken: !!Cookies.get(this.tokenKey),
      expirationTime,
      currentTime,
      timeRemaining: expirationTime - currentTime
    };
  }

  public setToken(token, key) {
    Cookies.set(key, token);
  }

  public getToken(key) {
    return Cookies.get(key) || null;
  }
}