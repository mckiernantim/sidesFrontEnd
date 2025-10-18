import { Component, OnInit } from '@angular/core';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { Observable, firstValueFrom, take } from 'rxjs';
import { User } from '@angular/fire/auth';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { fadeInOutAnimation } from '../../animations/animations';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css'],
  animations: [fadeInOutAnimation],
  standalone: false
})
export class PricingComponent implements OnInit {
  user$: Observable<User | null>;
  currentUser: User | null = null;
  subscriptionStatus$: Observable<SubscriptionStatus>;
  isLoading = true;
  
  constructor(
    private stripeService: StripeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.subscriptionStatus$ = this.stripeService.subscriptionStatus$;
    
    // Get current user
    this.user$.pipe(take(1)).subscribe(user => {
      this.currentUser = user;
    
      if (user) {
        this.stripeService.getSubscriptionStatus(user.uid);
      }
      
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    });
  }

  signIn(): void {
    this.authService.signInWithGoogle();
  }

  async subscribe(): Promise<void> {
    const user = this.currentUser || await firstValueFrom(this.user$.pipe(take(1)));
    
    if (!user) {
      console.error('No user found');
      return;
    }

    this.stripeService.createPortalSession(user.uid, user.email).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          window.location.href = response.url;
        }
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
      }
    });
  }

  manageSubscription(): void {
    // Use the stored user if available
    if (this.currentUser) {
      this.stripeService.createPortalSession(this.currentUser.uid, this.currentUser.email).subscribe({
        next: (response) => {
          if (response.success && response.url) {
            window.location.href = response.url;
          }
        },
        error: (error) => {
          console.error('Error creating portal session:', error);
        }
      });
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  }
} 