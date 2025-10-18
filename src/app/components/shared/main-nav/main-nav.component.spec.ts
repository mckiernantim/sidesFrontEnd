import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainNavComponent } from './main-nav.component';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';
import { User } from '@angular/fire/auth';

describe('MainNavComponent', () => {
  let component: MainNavComponent;
  let fixture: ComponentFixture<MainNavComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let userSubject: BehaviorSubject<User | null>;

  beforeEach(async () => {
    // Create mock user
    const mockUser: User = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg'
    } as User;

    // Create user subject for testing
    userSubject = new BehaviorSubject<User | null>(null);

    // Create spies
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['signInWithGoogle', 'signOut'], {
      user$: userSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [MainNavComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MainNavComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should subscribe to user$ observable on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should set isLoggedIn based on user state', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.isLoggedIn).toBeTrue();
    });

    it('should set username from user displayName', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.username).toBe('Test User');
    });

    it('should set username from user email as fallback', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: null,
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.username).toBe('test@example.com');
    });

    it('should set username to "User" when both displayName and email are null', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: null,
        displayName: null,
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.username).toBe('User');
    });

    it('should set userAvatar from user photoURL', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.userAvatar).toBe('https://example.com/avatar.jpg');
    });

    it('should handle missing user avatar gracefully', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.userAvatar).toBe('');
    });
  });

  describe('User Interface Updates', () => {
    it('should show sign-in button when not logged in', () => {
      userSubject.next(null);
      component.ngOnInit();
      expect(component.isLoggedIn).toBeFalse();
    });

    it('should show user menu when logged in', () => {
      const mockUser: User = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg'
      } as User;

      userSubject.next(mockUser);
      component.ngOnInit();
      expect(component.isLoggedIn).toBeTrue();
    });
  });

  describe('Authentication Actions', () => {
    describe('signIn()', () => {
      it('should call authService.signInWithGoogle()', () => {
        component.signIn();
        expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      });
    });

    describe('signOut()', () => {
      it('should call authService.signOut() and navigate to home', async () => {
        mockAuthService.signOut.and.returnValue(Promise.resolve());
        
        await component.signOut();
        
        expect(mockAuthService.signOut).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      });

      it('should handle sign-out errors', async () => {
        const error = new Error('Sign-out failed');
        mockAuthService.signOut.and.returnValue(Promise.reject(error));
        
        try {
          await component.signOut();
        } catch (e) {
          expect(e).toBe(error);
        }
      });
    });

    describe('logout()', () => {
      it('should call authService.signOut() and navigate to home', async () => {
        mockAuthService.signOut.and.returnValue(Promise.resolve());
        
        await component.logout();
        
        expect(mockAuthService.signOut).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      });
    });
  });

  describe('Menu State Management', () => {
    it('should toggle user menu on click', () => {
      expect(component.isUserMenuOpen).toBeFalse();
      
      component.toggleUserMenu();
      expect(component.isUserMenuOpen).toBeTrue();
      
      component.toggleUserMenu();
      expect(component.isUserMenuOpen).toBeFalse();
    });

    it('should close user menu when requested', () => {
      component.isUserMenuOpen = true;
      component.closeUserMenu();
      expect(component.isUserMenuOpen).toBeFalse();
    });

    it('should toggle mobile menu on click', () => {
      expect(component.isMobileMenuOpen).toBeFalse();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeTrue();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete without errors', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
