import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StripeService } from 'src/app/services/stripe/stripe.service';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueComponent } from '../issue/issue.component';
import { switchMap, catchError, tap } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from 'src/app/types/SubscriptionTypes';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: false
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;
  subscriptionStatus$: Observable<SubscriptionStatus | null>;
  usageStats: {
    pdfsGenerated: number;
  };
  isLoading = true;
  subscriptionBenefits = [
    'Unlimited PDF generations',
    'Priority customer support',
    'Access to premium templates',
    'Advanced customization options'
  ];
  subscriptionPrice = '$20 per week';

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
    
    // Assign the subscription status observable
    this.subscriptionStatus$ = this.stripe.subscriptionStatus$;
  }

  ngOnInit() {
    // Set initial loading state
    this.isLoading = true;
    
    // Subscribe to user changes
    this.auth.user$.subscribe(user => {
      if (!user) {
        this.isLoading = false;
        console.log('No authenticated user found');
      }
    });
    
    // Subscribe to subscription status changes
    this.subscriptionStatus$.subscribe(status => {
      this.isLoading = false;
      debugger
      if (status) {
        console.log('Subscription status received:', status);
        
        // Update usage stats if available
        if (status.usage) {
          this.usageStats = {
            pdfsGenerated: status.usage.pdfsGenerated || 0
          };
        }
        
        // Log subscription details
        if (status.subscription) {
          console.log('Subscription details:', {
            active: status.active,
            renewalDate: status.subscription.currentPeriodEnd,
            autoRenew: !status.subscription.cancelAtPeriodEnd
          });
        }
      } else {
        console.log('No subscription status available');
      }
    });
  }


  logout() {
    this.auth.signOut();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
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
      this.showError(error);
    }
  }

  async manageSubscription() {
    try {
      const user = await firstValueFrom(this.auth.user$);
      if (!user) {
        throw new Error('User must be logged in to manage subscription');
      }
      
      console.log('Opening subscription portal for user:', user.uid);
      const response = await firstValueFrom(this.stripe.createPortalSession(user.uid, user.email));
      
      if (response?.url) {
        console.log('Redirecting to portal URL:', response.url);
        window.location.href = response.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Failed to open subscription portal:', error);
      this.showError({
        message: 'Failed to open subscription management',
        details: error.message || 'Unknown error'
      });
    }
  }

  private showError(error: any) {
    this.dialog.open(IssueComponent, {
      width: '400px',
      data: { 
        error: true,
        errorDetails: error.message || 'An error occurred',
        errorReason: error.details || '',
        statusCode: error.statusCode
      }
    });
  }
}