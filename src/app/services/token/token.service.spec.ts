import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { TokenService } from './token.service';
import * as Cookies from 'js-cookie';

describe('TokenService', () => {
  let service: TokenService;
  let cookieSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
    cookieSpy = spyOn(Cookies, 'get');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve token value from cookies', () => {
    const tokenValue = '1234567890';
    cookieSpy.and.returnValue(tokenValue);
    expect(service.getCookieValue()).toBe(tokenValue);
    expect(cookieSpy).toHaveBeenCalledWith(service['tokenKey']);
  });

  it('should initialize countdown if token is present', () => {
    const tokenValue = '1704477236073'; // Sample token expiration timestamp
    cookieSpy.and.returnValue(tokenValue);
  
    spyOn(service, 'startCountdown');
  
    service.initializeCountdown();
  
    expect(service.startCountdown).toHaveBeenCalledWith(parseInt(tokenValue));
  });
  
  it('should emit correct countdown values', fakeAsync(() => {
    const tokenExpirationTimeInMilliseconds = Date.now() + 5000; // 5 seconds in the future
    cookieSpy.and.returnValue(tokenExpirationTimeInMilliseconds.toString());
  
    service.initializeCountdown();
    
    let countdownValue;
    service.getCountdown().subscribe(value => countdownValue = value);
  
    // Simulate 1 second passing
    tick(1000);
    expect(countdownValue).toBe(4); // 4 seconds remaining
  
    // Simulate another 2 seconds
    tick(2000);
    expect(countdownValue).toBe(2); // 2 seconds remaining
  
    // Simulate the remaining time
    tick(2000);
    expect(countdownValue).toBe(0); // Countdown should reach zero
  
    // Clean up
    discardPeriodicTasks();
  }));
  // Additional tests...
});
