import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-spinner-dialog',
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div class="relative w-auto max-w-md mx-auto my-6">
        <div class="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <!-- Header -->
          <div class="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
            <h3 class="text-xl font-semibold">
              {{ title }}
            </h3>
            <button *ngIf="showCloseButton" class="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none" (click)="onClose()">
              <span class="text-black h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
            </button>
          </div>
          <!-- Body -->
          <div class="relative p-6 flex-auto">
            <div class="flex justify-center mb-4">
              <img [src]="spinnerImage" alt="Loading..." class="w-24 h-24 animate-spin" [style.animation-duration.s]="spinnerSpeed">
            </div>
            <p class="text-center mt-4">{{ message }}</p>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="isOpen && !disableBackdropClose" class="fixed inset-0 z-40 bg-black opacity-25" (click)="onClose()"></div>
  `,
  standalone: false
})
export class SpinnerDialogComponent {
  @Input() isOpen: boolean = true;
  @Input() title: string = 'Processing';
  @Input() message: string = 'Please wait...';
  @Input() spinnerImage: string = 'assets/icons/logoBot.png';
  @Input() spinnerSpeed: number = 3;
  @Input() showCloseButton: boolean = false;
  @Input() disableBackdropClose: boolean = true;
  
  @Output() close = new EventEmitter<void>();
  
  onClose(): void {
    if (!this.disableBackdropClose || this.showCloseButton) {
      this.close.emit();
    }
  }
} 