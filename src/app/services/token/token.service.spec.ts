import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';
import Cookies from 'js-cookie';
import { of } from 'rxjs';

jest.mock('js-cookie');

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenService],
    });
    service = TestBed.inject(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize countdown', () => {
    jest.useFakeTimers();
    const initialTime = Date.now() + 100000;
    service.initializeCountdown(initialTime);

    service.getCountdownObservable().subscribe(timeLeft => {
      expect(timeLeft).toBeLessThanOrEqual(100000);
      expect(timeLeft).toBeGreaterThanOrEqual(0);
    });

    jest.advanceTimersByTime(1000);

    service.getCountdownObservable().subscribe(timeLeft => {
      expect(timeLeft).toBeLessThanOrEqual(99000);
      expect(timeLeft).toBeGreaterThanOrEqual(0);
    });

    jest.useRealTimers();
  });

  it('should remove token', () => {
    service.removeToken();
    expect(Cookies.remove).toHaveBeenCalledWith(service['tokenKey']);
  });

  it('should check if token is valid', () => {
    (Cookies.get as jest.Mock).mockReturnValueOnce('some-token');
    expect(service.isTokenValid()).toBe(true);

    (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
    expect(service.isTokenValid()).toBe(false);
  });

  it('should get countdown observable', () => {
    const initialTime = Date.now() + 100000;
    service.initializeCountdown(initialTime);

    const countdown$ = service.getCountdownObservable();
    expect(countdown$).toBeDefined();
    countdown$.subscribe(timeLeft => {
      expect(timeLeft).toBeGreaterThanOrEqual(0);
    });
  });
});
