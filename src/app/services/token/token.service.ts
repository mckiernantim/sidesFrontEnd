import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import  Cookies  from 'js-cookie'

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'dltr_sidesWays';
  private initialTimeSource = new BehaviorSubject<number>(0);
  public countdown$: Observable<number>;
  

  constructor() {}
  

  public initializeCountdown(initialTime: number): void {
    this.initialTimeSource.next(initialTime);
    this.countdown$ = this.initialTimeSource.asObservable().pipe(
      switchMap(endTime => {
        return timer(0, 1000).pipe(
          map(() => {
            const now = Date.now();
            const timeLeft = endTime - now;
            return Math.max(timeLeft, 0); 
          }),
          takeWhile(timeLeft => timeLeft > 0, true),
          startWith(Math.max(initialTime - Date.now(), 0))
        );
      })
    );
    // intial timeSource is a behaviorSubject  meaning it can be an observable
      // but it can also be given a value via .next()
    this.initialTimeSource.next(initialTime);
  }
  public removeToken() {
    Cookies.delete(this.tokenKey)
  }
  public getCountdownObservable(): Observable<number> {
    return this.countdown$;
  }
  public isTokenValid(): boolean {
    return !!Cookies.get(this.tokenKey)
  }
}
