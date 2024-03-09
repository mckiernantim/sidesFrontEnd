import { Injectable } from '@angular/core';
import jwt_decode from 'jwt-decode';
import Cookies from 'js-cookie';
import { Observable, timer, of } from 'rxjs';
import { concatWith, map, takeWhile } from 'rxjs/operators';

interface DecodedToken {
  sessionId: string;
  exp: number; // Expiration time in seconds
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'dltr_sidesWays';
  public countdown$: Observable<number| Boolean>;
  private decodedToken: string | null = null;

  constructor() {
    this.initializeCountdown();
  }

  getCookieValue(): string | null {
    return Cookies.get(this.tokenKey);
  }

  decodeToken(token: string): void {
    // this.decodedToken = jwt_decode<DecodedToken>(token);
  }

  initializeCountdown(): void {
    const token = this.getCookieValue();
    console.log(token)
    if (token) {
      const expirationTimeInMilliseconds = parseInt(token);
      this.startCountdown(expirationTimeInMilliseconds);
    }
  }
  
  /* 

    Delete countdown observable begins a countdown that emits values to other components
    While > 0 the user can download their documentation and we can pipe into the 
    Observable to see the reamining time

  */
  startCountdown(expirationTimeInMilliseconds: number): void {
    const currentTimeInMilliseconds = Date.now();
    const timeLeftInMilliseconds = expirationTimeInMilliseconds - currentTimeInMilliseconds; // Time left in milliseconds
    this.countdown$ = timer(0, 1000).pipe(
      map((elapsed) => Math.floor((timeLeftInMilliseconds - (elapsed * 1000)) / 1000)),
      takeWhile((remaining) => remaining >= 0, true),
      concatWith(of(-1))
    );
  }
  
  getCountdown () {
    return this.countdown$
  }
  setDeleteTimer(time) {
    this.startCountdown(time)
  }
  isTokenValid(): Observable<boolean> {
    return this.getCountdown().pipe(
      map(timeLeft => timeLeft as number > 0)
    );
  }


  getDeleteTimer() {
    
  } 

}
