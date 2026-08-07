import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { Subscription } from 'rxjs';

/** Possible views rendered inside the single auth component. */
export type AuthView = 'sign-in' | 'register' | 'forgot-password';

/** Validate that password and confirmPassword fields match. */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  standalone: false,
})
export class AuthComponent implements OnInit, OnDestroy {
  @Input() isModal = false;
  @Output() closeModal = new EventEmitter<void>();

  // ─── View state ─────────────────────────────────────────────────────────────

  activeView: AuthView = 'sign-in';

  // ─── Sign-in form ────────────────────────────────────────────────────────────

  signInForm: FormGroup;
  signInError: string | null = null;
  isSigningIn = false;

  // ─── Register form ───────────────────────────────────────────────────────────

  registerForm: FormGroup;
  registerError: string | null = null;
  isRegistering = false;

  // ─── Forgot password form ────────────────────────────────────────────────────

  forgotForm: FormGroup;
  forgotError: string | null = null;
  forgotSuccess = false;
  isSendingReset = false;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  private authSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private stripeService: StripeService,
    private router: Router,
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.registerForm = this.fb.group(
      {
        displayName: ['', [Validators.required, Validators.minLength(1)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator },
    );

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.authSub = this.authService.user$.subscribe(user => {
      if (user) {
        if (this.isModal) {
          // Modal sign-ins never check scheduling entitlement or redirect —
          // the host page keeps control of navigation (spec 028 US1).
          this.closeModal.emit();
        } else {
          this.routeAfterSignIn(user.uid);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  /**
   * Explicit (non-modal) sign-in routing. Spec 029 research D1 realigns this:
   * the upload screen ("/") is the single source of truth for the
   * Upload-new-script / Use-saved-project choice (`shouldShowUploadEntryToggle`),
   * so scheduling-tier users land directly on "/" instead of the old
   * `/start` PostLoginChoice screen — that would otherwise be a second,
   * competing dual-path UI (contracts/upload-entry-ui.md §3, forbidden).
   * Non-premium keeps today's exact behavior. Any entitlement-check failure
   * falls back to "/" rather than trapping the user.
   */
  private routeAfterSignIn(uid: string): void {
    this.stripeService.getSubscriptionStatus(uid).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      },
    });
  }

  // ─── Navigation between views ────────────────────────────────────────────────

  showSignIn(): void {
    this.activeView = 'sign-in';
    this.signInError = null;
    this.signInForm.reset();
  }

  showRegister(): void {
    this.activeView = 'register';
    this.registerError = null;
    this.registerForm.reset();
  }

  showForgotPassword(): void {
    this.activeView = 'forgot-password';
    this.forgotError = null;
    this.forgotSuccess = false;
    this.forgotForm.reset();
  }

  // ─── Sign-in ─────────────────────────────────────────────────────────────────

  async onSignIn(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.isSigningIn = true;
    this.signInError = null;

    const { email, password } = this.signInForm.value as { email: string; password: string };

    try {
      await this.authService.signInWithEmail(email, password);
      // onAuthStateChanged will fire; the ngOnInit subscriber navigates away
    } catch (error) {
      this.signInError = this.authService.getErrorMessage(
        error as { code?: string; message?: string },
      );
    } finally {
      this.isSigningIn = false;
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.signInError = null;
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      this.signInError = this.authService.getErrorMessage(
        error as { code?: string; message?: string },
      );
    }
  }

  // Clear sign-in error as the user types
  onSignInInput(): void {
    this.signInError = null;
  }

  // ─── Register ────────────────────────────────────────────────────────────────

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegistering = true;
    this.registerError = null;

    const { email, password, displayName } = this.registerForm.value as {
      email: string;
      password: string;
      displayName: string;
      confirmPassword: string;
    };

    try {
      await this.authService.registerWithEmail(email, password, displayName);
      // onAuthStateChanged fires; ngOnInit subscriber navigates away
    } catch (error) {
      this.registerError = this.authService.getErrorMessage(
        error as { code?: string; message?: string },
      );
    } finally {
      this.isRegistering = false;
    }
  }

  // Clear register error as the user types
  onRegisterInput(): void {
    this.registerError = null;
  }

  // ─── Forgot password ─────────────────────────────────────────────────────────

  async onSendReset(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSendingReset = true;
    this.forgotError = null;
    this.forgotSuccess = false;

    const { email } = this.forgotForm.value as { email: string };

    try {
      await this.authService.sendPasswordReset(email);
      // Always show the generic success message — never confirm account existence
      this.forgotSuccess = true;
    } catch (error) {
      const code = (error as { code?: string }).code;
      // auth/user-not-found is intentionally suppressed to prevent email enumeration
      if (code === 'auth/user-not-found') {
        this.forgotSuccess = true;
      } else {
        this.forgotError = this.authService.getErrorMessage(
          error as { code?: string; message?: string },
        );
      }
    } finally {
      this.isSendingReset = false;
    }
  }

  // Clear forgot error as the user types
  onForgotInput(): void {
    this.forgotError = null;
  }

  // ─── Convenience accessors for template ─────────────────────────────────────

  get signInEmailCtrl(): AbstractControl {
    return this.signInForm.get('email')!;
  }

  get signInPasswordCtrl(): AbstractControl {
    return this.signInForm.get('password')!;
  }

  get registerDisplayNameCtrl(): AbstractControl {
    return this.registerForm.get('displayName')!;
  }

  get registerEmailCtrl(): AbstractControl {
    return this.registerForm.get('email')!;
  }

  get registerPasswordCtrl(): AbstractControl {
    return this.registerForm.get('password')!;
  }

  get registerConfirmCtrl(): AbstractControl {
    return this.registerForm.get('confirmPassword')!;
  }

  get forgotEmailCtrl(): AbstractControl {
    return this.forgotForm.get('email')!;
  }

  get passwordsDoNotMatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      (this.registerConfirmCtrl.dirty || this.registerConfirmCtrl.touched)
    );
  }
}
