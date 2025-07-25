import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '@angular/fire/auth';
import { 
  SubscriptionStatus, 
  getUsageSummary, 
  getSubscriptionActions, 
  formatSubscriptionStatus,
  formatPlanName,
  formatAmount,
  getDaysUntilReset
} from 'src/app/types/SubscriptionTypes';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  // User data
  user: User | null = null;
  
  // Subscription data - now contains everything from the consolidated API
  subscription: SubscriptionStatus | null = null;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  
  // Subscription benefits
  benefits: string[] = [
    'Unlimited document processing',
    'Priority support',
    'Advanced formatting options',
    'Cloud storage for your documents'
  ];
  
  // Router subscription
  private routerSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  
  @Output() subscriptionActivated = new EventEmitter<void>();
  
  constructor(
    private auth: AuthService,
    private stripe: StripeService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Profile component initialized');
    
    // Subscribe to auth state changes
    this.authSubscription = this.auth.user$.subscribe(user => {
      this.user = user;
      if (user) {
        console.log('User is authenticated, loading subscription data');
        this.loadSubscriptionData();
      } else {
        console.log('User is not authenticated');
        this.isLoading = false;
      }
    });
    
    // Set up router event listener to refresh data when navigating back to this page
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      console.log('Navigation event detected, refreshing data');
      // Clear the cache to force a fresh fetch
      this.stripe.clearCache();
      // Reload data if user is authenticated
      if (this.user) {
        this.loadSubscriptionData();
      }
    });
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  
  // Load subscription data - now gets everything in one call
  loadSubscriptionData(): void {
    if (!this.user) {
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading consolidated subscription data for user:', this.user.uid);
    
    // Set a timeout to handle server downtime
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.error('Subscription data loading timed out');
        this.isLoading = false;
        this.error = 'Unable to connect to the server. Please try again later.';
      }
    }, 10000); // 10 seconds timeout
    
    this.stripe.getSubscriptionStatus(this.user.uid).subscribe({
      next: (subscriptionData) => {
        clearTimeout(timeoutId); // Clear the timeout on success
        console.log('Consolidated subscription data loaded:', subscriptionData);
        this.subscription = subscriptionData;
        this.isLoading = false;
        
        // Emit event if subscription is now active
        if (this.isSubscriptionActive()) {
          this.subscriptionActivated.emit();
        }
      },
      error: (error) => {
        clearTimeout(timeoutId); // Clear the timeout on error
        console.error('Error loading subscription', error);
        this.error = 'Failed to load subscription data. Server may be down.';
        this.isLoading = false;
      }
    });
  }
  
  // Check if subscription is active - now uses the consolidated active flag
  isSubscriptionActive(): boolean {
    if (!this.subscription) return false;
    
    // Use the consolidated active flag from the backend
    return this.subscription.active;
  }
  
  // Check if subscription is pending
  isSubscriptionPending(): boolean {
    return this.subscription?.subscription?.status === 'pending';
  }
  
  // Check if subscription is active but will be canceled
  isSubscriptionCanceling(): boolean {
    return this.subscription?.subscription?.cancelAtPeriodEnd === true;
  }
  
  // Check if subscription is in grace period after cancellation
  isInGracePeriod(): boolean {
    const status = this.subscription?.subscription?.status;
    return status === 'active_until_period_end';
  }
  
  // Get usage summary using the new utility function
  getUsageSummary() {
    if (!this.subscription) return null;
    return getUsageSummary(this.subscription);
  }
  
  // Get subscription actions using the new utility function
  getSubscriptionActions() {
    if (!this.subscription) return null;
    return getSubscriptionActions(this.subscription);
  }
  
  // Check if user can generate PDFs
  canGeneratePdf(): boolean {
    if (!this.subscription) return false;
    return this.stripe.canGeneratePdf(this.subscription);
  }
  
  // Get formatted subscription status
  getFormattedStatus(): string {
    const status = this.subscription?.subscription?.status;
    return formatSubscriptionStatus(status);
  }
  
  // Get formatted plan name
  getFormattedPlan(): string {
    const plan = this.subscription?.subscription?.plan;
    return formatPlanName(plan);
  }
  
  // Get days until usage reset
  getDaysUntilReset(): number | null {
    if (!this.subscription) return null;
    return getDaysUntilReset(this.subscription);
  }
  
  // Get usage percentage for progress bars
  getUsagePercentage(): number {
    const usage = this.getUsageSummary();
    if (!usage || usage.limit === 0) return 0;
    return Math.min(100, (usage.used / usage.limit) * 100);
  }
  
  // Check if usage is near limit (for warnings)
  isUsageNearLimit(): boolean {
    const usage = this.getUsageSummary();
    if (!usage || usage.limit === 0) return false;
    return usage.remaining <= 1; // Warning when 1 or fewer PDFs remain
  }
  
  // Handle new subscription
  handleNewSubscription(): void {
    if (!this.user || !this.user.email) {
      this.error = 'You must be logged in to subscribe';
      return;
    }
    
    console.log('Creating new subscription for user:', this.user.uid);
    this.isLoading = true;
    
    this.stripe.createPortalSession(this.user.uid, this.user.email).subscribe({
      next: (result) => {
        console.log('Portal session result:', result);
        this.isLoading = false;
        
        if (!result.success) {
          this.error = result.error || 'Failed to create subscription';
        }
        // Note: On success, user will be redirected to Stripe
      },
      error: (error) => {
        console.error('Error creating subscription', error);
        this.error = 'An error occurred while creating your subscription';
        this.isLoading = false;
      }
    });
  }
  
  // Manage existing subscription
  manageSubscription(): void {
    if (!this.user || !this.user.email) {
      this.error = 'You must be logged in to manage your subscription';
      return;
    }
    
    console.log('Opening portal for user:', this.user.uid);
    this.isLoading = true;
    
    this.stripe.createPortalSession(this.user.uid, this.user.email).subscribe({
      next: (result) => {
        console.log('Portal session result:', result);
        this.isLoading = false;
        
        if (result.success && result.url) {
          // User will be redirected to Stripe portal
        } else {
          this.error = result.error || 'Failed to open subscription management';
        }
      },
      error: (error) => {
        console.error('Error opening portal', error);
        this.error = 'An error occurred while opening subscription management';
        this.isLoading = false;
      }
    });
  }
  
  // Sign in with Google
  signIn(): void {
    this.auth.signInWithGoogle();
  }
  
  // Logout
  logout(): void {
    this.auth.signOut();
  }

  // Format dates - enhanced for the new structure
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format currency - works with the new amount structure
  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    
    // Convert cents to dollars
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(dollars);
  }
  
  // Format relative date (e.g., "in 5 days", "2 days ago")
  formatRelativeDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `in ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return this.formatDate(dateString);
  }

  // Refresh subscription status
  refreshSubscriptionStatus(): void {
    if (this.user) {
      console.log('Manually refreshing subscription status');
      this.stripe.clearCache();
      this.loadSubscriptionData();
    }
  }
  
  // Get subscription period info
  getSubscriptionPeriodInfo(): string | null {
    if (!this.subscription?.subscription) return null;
    
    const sub = this.subscription.subscription;
    const plan = sub.plan;
    
    if (!plan) return null;
    
    const start = this.formatDate(sub.currentPeriodStart);
    const end = this.formatDate(sub.currentPeriodEnd);
    
    return `${start} - ${end}`;
  }
  
  // Get next billing date
  getNextBillingDate(): string | null {
    if (!this.subscription?.subscription?.currentPeriodEnd) return null;
    
    if (this.subscription.subscription.cancelAtPeriodEnd) {
      return `Subscription ends on ${this.formatDate(this.subscription.subscription.currentPeriodEnd)}`;
    }
    
    return `Next billing: ${this.formatDate(this.subscription.subscription.currentPeriodEnd)}`;
  }
  
  // Get payment status info
  getLastPaymentInfo(): string | null {
    const payment = this.subscription?.lastPayment;
    if (!payment) return null;
    
    const status = payment.status === 'succeeded' ? 'successful' : payment.status;
    const amount = payment.amount ? this.formatCurrency(payment.amount) : '';
    const date = payment.date ? this.formatDate(payment.date) : '';
    
    return `Last payment ${status}: ${amount} on ${date}`;
  }
}