import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, switchMap, BehaviorSubject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { catchError, tap } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus, SubscriptionStatusType, SUBSCRIPTION_STATUS_DISPLAY } from 'src/app/types/SubscriptionTypes';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  // User data
  user: User | null = null;
  
  // Subscription data
  subscription$ = new BehaviorSubject<SubscriptionStatus | null>(null);
  subscription: SubscriptionStatus | null = null;
  renewalDate: Date | null = null;
  expirationDate: Date | null = null;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  
  // Usage stats
  usageStats = {
    pdfsGenerated: 0
  };
  
  // Subscription benefits for marketing
  subscriptionBenefits = [
    'Unlimited PDF generations',
    'Priority customer support',
    'Access to premium templates',
    'Advanced customization options'
  ];
  subscriptionPrice = '$20 per week';
  
  // Subscriptions to clean up
  private subscriptions = new Subscription();

  constructor(
    private auth: AuthService,
    private stripe: StripeService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get current user
    this.user = this.auth.getCurrentUser();
    
    if (!this.user) {
      console.log('PROFILE: No authenticated user found');
      this.isLoading = false;
      return;
    }
    
    // Load subscription data
    this.loadSubscriptionData();
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
  
  // Load subscription data
  loadSubscriptionData(): void {
    if (!this.user) {
      this.isLoading = false;
      return;
    }
    
    console.log('PROFILE: Loading subscription data for user', this.user.uid);
    
    const sub = this.stripe.getSubscriptionStatus(this.user.uid).subscribe({
      next: (subscription) => {
        console.log('PROFILE: Subscription loaded', subscription);
        debugger
        // Store the subscription
        this.subscription = subscription;
        this.subscription$.next(subscription);
        
        // Process dates
        this.processSubscriptionDates(subscription);
        
        // Update usage stats
        if (subscription.usage) {
          this.usageStats.pdfsGenerated = subscription.usage.pdfsGenerated || 0;
        }
        
        // Update loading state
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('PROFILE: Error loading subscription', error);
        this.error = 'Failed to load subscription data';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  // Process subscription dates
  private processSubscriptionDates(subscription: SubscriptionStatus): void {
    if (!subscription?.subscription?.currentPeriodEnd) {
      this.renewalDate = null;
      this.expirationDate = null;
      return;
    }
    
    const endDate = new Date(subscription.subscription.currentPeriodEnd);
    const status = subscription.subscription.status?.toLowerCase() || '';
    
    if (status === 'canceled') {
      this.expirationDate = endDate;
      this.renewalDate = null;
      console.log('PROFILE: Subscription is canceled, expires on', endDate);
    } else {
      this.renewalDate = endDate;
      this.expirationDate = null;
      console.log('PROFILE: Subscription renews on', endDate);
    }
  }
  
  // Format date for display
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Handle new subscription
  handleNewSubscription(): void {
    if (!this.user || !this.user.email) {
      this.showError('You must be logged in to subscribe');
      return;
    }
    
    const sub = this.stripe.createSubscription(this.user.uid, this.user.email).subscribe({
      next: (result) => {
        console.log('PROFILE: Subscription creation result', result);
     
        // Check for url property in the response
        if (result.success && result.url) {
          console.log('Redirecting to checkout URL:', result.url);
          // Redirect to Stripe checkout
          window.location.href = result.url;
        } else if (result.success && result.checkoutUrl) {
          console.log('Redirecting to checkout URL:', result.checkoutUrl);
          // Redirect to Stripe checkout (using checkoutUrl property)
          window.location.href = result.checkoutUrl;
        } else {
          console.error('No URL found in response:', result);
          this.showError('Failed to create subscription: No checkout URL received');
        }
      },
      error: (error) => {
        console.error('PROFILE: Error creating subscription', error);
        this.showError('An error occurred while creating your subscription');
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  // Manage existing subscription
  manageSubscription(): void {

    if (!this.user || !this.user.email) {
      this.showError('You must be logged in to manage your subscription');
      return;
    }
    
    const sub = this.stripe.createPortalSession(this.user.uid, this.user.email).subscribe({
      next: (result) => {
        if (result.success && result.url) {
          // Redirect to Stripe portal
          window.location.href = result.url;
        } else {
          this.showError('Failed to open subscription management');
        }
      },
      error: (error) => {
        console.error('PROFILE: Error opening portal', error);
        this.showError('An error occurred while opening subscription management');
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  // Show error dialog
  private showError(message: string): void {
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: { 
        error: true,
        errorDetails: message,
        errorReason: '',
        statusCode: null
      }
    });
  }
  
  // Logout
  logout(): void {
    this.auth.signOut();
  }

  // Helper functions to determine subscription status
  getSubscriptionStatusType(subscription: SubscriptionStatus): SubscriptionStatusType {
    if (!subscription?.subscription?.status) {
      return 'none';
    }
    
    const status = subscription.subscription.status.toLowerCase();
    const willAutoRenew = subscription.subscription.willAutoRenew;
    
    if (status === 'active' || status === 'trialing') {
      return willAutoRenew ? 'active' : 'expiring';
    } else if (status === 'canceled') {
      return 'canceled';
    }
    
    return 'none';
  }

  getStatusColor(subscription: SubscriptionStatus): string {
    const statusType = this.getSubscriptionStatusType(subscription);
    return SUBSCRIPTION_STATUS_DISPLAY[statusType].color;
  }

  getStatusIcon(subscription: SubscriptionStatus): string {
    const statusType = this.getSubscriptionStatusType(subscription);
    return SUBSCRIPTION_STATUS_DISPLAY[statusType].icon;
  }

  getStatusText(subscription: SubscriptionStatus): string {
    const statusType = this.getSubscriptionStatusType(subscription);
    return SUBSCRIPTION_STATUS_DISPLAY[statusType].text;
  }
}