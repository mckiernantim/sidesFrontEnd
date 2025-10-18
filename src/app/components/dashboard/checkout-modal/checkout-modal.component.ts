import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-checkout-modal',
  templateUrl: './checkout-modal.component.html',
  styleUrls: ['./checkout-modal.component.css'],
  standalone: false
})
export class CheckoutModalComponent implements OnInit {
  @Input() selectedScenes: any[] = [];
  @Input() userData: any;
  @Output() checkout = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  showTerms: boolean = false;
  agreeToTerms: boolean = false;

  constructor() { }

  ngOnInit(): void {
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