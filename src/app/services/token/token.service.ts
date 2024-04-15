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
  

  constructor() {
    const expirationTimestamp = parseInt(Cookies.get(this.tokenKey) || '0', 10);
    const currentTime = Date.now();
    debugger
    const endTime = expirationTimestamp + currentTime;

    this.initialTimeSource.next(endTime); // We now send the calculated end time directly
    this.countdown$ = this.initialTimeSource.asObservable().pipe(
      switchMap(endTime => {
        // timer sets an interval of 1 second to emit new values
        return timer(0, 1000).pipe(
          map(() => Math.max(endTime - Date.now(), 0)),
          map(timeLeft => Math.floor(timeLeft)),
          takeWhile(timeLeft => timeLeft >= 0, true)
        );
      }),
      startWith(0) 
    );
  }


  public initializeCountdown(initialTime: number): void {
    debugger
    // intial timeSource is a behaviorSubject  meaning it can be an observable
      // but it can also be given a value via .next()
    this.initialTimeSource.next(initialTime);
  }

  public getCountdownObservable(): Observable<number> {
    return this.countdown$;
  }
  public isTokenValid(): boolean {
    return !!Cookies.get(this.tokenKey)
  }
}
