
import { TestBed } from '@angular/core/testing';
import { TokenGuard } from './token.guard';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('TokenGuard', () => {
  let guard: TokenGuard;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    // Create spy
    const routerSpy = {
      navigate: jest.fn()
    } as any;

    // Mock window.alert
    global.alert = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        TokenGuard,
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(TokenGuard);
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
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
      mockState = { url: '/complete' } as RouterStateSnapshot;
    });

    it('should allow access with valid document session', () => {
      // Set up valid session data
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', (Date.now() + 86400000).toString()); // Tomorrow

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeTruthy();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should deny access when document name is missing', () => {
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', (Date.now() + 86400000).toString());

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should deny access when pdf token is missing', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfTokenExpires', (Date.now() + 86400000).toString());

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should deny access when token expiration is missing', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should deny access when token is expired', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', (Date.now() - 86400000).toString()); // Yesterday

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle invalid expiration timestamp', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', 'invalid-timestamp');

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeFalsy();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Session Management', () => {
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
      mockState = { url: '/complete' } as RouterStateSnapshot;
      jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('should show error message for missing session', () => {
      guard.canActivate(mockRoute, mockState);
      expect(window.alert).toHaveBeenCalledWith('No valid document session found. You will be redirected to the upload page.');
    });

    it('should show error message for expired session', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', (Date.now() - 86400000).toString());

      guard.canActivate(mockRoute, mockState);
      expect(window.alert).toHaveBeenCalledWith('Your document session has expired and your document has been deleted for your privacy. You will be redirected to the upload page.');
    });

    it('should clear localStorage on invalid session', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', 'invalid-timestamp');
      localStorage.setItem('sessionExpires', 'some-value');

      guard.canActivate(mockRoute, mockState);

      expect(localStorage.getItem('name')).toBeNull();
      expect(localStorage.getItem('pdfBackupToken')).toBeNull();
      expect(localStorage.getItem('pdfTokenExpires')).toBeNull();
      expect(localStorage.getItem('sessionExpires')).toBeNull();
    });

    it('should navigate to home page on invalid session', () => {
      guard.canActivate(mockRoute, mockState);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('localStorage Integration', () => {
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
      mockState = { url: '/complete' } as RouterStateSnapshot;
    });

    it('should check for name in localStorage', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      
      guard.canActivate(mockRoute, mockState);
      
      expect(getItemSpy).toHaveBeenCalledWith('name');
    });

    it('should check for pdfBackupToken in localStorage', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      
      guard.canActivate(mockRoute, mockState);
      
      expect(getItemSpy).toHaveBeenCalledWith('pdfBackupToken');
    });

    it('should check for pdfTokenExpires in localStorage', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      
      guard.canActivate(mockRoute, mockState);
      
      expect(getItemSpy).toHaveBeenCalledWith('pdfTokenExpires');
    });

    it('should validate token expiration timestamp', () => {
      localStorage.setItem('name', 'test-script.pdf');
      localStorage.setItem('pdfBackupToken', 'valid-token-123');
      localStorage.setItem('pdfTokenExpires', (Date.now() + 86400000).toString());

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBeTruthy();
    });
  });
});
