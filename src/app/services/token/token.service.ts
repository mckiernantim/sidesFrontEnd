import { Injectable } from '@angular/core';
import Cookies from 'js-cookie';
import { BehaviorSubject, timer } from 'rxjs';
import { map, takeWhile, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'dltr_sidesWays';
  private countdownSource = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSource.asObservable();

  constructor() {

  }

  public initializeCountdown(initialTime:number): void {
    debugger
    const expirationTime = Date.now() + initialTime;
    this.countdownSource.next(initialTime);

    const intervalId = setInterval(() => {
      const timeLeft = expirationTime - Date.now();

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        this.countdownSource.next(0);
        // Notify other parts of the app that the token has expired
        // For example, you might set a boolean BehaviorSubject here and update its value
      } else {
        this.countdownSource.next(Math.floor(timeLeft / 1000));
      }
    }, 1000);
  }

  private getCookieValue(): string | null {
    return Cookies.get(this.tokenKey);
  }

  private startCountdown(expirationTime: number): void {
    const interval$ = timer(0, 1000).pipe(
      map(() => {
        const currentTime = Date.now();
        const timeLeft = expirationTime - currentTime;
        return Math.max(Math.floor(timeLeft / 1000), 0); // Ensure non-negative
      }),
      takeWhile(timeLeft => timeLeft > 0, true), // Emit the last value (0)
      finalize(() => this.countdownSource.next(0)) // Ensure countdown shows 0 at the end
    );

    interval$.subscribe(timeLeft => {
      this.countdownSource.next(timeLeft);
    });
  }

  // Call this function to manually set a new countdown
  public setNewCountdown(expirationTimeInMilliseconds: number): void {
    this.startCountdown(Date.now() + expirationTimeInMilliseconds);
  }

  // Use this to check token validity or countdown in components or guards
  public isTokenValid(): boolean {
    return this.countdownSource.getValue() > 0;
  }
}
