import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import Cookies from 'js-cookie';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'dltr_sidesWays';
  private initialTimeSource = new BehaviorSubject<number>(0);
  public countdown$: Observable<number>;

  constructor() {
    // Initialize countdown$ in constructor
    this.countdown$ = this.initialTimeSource.pipe(
      switchMap(initialTime => {
        if (initialTime <= 0) return new BehaviorSubject(0);
        
        return timer(0, 1000).pipe(
          map(() => {
            const timeLeft = Math.max(initialTime - Date.now(), 0);
            return timeLeft;
          }),
          takeWhile(timeLeft => timeLeft > 0, true)
        );
      })
    );
  }

  public initializeCountdown(initialTime: number): void {
    if (initialTime > Date.now()) {
      this.initialTimeSource.next(initialTime);
    } else {
      this.initialTimeSource.next(0);
    }
  }

  public removeToken(): void {
    Cookies.remove(this.tokenKey);
    this.initialTimeSource.next(0);
  }

  public getCountdownObservable(): Observable<number> {
    return this.countdown$;
  }

  public isTokenValid(): boolean {
    return !!Cookies.get(this.tokenKey);
  }
}