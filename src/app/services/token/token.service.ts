import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, interval, Subject } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import Cookies from 'js-cookie';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly PDF_TOKEN_KEY = 'pdfToken';
  private readonly PDF_TOKEN_EXPIRES_KEY = 'pdfTokenExpires';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenExpiredSubject = new Subject<void>();
  
  public token$ = this.tokenSubject.asObservable();
  public tokenExpired$ = this.tokenExpiredSubject.asObservable();

  constructor() {
    // Initialize token from localStorage
    const token = this.getToken();
    this.tokenSubject.next(token);
    
    // Set up periodic token validation
    this.setupTokenValidation();
  }

  private setupTokenValidation(): void {
    // Check token validity every minute
    interval(60000).subscribe(() => {
      this.validateToken();
    });
  }

  private validateToken(): void {
    const token = localStorage.getItem(this.PDF_TOKEN_KEY);
    const expirationTime = localStorage.getItem(this.PDF_TOKEN_EXPIRES_KEY);
    
    if (!token || !expirationTime) {
      this.removeToken();
      return;
    }

    const currentTime = Date.now();
    const expiresAt = parseInt(expirationTime);

    if (currentTime >= expiresAt) {
      console.log('Token expired:', {
        currentTime: new Date(currentTime).toISOString(),
        expiresAt: new Date(expiresAt).toISOString()
      });
      this.removeToken();
      this.tokenExpiredSubject.next();
    }
  }

  public setToken(token: string, expirationTime: number): void {
    if (!token || !expirationTime) {
      console.error('Invalid token or expiration time provided');
      return;
    }

    // Validate expiration time is in the future
    if (expirationTime <= Date.now()) {
      console.error('Expiration time must be in the future');
      return;
    }

    localStorage.setItem(this.PDF_TOKEN_KEY, token);
    localStorage.setItem(this.PDF_TOKEN_EXPIRES_KEY, expirationTime.toString());
    this.tokenSubject.next(token);
    
    console.log('Token stored:', {
      token: token,
      expires: new Date(expirationTime).toISOString()
    });
  }

  public getToken(): string | null {
    this.validateToken(); // Check validity before returning
    return localStorage.getItem(this.PDF_TOKEN_KEY);
  }

  public isTokenValid(): boolean {
    const token = localStorage.getItem(this.PDF_TOKEN_KEY);
    const expirationTime = localStorage.getItem(this.PDF_TOKEN_EXPIRES_KEY);
    
    if (!token || !expirationTime) return false;
    
    const currentTime = Date.now();
    const expiresAt = parseInt(expirationTime);
    
    return currentTime < expiresAt;
  }

  public removeToken(): void {
    console.log('Removing expired token');
    localStorage.removeItem(this.PDF_TOKEN_KEY);
    localStorage.removeItem(this.PDF_TOKEN_EXPIRES_KEY);
    this.tokenSubject.next(null);
  }

  public getTokenExpirationTime(): number | null {
    const expirationTime = localStorage.getItem(this.PDF_TOKEN_EXPIRES_KEY);
    return expirationTime ? parseInt(expirationTime) : null;
  }

  public getTimeUntilExpiration(): number | null {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;
    
    const currentTime = Date.now();
    return Math.max(0, expirationTime - currentTime);
  }

  public getTokenDebugInfo(): { 
    hasToken: boolean; 
    expirationTime: number | null; 
    currentTime: number;
    timeRemaining: number | null;
    isValid: boolean;
  } {
    const expirationTime = this.getTokenExpirationTime();
    const currentTime = Date.now();
    const timeRemaining = expirationTime ? Math.max(0, expirationTime - currentTime) : null;
    
    return {
      hasToken: !!this.getToken(),
      expirationTime,
      currentTime,
      timeRemaining,
      isValid: this.isTokenValid()
    };
  }
}