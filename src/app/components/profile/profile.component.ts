import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { switchMap } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;
  subscriptionStatus$: Observable<SubscriptionStatus | null>;
  usageStats: {
    pdfsGenerated: number;
  };

  constructor(
    private auth: AuthService,
    private stripe: StripeService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.user$ = this.auth.user$;
    this.usageStats = {
      pdfsGenerated: 0
    };

    this.subscriptionStatus$ = this.auth.user$.pipe(
      switchMap(user => user ? this.stripe.getSubscriptionStatus(user.uid) : of(null))
    );

    this.subscriptionStatus$.subscribe(status => {
      if (status) {
        this.usageStats = {
          pdfsGenerated: status.usage.pdfsGenerated
        };
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit() {}

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async handleSubscription() {
    try {
      const user = await firstValueFrom(this.user$);
      if (!user || !user.email) {
        throw new Error('User must be logged in to subscribe');
      }

      const response = await firstValueFrom(
        this.stripe.createSubscription(user.uid, user.email)
      );
      
      if (response.checkoutUrl) {
        const stripeWindow = window.open(
          response.checkoutUrl,
          'stripe',
          'width=700,height=1000'
        );

        if (stripeWindow) {
          const windowCheck = setInterval(async () => {
            if (stripeWindow.closed) {
              clearInterval(windowCheck);
              const status = await firstValueFrom(this.stripe.getSubscriptionStatus(user.uid));
              if (status?.active) {
                this.dialog.open(IssueComponent, {
                  width: '400px',
                  data: { message: 'Subscription activated successfully!' }
                });
              }
            }
          }, 500);
        }
      }
    } catch (error) {
      this.handleError('Failed to initiate subscription');
    }
  }

  async manageSubscription() {
    try {
      const user = await firstValueFrom(this.user$);
      if (!user) {
        throw new Error('User must be logged in to manage subscription');
      }
      
      const response = await firstValueFrom(this.stripe.createPortalSession(user.uid));
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      this.handleError('Failed to access subscription portal');
    }
  }

  async cancelSubscription() {
    try {
      const status = await firstValueFrom(this.subscriptionStatus$);
      if (!status?.subscription.id) return;

      const dialogRef = this.dialog.open(IssueComponent, {
        width: '500px',
        data: {
          isDeleteDialog: true,
          title: 'Cancel Subscription',
          message: `Are you sure you want to cancel your subscription? Your access will continue until ${this.formatDate(status.subscription.currentPeriodEnd)}.`,
          showConfirmButton: true,
          confirmButtonText: 'Cancel Subscription'
        }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result === 'confirm') {
          try {
            await firstValueFrom(this.stripe.cancelSubscription(status.subscription.id));
            this.dialog.open(IssueComponent, {
              width: '400px',
              data: { 
                message: `Your subscription has been cancelled. You will have access until ${this.formatDate(status.subscription.currentPeriodEnd)}.` 
              }
            });
          } catch (error) {
            this.handleError('Failed to cancel subscription');
          }
        }
      });
    } catch (error) {
      this.handleError('Failed to process cancellation request');
    }
  }

  private handleError(message: string) {
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: { error: message }
    });
  }
}