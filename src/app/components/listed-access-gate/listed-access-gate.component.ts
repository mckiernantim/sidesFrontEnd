import { Component, Input } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export type ListedAccessState = 'loading' | 'need-signin' | 'denied' | 'allowed';

@Component({
  selector: 'app-listed-access-gate',
  templateUrl: './listed-access-gate.component.html',
  styleUrls: ['./listed-access-gate.component.css'],
  standalone: false,
})
export class ListedAccessGateComponent {
  @Input() state: ListedAccessState = 'loading';

  signingIn = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async signInWithGoogle(): Promise<void> {
    this.signingIn = true;
    this.errorMessage = '';
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      this.errorMessage = this.authService.getErrorMessage(
        error as { code?: string; message?: string }
      );
    } finally {
      this.signingIn = false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      this.errorMessage = this.authService.getErrorMessage(
        error as { code?: string; message?: string }
      );
    }
  }
}
