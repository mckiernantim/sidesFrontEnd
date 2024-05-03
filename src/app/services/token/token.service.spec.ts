import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';
import * as Cookies from 'js-cookie';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  delete: jest.fn()
}));

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize countdown and update countdown$', (done) => {
    const initialTime = Date.now() + 5000; // 5 seconds from now
    service.initializeCountdown(initialTime);
    const subscription = service.countdown$.subscribe(timeLeft => {
      expect(timeLeft).toBeGreaterThanOrEqual(0);
      if (timeLeft === 0) {
        subscription.unsubscribe();
        done();
      }
    });
  }, 10000);

  it('should delete token', () => {
    service.removeToken();
    expect(Cookies.remove).toHaveBeenCalledWith(service['tokenKey']);
  });

  it('should check token validity', () => {
    Cookies.get.mockReturnValue('some-token');
    expect(service.isTokenValid()).toBeTruthy();
    Cookies.get.mockReturnValue(undefined);
    expect(service.isTokenValid()).toBeFalsy();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
