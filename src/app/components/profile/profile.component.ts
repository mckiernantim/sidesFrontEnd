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

  private async loadData() {
    const user = await firstValueFrom(this.auth.user$);
    if (user) {
      this.loadUsageStats(user.uid);
    }
  }

  async loadUsageStats(userId: string) {
    try {
      const stats = await firstValueFrom(this.stripe.getSubscriptionStatus(userId));
      this.usageStats = {
        pdfsGenerated: stats.usage.pdfsGenerated,
        scriptsProcessed: stats.usage.scriptsProcessed,
        storageUsed: this.formatStorageSize(stats.usage.storageUsed || 0),
      };
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      this.handleError('Failed to load usage statistics');
    }
  }

  formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(timestamp: number | null): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async handleSignOut() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/']);
    } catch (error) {
      this.handleError('Failed to sign out. Please try again.');
    }
  }

// profile.component.ts

async handleSubscription() {
  try {
    const user = await firstValueFrom(this.auth.user$);
    if (!user) {
      throw new Error('User must be logged in to subscribe');
    }
    debugger
    const status = await firstValueFrom(this.stripe.getSubscriptionStatus(user.uid));
    
    // If already subscribed, redirect to management portal
    if (status?.subscription?.status === 'active') {
      await this.manageSubscription();
      return;
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
          // Refresh subscription status
          await this.loadData();
          // Check if subscription was successful
          const newStatus = await firstValueFrom(this.stripe.getSubscriptionStatus(user.uid));
          if (newStatus?.subscription?.status === 'active') {
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
    
    // Get portal session URL
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

 // profile.component.ts
 async cancelSubscription() {
  const dialogRef = this.dialog.open(IssueComponent, {
    width: '500px',
    data: {
      isDeleteDialog: true,
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.',
      showConfirmButton: true,
      confirmButtonText: 'Cancel Subscription',
      subscriptionActive: await firstValueFrom(this.subscriptionStatus$).then(status => status?.subscription?.status === 'active')
    }
  });

  dialogRef.afterClosed().subscribe(async result => {
    if (result === 'confirm') {
      try {
        const status = await firstValueFrom(this.subscriptionStatus$);
        if (status?.subscription?.status === 'active') {
          await this.stripe.cancelSubscription(status.subscription.stripeSubscriptionId);
          // Optionally refresh the subscription status
          await this.loadData();
          this.dialog.open(IssueComponent, {
            width: '400px',
            data: { message: 'Your subscription has been cancelled successfully.' }
          });
        }
      } catch (error) {
        this.handleError('Failed to cancel subscription. Please try again.');
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