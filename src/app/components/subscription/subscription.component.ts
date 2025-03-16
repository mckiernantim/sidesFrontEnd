import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';
import { StripeService } from '../../services/stripe/stripe.service';
import { AuthService } from '../../services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubscriptionStatus } from '../../types/SubscriptionTypes';
import { User } from '@angular/fire/auth';

@Component({
    selector: 'app-subscription',
    templateUrl: './subscription.component.html',
    styleUrls: ['./subscription.component.css'],
    standalone: false
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  subscriptionData$: Observable<SubscriptionStatus>;

  constructor(
    private stripeService: StripeService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.subscriptionData$ = this.authService.user$.pipe(
      switchMap(user => user ? this.stripeService.getSubscriptionStatus(user.uid) : of(null)),
      takeUntil(this.destroy$)
    );
  }

  async startSubscription() {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.snackBar.open('Please sign in to subscribe', 'Close', { duration: 3000 });
      return;
    }

    try {
      const response = await firstValueFrom(this.stripeService.createSubscription(user.uid, user.email));
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      this.snackBar.open('Failed to start subscription process', 'Close', { duration: 3000 });
    }
  }

  async manageSubscription() {
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      this.snackBar.open('Please sign in to manage your subscription', 'Close', { duration: 3000 });
      return;
    }

    try {
      const response = await firstValueFrom(this.stripeService.createPortalSession(user.uid, user.email));
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      this.snackBar.open('Failed to open subscription portal', 'Close', { duration: 3000 });
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}