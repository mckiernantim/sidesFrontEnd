import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';
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
  
  // Subscription data
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
  
  // Load subscription data
  loadSubscriptionData(): void {
    if (!this.user) {
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading subscription data for user:', this.user.uid);
    
    // Set a timeout to handle server downtime
    const timeoutId = setTimeout(() => {
      if (this.isLoading) {
        console.error('Subscription data loading timed out');
        this.isLoading = false;
        this.error = 'Unable to connect to the server. Please try again later.';
      }
    }, 10000); // 10 seconds timeout
    
    this.stripe.getSubscriptionStatus(this.user.uid).subscribe({
      next: (subscription) => {
        clearTimeout(timeoutId); // Clear the timeout on success
        console.log('Subscription data loaded:', subscription);
        this.subscription = subscription;
        this.isLoading = false;
      },
      error: (error) => {
        clearTimeout(timeoutId); // Clear the timeout on error
        console.error('Error loading subscription', error);
        this.error = 'Failed to load subscription data. Server may be down.';
        this.isLoading = false;
      }
    });
  }
  
  // Check if subscription is active
  isSubscriptionActive(): boolean {
    if (!this.subscription) return false;
    
    // Check if subscription is active based on status
    const status = this.subscription.subscription?.status;
    if (status === 'active' || status === 'trialing' || status === 'pending') {
      return true;
    }
    
    // Check if subscription is past due but still in grace period
    if (status === 'past_due') {
      return true;
    }
    
    // Check if subscription is canceled but still in paid period
    if (status === 'canceled' && this.subscription.subscription?.currentPeriodEnd) {
      const endDate = new Date(this.subscription.subscription.currentPeriodEnd);
      const now = new Date();
      return endDate > now;
    }
    
    return false;
  }
  
  // Check if subscription is pending
  isSubscriptionPending(): boolean {
    return this.subscription?.subscription?.status === 'pending';
  }
  
  // Check if subscription is active but will be canceled
  isSubscriptionCanceling(): boolean {
    return this.subscription?.subscription?.cancelAtPeriodEnd === true;
  }
  
  // Handle new subscription
  handleNewSubscription(): void {
    debugger
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
    debugger
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
          window.location.href = result.url;
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

  // Format dates
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format currency
  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '$0.00';
    
    // Convert cents to dollars
    const dollars = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(dollars);
  }

  refreshSubscriptionStatus(): void {
    if (this.user) {
      this.loadSubscriptionData();
    }
  }
}