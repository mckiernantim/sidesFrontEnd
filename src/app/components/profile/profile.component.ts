// profile.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { DatePipe } from '@angular/common';
import { switchMap, pipe, of} from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userData: any;
  user$:Observable<User>;
  subscriptionStatus$ = this.auth.user$.pipe(
    switchMap(user => user ? this.stripe.getSubscriptionStatus(user.uid) : of(null))
  );
  usageStats = {
    pdfsGenerated: 0,
    scriptsProcessed: 0,
    storageUsed: '0 MB'
  };

  constructor(
    private auth: AuthService,
    private stripe: StripeService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user$ = this.auth.user$;
  }

  async loadUsageStats(userId: string) {
    try {
      // Implement this method in your StripeService

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  async handleSignOut() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      this.handleError('Failed to sign out. Please try again.');
    }
  }

  async handleSubscription() {
    try {
      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        throw new Error('User must be logged in to subscribe');
      }
      

    } catch (error) {
      this.handleError('Failed to initiate subscription. Please try again.');
    }
  }

  async manageSubscription() {
    try {
      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        throw new Error('User must be logged in to manage subscription');
      }
      
      const portalUrl = ""
      window.location.href = portalUrl;
    } catch (error) {
      this.handleError('Failed to access subscription portal. Please try again.');
    }
  }

  async deleteAccount() {
    const dialogRef = this.dialog.open(IssueComponent, {
      width: '400px',
      data: {
        title: 'Delete Account',
        message: 'Are you sure you want to delete your account? This action cannot be undone.',
        showConfirmButton: true,
        confirmButtonText: 'Delete Account'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'confirm') {
        try {
        
          this.router.navigate(['/']);
        } catch (error) {
          this.handleError('Failed to delete account. Please try again.');
        }
      }
    });
  }

  private handleError(message: string) {
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: { error: message }
    });
  }
}