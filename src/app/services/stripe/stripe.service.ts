import { Injectable } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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




  startCheckout(expirationTime:number, jwtToken:string, downloadTimeRemaining:number) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const options = {
      headers:headers,
      withCredentials:true
    };

    const body = {
      test: true,
      expirationTime: expirationTime ,  
      jwtToken
    };
    return this.http.post(`${this._URL}/start-checkout`, { body, headers }, options);
  }
  // Handle any additional actions after successful payment
  // For example, navigate to a success page or trigger a download
  handlePaymentSuccess(): void {
    this.router.navigate(['/complete']);
  }

  getSubscriptionStatus(uid:string): Observable<any> {
    return this.http.get(`${this._URL}/subscriptions/subscription-status/${uid}`, {
      withCredentials: true
    });
  }
  
  createPortalSession(): Observable<any> {
    return this.http.post(`${this._URL}/subscripions/create-portal-session`, {}, {
      withCredentials: true
    });
  }
}






