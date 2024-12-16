import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-subscription-dialog',
  template: `
    <div class="p-6 max-w-md">
      <h2 class="text-xl font-semibold mb-4">{{ data.title || 'Subscription Required' }}</h2>
      
      <div class="mb-6">
        <p class="mb-4">{{ data.message || 'A subscription is required to access this feature.' }}</p>
        
        <div *ngIf="data.pricing" class="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 class="font-medium mb-2">Plan Details</h3>
          <ul class="list-disc pl-5">
            <li>Weekly Plan: $20/week</li>
            <li>Unlimited PDF Generation</li>
            <li>Cancel anytime</li>
          </ul>
        </div>
      </div>

      <div class="flex justify-end gap-4">
        <button 
          mat-button 
          (click)="dialogRef.close('cancel')"
          class="text-gray-600">
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="dialogRef.close('subscribe')"
          class="bg-blue-600">
          Subscribe Now
        </button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class SubscriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}