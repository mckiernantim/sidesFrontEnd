import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService} from 'src/app/services/stripe/stripe.service';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { DatePipe } from '@angular/common';
import { switchMap, pipe, of} from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user$: Observable<User>;
  subscriptionStatus$: Observable<SubscriptionStatus | null>;
  usageStats = {
    pdfsGenerated: 0,
    scriptsProcessed: 0,
    pdfsRemaining: 0,
    scriptsRemaining: 0,
    lastUpdated: null as Date | null
  };

  constructor(
    private auth: AuthService,
    private stripe: StripeService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.subscriptionStatus$ = this.auth.user$.pipe(
      switchMap(user => user ? this.stripe.getSubscriptionStatus(user.uid) : of(null))
    );
  }

  ngOnInit() {
    this.user$ = this.auth.user$;
    this.loadData();
  }

  private async loadData() {
    const user = await firstValueFrom(this.auth.user$);
    if (user) {
      await this.loadUsageStats(user.uid);
    }
  }

  async loadUsageStats(userId: string) {
    try {
      const stats = await firstValueFrom(this.stripe.getSubscriptionStatus(userId));
      this.usageStats = {
        pdfsGenerated: stats.usage.pdfsGenerated,
        scriptsProcessed: stats.usage.scriptsProcessed,
        pdfsRemaining: stats.usage.limits.remaining.pdfs,
        scriptsRemaining: stats.usage.limits.remaining.scripts,
        lastUpdated: stats.usage.lastUpdated
      };
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      this.handleError('Failed to load usage statistics');
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  async handleSubscription() {
    try {
      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        throw new Error('User must be logged in to subscribe');
      }

      // Create new subscription
      const response = await firstValueFrom(this.stripe.createSubscription(user.uid, user.email));
      
      if (response.checkoutUrl) {
        const stripeWindow = window.open(
          response.checkoutUrl,
          'stripe',
          'width=700,height=1000'
        );

        // Monitor window closure
        const windowCheck = setInterval(async () => {
          if (stripeWindow?.closed) {
            clearInterval(windowCheck);
            await this.loadData();
            
            const newStatus = await firstValueFrom(this.stripe.getSubscriptionStatus(user.uid));
            if (newStatus?.active) {
              this.dialog.open(IssueComponent, {
                width: '400px',
                data: { message: 'Subscription activated successfully!' }
              });
            }
          }
        }, 500);
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
      
      const response = await firstValueFrom(this.stripe.createPortalSession(user.uid));
      
      if (response?.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Failed to get portal URL');
      }
    } catch (error) {
      this.handleError('Failed to access subscription portal. Please try again.');
    }
  }

  async cancelSubscription() {
    try {
      const status = await firstValueFrom(this.subscriptionStatus$);
      if (!status) return;

      const dialogRef = this.dialog.open(IssueComponent, {
        width: '500px',
        data: {
          isDeleteDialog: true,
          title: 'Cancel Subscription',
          message: `Are you sure you want to cancel your subscription? Your access will continue until ${this.formatDate(status.subscription.currentPeriodEnd)}.`,
          showConfirmButton: true,
          confirmButtonText: 'Cancel Subscription',
          subscriptionActive: status.active
        }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result === 'confirm' && status.subscription.id) {
          try {
            await this.stripe.cancelSubscription(status.subscription.id);
            await this.loadData();
            
            this.dialog.open(IssueComponent, {
              width: '400px',
              data: { 
                message: `Your subscription has been cancelled. You will have access until ${this.formatDate(status.subscription.currentPeriodEnd)}.` 
              }
            });
          } catch (error) {
            this.handleError('Failed to cancel subscription. Please try again.');
          }
        }
      });
    } catch (error) {
      this.handleError('Failed to process cancellation request. Please try again.');
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

  private handleError(message: string) {
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: { error: message }
    });
  }
}