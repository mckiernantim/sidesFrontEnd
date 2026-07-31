import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  SubscriptionStatus,
  getSubscriptionExpirationLabel,
  getSubscriptionTypeLabel,
} from 'src/app/types/SubscriptionTypes';

@Component({
  selector: 'app-checkout-modal',
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.css'],
  standalone: false
})
export class CheckoutModalComponent implements OnInit {
  @Input() selectedScenes: any[] = [];
  @Input() userData: any;
  @Input() subscriptionStatus: SubscriptionStatus | null = null;
  @Output() checkout = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  showTerms: boolean = false;
  agreeToTerms: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  get subscriptionTypeLabel(): string {
    return getSubscriptionTypeLabel(this.subscriptionStatus);
  }

  get subscriptionExpirationLabel(): string {
    return getSubscriptionExpirationLabel(this.subscriptionStatus);
  }

  toggleTerms(): void {
    this.showTerms = !this.showTerms;
  }

  proceedToCheckout(): void {
    if (this.agreeToTerms) {
      this.checkout.emit(true);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
