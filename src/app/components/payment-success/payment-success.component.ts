import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DateFormatPipe } from 'src/app/pipes/date-format.pipe';
import { StripeService } from 'src/app/services/stripe/stripe.service';
@Component({
    selector: 'app-payment-success',
    templateUrl: './payment-success.component.html',
    styleUrls: ['./payment-success.component.css'],
    standalone: false
})
export class PaymentSuccessComponent implements OnInit {
  nextBillingDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  /** Test-mode warning must disappear on its own once Stripe is switched to live keys */
  showTestModeBanner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private datePipe: DateFormatPipe,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    this.showTestModeBanner = !this.stripeService.isLive;

    // Get session ID from URL if available
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      
      if (sessionId) {
        this.verifyPayment(sessionId);
      }
    });

    // Set your next billing date here
    this.nextBillingDate = new Date();
    this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + 1);
  }

  async verifyPayment(sessionId: string): Promise<void> {
    try {
      // Verify the payment with your backend
      // const result = await this.subscriptionService.verifyPayment(sessionId);
      
      // Update the next billing date based on the response
      // this.nextBillingDate = new Date(result.nextBillingDate);
      
      console.log('Payment verified:', sessionId);
    } catch (error) {
      console.error('Error verifying payment:', error);
      // Handle error - maybe redirect to an error page
    }
  }
}
