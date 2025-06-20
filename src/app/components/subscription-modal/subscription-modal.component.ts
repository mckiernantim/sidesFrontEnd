import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-subscription-modal',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
      
      <!-- Modal content -->
      <div class="relative z-50 w-full max-w-4xl mx-4 h-5/6">
        <div class="bg-white rounded-lg shadow-xl h-full flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 class="text-xl font-bold text-gray-800">Subscription Required</h2>
              <p class="text-gray-600">You need an active subscription to generate PDFs. Please manage your subscription below.</p>
            </div>
            <button 
              (click)="onClose()"
              class="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Profile component -->
          <div class="flex-1 overflow-auto p-6">
            <app-profile (subscriptionActivated)="onSubscriptionSuccess()"></app-profile>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: false
})
export class SubscriptionModalComponent {
  @Output() close = new EventEmitter<any>();

  onClose(): void {
    console.log('Subscription modal close requested');
    this.close.emit('close');
  }

  onSubscriptionSuccess(): void {
    console.log('Subscription successful, closing modal');
    // Emit close with success result
    this.close.emit('subscription_success');
  }
} 