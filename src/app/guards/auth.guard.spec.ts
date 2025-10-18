import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;
  let mockUser: User;

  beforeEach(() => {
    // Create mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
      emailVerified: true,
      isAnonymous: false,
      metadata: {} as any,
      providerData: [],
      refreshToken: 'test-refresh-token',
      tenantId: null,
      phoneNumber: null,
      providerId: 'firebase',
      delete: jest.fn(),
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn()
    } as User;

    // Create spies
    const authServiceSpy = {
      getAuthenticatedUser: jest.fn()
    } as any;

    const routerSpy = {
      navigate: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    mockAuthService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate()', () => {
    let mockRoute: ActivatedRouteSnapshot;
    let mockState: RouterStateSnapshot;

    beforeEach(() => {
      mockRoute = {
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        paramMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        queryParamMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        title: undefined,
        toString: () => ''
      } as ActivatedRouteSnapshot;
      mockState = { url: '/dashboard' } as RouterStateSnapshot;
    });

    it('should allow access when user is authenticated', (done) => {
      mockAuthService.getAuthenticatedUser.mockReturnValue(of(mockUser));

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBeTruthy();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should deny access when user is not authenticated', (done) => {
      mockAuthService.getAuthenticatedUser.mockReturnValue(of(null));

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBeFalsy();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    });

    it('should handle auth service errors gracefully', (done) => {
      const error = new Error('Auth service error');
      mockAuthService.getAuthenticatedUser.mockReturnValue(throwError(() => error));

      guard.canActivate(mockRoute, mockState).subscribe({
        next: (result) => {
          expect(result).toBeFalsy();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
          done();
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should complete observable after single emission', (done) => {
      mockAuthService.getAuthenticatedUser.mockReturnValue(of(mockUser));
      let emissionCount = 0;

      guard.canActivate(mockRoute, mockState).subscribe({
        next: (result) => {
          emissionCount++;
          expect(result).toBeTruthy();
        },
        complete: () => {
          expect(emissionCount).toBe(1);
          done();
        }
      });
    });
  });

  describe('Integration with AuthService', () => {
    it('should call getAuthenticatedUser() method', () => {
      const mockRoute = {
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        paramMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        queryParamMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        title: undefined,
        toString: () => ''
      } as ActivatedRouteSnapshot;
      const mockState = { url: '/dashboard' } as RouterStateSnapshot;
      mockAuthService.getAuthenticatedUser.mockReturnValue(of(mockUser));

      guard.canActivate(mockRoute, mockState).subscribe();

      expect(mockAuthService.getAuthenticatedUser).toHaveBeenCalled();
    });

    it('should work with different route configurations', (done) => {
      const mockRoute = {
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: { requiresAuth: true },
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        paramMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        queryParamMap: {
          get: jest.fn(),
          getAll: jest.fn(),
          has: jest.fn(),
          keys: []
        } as any,
        title: undefined,
        toString: () => ''
      } as ActivatedRouteSnapshot;
      const mockState = { url: '/profile' } as RouterStateSnapshot;
      mockAuthService.getAuthenticatedUser.mockReturnValue(of(mockUser));

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });
    });
  });
});
