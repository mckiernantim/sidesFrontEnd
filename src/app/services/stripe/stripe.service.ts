import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripePromise = loadStripe(environment.stripe);
  private priceId = 'price_1NRjH8BojwZRnVT43UC6rDPf';
  private paymentComplete = false;
  public _URL:string = environment.url;
  constructor(private http: HttpClient, private router:Router) {}




  startCheckout() {
    console.log(`${this._URL}`)
    return this.http.post(`${this._URL}/start-checkout`, { test:true });
  }
  handlePaymentSuccess(): void {
    // Handle any additional actions after successful payment
    // For example, navigate to a success page or trigger a download
    this.router.navigate(['complete']);
  }
}






