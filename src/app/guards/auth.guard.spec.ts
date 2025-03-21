import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';
import { Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceMock: any;
  let routerMock: any;
  let routeSnapshotMock: ActivatedRouteSnapshot;
  let routerStateSnapshotMock: RouterStateSnapshot;

  beforeEach(() => {
    // Create mocks
    authServiceMock = {
      ensureUserLoaded: jest.fn().mockReturnValue(of(null)) // Default to not authenticated
    };

    routerMock = {
      createUrlTree: jest.fn().mockReturnValue(new UrlTree())
    };

    routeSnapshotMock = {} as ActivatedRouteSnapshot;
    routerStateSnapshotMock = { url: '/profile' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow navigation when user is authenticated', (done) => {
    // Set user to authenticated
    authServiceMock.ensureUserLoaded.mockReturnValue(of({ uid: 'test-user-id' }));
    
    // Check guard
    guard.canActivate(routeSnapshotMock, routerStateSnapshotMock).subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should redirect to home when user is not authenticated', (done) => {
    // Set user to not authenticated
    authServiceMock.ensureUserLoaded.mockReturnValue(of(null));
    
    // Create URL tree for redirect
    const urlTree = new UrlTree();
    routerMock.createUrlTree.mockReturnValue(urlTree);
    
    // Check guard
    guard.canActivate(routeSnapshotMock, routerStateSnapshotMock).subscribe(result => {
      expect(result).toBe(urlTree);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
      done();
    });
  });
}); 