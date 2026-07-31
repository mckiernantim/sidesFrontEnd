import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthComponent } from './auth.component';
import { AuthService } from '../../services/auth/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildAuthServiceMock(): jest.Mocked<AuthService> {
  return {
    user$: new BehaviorSubject(null).asObservable(),
    signInWithEmail: jest.fn(),
    signInWithGoogle: jest.fn(),
    registerWithEmail: jest.fn(),
    sendPasswordReset: jest.fn(),
    getErrorMessage: jest.fn().mockReturnValue('Mocked error message'),
  } as unknown as jest.Mocked<AuthService>;
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jest.Mocked<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = buildAuthServiceMock();

    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, CommonModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ─── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start on the sign-in view', () => {
    expect(component.activeView).toBe('sign-in');
  });

  // ─── View transitions ────────────────────────────────────────────────────────

  describe('view transitions', () => {
    it('showRegister() switches to register view', () => {
      component.showRegister();
      expect(component.activeView).toBe('register');
    });

    it('showForgotPassword() switches to forgot-password view', () => {
      component.showForgotPassword();
      expect(component.activeView).toBe('forgot-password');
    });

    it('showSignIn() switches back to sign-in view from register', () => {
      component.showRegister();
      component.showSignIn();
      expect(component.activeView).toBe('sign-in');
    });

    it('showSignIn() resets signInError', () => {
      component.signInError = 'previous error';
      component.showSignIn();
      expect(component.signInError).toBeNull();
    });

    it('showRegister() resets registerError', () => {
      component.registerError = 'previous error';
      component.showRegister();
      expect(component.registerError).toBeNull();
    });

    it('showForgotPassword() resets forgotSuccess and forgotError', () => {
      component.forgotSuccess = true;
      component.forgotError = 'something';
      component.showForgotPassword();
      expect(component.forgotSuccess).toBe(false);
      expect(component.forgotError).toBeNull();
    });
  });

  // ─── Sign-in form ────────────────────────────────────────────────────────────

  describe('sign-in form', () => {
    it('should be invalid when empty', () => {
      expect(component.signInForm.invalid).toBe(true);
    });

    it('should be valid with correct email and password', () => {
      component.signInForm.setValue({ email: 'user@example.com', password: 'secret' });
      expect(component.signInForm.valid).toBe(true);
    });

    it('onSignIn() marks all fields as touched if form is invalid', async () => {
      await component.onSignIn();
      expect(component.signInEmailCtrl.touched).toBe(true);
      expect(component.signInPasswordCtrl.touched).toBe(true);
    });

    it('onSignIn() calls authService.signInWithEmail on valid submission', async () => {
      authService.signInWithEmail.mockResolvedValueOnce({ isNewUser: false });
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.signInForm.setValue({ email: 'user@example.com', password: 'secret' });
      await component.onSignIn();
      expect(authService.signInWithEmail).toHaveBeenCalledWith('user@example.com', 'secret');
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('onSignIn() sets signInError from authService.getErrorMessage on failure', async () => {
      const error = { code: 'auth/wrong-password' };
      authService.signInWithEmail.mockRejectedValueOnce(error);
      authService.getErrorMessage.mockReturnValueOnce('Incorrect password. Try again or reset your password.');
      component.signInForm.setValue({ email: 'user@example.com', password: 'wrong' });
      await component.onSignIn();
      expect(component.signInError).toBe('Incorrect password. Try again or reset your password.');
    });

    it('onSignInInput() clears signInError', () => {
      component.signInError = 'existing error';
      component.onSignInInput();
      expect(component.signInError).toBeNull();
    });

    it('onGoogleSignIn() calls authService.signInWithGoogle', async () => {
      authService.signInWithGoogle.mockResolvedValueOnce({ isNewUser: false });
      await component.onGoogleSignIn();
      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });

    it('onGoogleSignIn() routes first-time Google users to /profile', async () => {
      authService.signInWithGoogle.mockResolvedValueOnce({ isNewUser: true });
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      await component.onGoogleSignIn();
      expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { queryParams: { welcome: '1' } });
    });

    it('onGoogleSignIn() sets signInError on failure', async () => {
      authService.signInWithGoogle.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
      authService.getErrorMessage.mockReturnValueOnce('Sign-in popup was blocked.');
      await component.onGoogleSignIn();
      expect(component.signInError).toBe('Sign-in popup was blocked.');
    });
  });

  // ─── Register form ───────────────────────────────────────────────────────────

  describe('register form', () => {
    beforeEach(() => {
      component.showRegister();
      fixture.detectChanges();
    });

    it('should be invalid when empty', () => {
      expect(component.registerForm.invalid).toBe(true);
    });

    it('should be valid with all fields correctly filled', () => {
      component.registerForm.setValue({
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secure1',
        confirmPassword: 'secure1',
      });
      expect(component.registerForm.valid).toBe(true);
    });

    it('should be invalid when passwords do not match', () => {
      component.registerForm.setValue({
        displayName: 'Jane',
        email: 'jane@example.com',
        password: 'secure1',
        confirmPassword: 'different',
      });
      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should be invalid when password is shorter than 6 characters', () => {
      component.registerPasswordCtrl.setValue('abc');
      component.registerPasswordCtrl.markAsTouched();
      expect(component.registerPasswordCtrl.hasError('minlength')).toBe(true);
    });

    it('onRegister() calls authService.registerWithEmail on valid submission', async () => {
      authService.registerWithEmail.mockResolvedValueOnce({ isNewUser: true });
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.registerForm.setValue({
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secure1',
        confirmPassword: 'secure1',
      });
      await component.onRegister();
      expect(authService.registerWithEmail).toHaveBeenCalledWith(
        'jane@example.com',
        'secure1',
        'Jane Doe',
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { queryParams: { welcome: '1' } });
    });

    it('onRegister() sets registerError on auth/email-already-in-use', async () => {
      authService.registerWithEmail.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      authService.getErrorMessage.mockReturnValueOnce(
        'An account with this email already exists. Try signing in instead.',
      );
      component.registerForm.setValue({
        displayName: 'Jane',
        email: 'taken@example.com',
        password: 'secure1',
        confirmPassword: 'secure1',
      });
      await component.onRegister();
      expect(component.registerError).toBe(
        'An account with this email already exists. Try signing in instead.',
      );
    });

    it('passwordsDoNotMatch is false when passwords match', () => {
      component.registerForm.setValue({
        displayName: 'Jane',
        email: 'jane@example.com',
        password: 'secure1',
        confirmPassword: 'secure1',
      });
      component.registerConfirmCtrl.markAsTouched();
      expect(component.passwordsDoNotMatch).toBe(false);
    });

    it('passwordsDoNotMatch is true when passwords differ and confirm is touched', () => {
      component.registerForm.setValue({
        displayName: 'Jane',
        email: 'jane@example.com',
        password: 'secure1',
        confirmPassword: 'mismatch',
      });
      component.registerConfirmCtrl.markAsTouched();
      expect(component.passwordsDoNotMatch).toBe(true);
    });

    it('onRegisterInput() clears registerError', () => {
      component.registerError = 'some error';
      component.onRegisterInput();
      expect(component.registerError).toBeNull();
    });
  });

  // ─── Forgot-password form ────────────────────────────────────────────────────

  describe('forgot-password form', () => {
    beforeEach(() => {
      component.showForgotPassword();
      fixture.detectChanges();
    });

    it('should be invalid when empty', () => {
      expect(component.forgotForm.invalid).toBe(true);
    });

    it('onSendReset() calls authService.sendPasswordReset with the email', async () => {
      authService.sendPasswordReset.mockResolvedValueOnce(undefined);
      component.forgotForm.setValue({ email: 'user@example.com' });
      await component.onSendReset();
      expect(authService.sendPasswordReset).toHaveBeenCalledWith('user@example.com');
    });

    it('onSendReset() sets forgotSuccess to true on success', async () => {
      authService.sendPasswordReset.mockResolvedValueOnce(undefined);
      component.forgotForm.setValue({ email: 'user@example.com' });
      await component.onSendReset();
      expect(component.forgotSuccess).toBe(true);
    });

    it('onSendReset() shows success even when auth/user-not-found (prevent enumeration)', async () => {
      authService.sendPasswordReset.mockRejectedValueOnce({ code: 'auth/user-not-found' });
      component.forgotForm.setValue({ email: 'ghost@example.com' });
      await component.onSendReset();
      expect(component.forgotSuccess).toBe(true);
      expect(component.forgotError).toBeNull();
    });

    it('onSendReset() sets forgotError for auth/invalid-email', async () => {
      // Use a format that passes Angular's Validators.email but Firebase still rejects
      // (Firebase can reject emails Angular's validator accepts, e.g. exotic TLDs)
      authService.sendPasswordReset.mockRejectedValueOnce({ code: 'auth/invalid-email' });
      authService.getErrorMessage.mockReturnValueOnce('Please enter a valid email address.');
      component.forgotForm.setValue({ email: 'user@example.com' });
      await component.onSendReset();
      expect(component.forgotError).toBe('Please enter a valid email address.');
      expect(component.forgotSuccess).toBe(false);
    });

    it('onForgotInput() clears forgotError', () => {
      component.forgotError = 'some error';
      component.onForgotInput();
      expect(component.forgotError).toBeNull();
    });
  });

  // ─── Auth-state redirect ─────────────────────────────────────────────────────

  describe('auth state redirect', () => {
    it('should navigate to "/" when a user is already authenticated', fakeAsync(() => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      const userSubject = new BehaviorSubject<object | null>(null);
      (authService as unknown as { user$: Observable<object | null> }).user$ = userSubject.asObservable();

      fixture = TestBed.createComponent(AuthComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      userSubject.next({ uid: 'abc' });
      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    }));
  });
});
