import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { of, firstValueFrom } from 'rxjs';
import { UserGuard } from './user.guard';

describe('userGuard', () => {
  let router: jest.Mocked<Router>;
  let authService: any;
  let guard: UserGuard;
  
  // Create a more complete mock User object
  const mockUser = {
    uid: 'test-user-id',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn()
  } as any;

  beforeEach(() => {
    // Create mocks for the router and auth service
    const routerMock = {
      navigate: jest.fn()
    };
    
    const authServiceMock = {
      user$: of(mockUser),
      ensureUserLoaded: jest.fn().mockReturnValue(of(mockUser))
    };
    
    TestBed.configureTestingModule({
      providers: [
        UserGuard,
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
    
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    authService = TestBed.inject(AuthService);
    guard = TestBed.inject(UserGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', async () => {
    // Set up auth service to return a user
    authService.user$ = of(mockUser);
    authService.ensureUserLoaded.mockReturnValue(of(mockUser));
    
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/profile' } as RouterStateSnapshot;
    
    // Get the first value from the Observable
    const result = await firstValueFrom(guard.canActivate(route, state));
    
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  
  it('should redirect to login when user is not authenticated', async () => {
    // Set up auth service to return null (not authenticated)
    authService.user$ = of(null);
    authService.ensureUserLoaded.mockReturnValue(of(null));
    
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/profile' } as RouterStateSnapshot;
    
    // Get the first value from the Observable
    const result = await firstValueFrom(guard.canActivate(route, state));
    
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { 
      queryParams: { returnUrl: '/profile' } 
    });
  });
});
