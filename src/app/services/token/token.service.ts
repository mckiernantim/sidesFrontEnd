import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode'

interface DecodedToken {
  exp: number; // The property representing the expiration time in seconds
  
}
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly tokenKey = '_stripeCheckoutSessionToken';
  private expirationTimer: any;

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.startExpirationTimer();
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.clearExpirationTimer();
  }

  private startExpirationTimer(): void {
    console.log("starting timer")
    const token = this.getToken();
    if (token) {
    const decodedToken = jwt_decode<DecodedToken>(token);
      const expirationTime = decodedToken.exp * 1000; // Convert expiration time to milliseconds
      const currentTime = Date.now();
      const timeRemaining = expirationTime - currentTime;

      this.expirationTimer = setTimeout(() => {
        alert("token has expired")
        this.removeToken();
      }, timeRemaining);
    }
  }

  private clearExpirationTimer(): void {
    clearTimeout(this.expirationTimer);
  }
}
