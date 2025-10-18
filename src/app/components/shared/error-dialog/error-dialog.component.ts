import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppError, ErrorCodeMessages } from 'src/app/types/error';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-error-dialog',
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div class="relative mx-auto my-6 w-11/12 sm:w-3/4 md:w-2/3 lg:w-2/5 xl:w-1/3 max-w-lg">
        <div class="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <!-- Header -->
          <div class="flex items-start justify-between p-5 border-b border-solid rounded-t" 
               [ngClass]="{'bg-red-50': isServerError, 'border-red-200': isServerError, 'border-blueGray-200': !isServerError}">
            <div class="flex items-center">
              <div *ngIf="isServerError" class="mr-3 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold" [ngClass]="{'text-red-600': isServerError}">
                {{ displayTitle }}
              </h3>
            </div>
            <button *ngIf="showCloseButton" class="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none" (click)="onClose()">
              <span class="text-black h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
            </button>
          </div>
          
          <!-- Body -->
          <div class="relative p-6 flex-auto">
            <!-- Spinning Robot -->
            <div *ngIf="showSpinner" class="flex justify-center mb-6">
              <img [src]="spinnerImage" alt="Robot" class="w-32 h-32 animate-spin" [style.animation-duration.s]="spinnerSpeed">
            </div>
    
            <!-- Error Message -->
            <div class="mt-2 text-base text-red-600 font-medium text-center">
              <span>{{ errorMessage || 'An error occurred' }}</span>
            </div>
            
            <!-- Error Code -->
            <div *ngIf="errorCode" class="my-4 p-3 bg-gray-50 rounded border border-gray-200">
              <div class="text-sm text-gray-500">Error Code</div>
              <div class="font-mono text-sm">{{ errorCode }}</div>
              <div *ngIf="errorCodeMessage" class="mt-2 text-sm">{{ errorCodeMessage }}</div>
            </div>
            
            <!-- HTTP Status -->
            <div *ngIf="httpStatus" class="my-4 p-3 bg-gray-50 rounded border border-gray-200">
              <div class="text-sm text-gray-500">HTTP Status</div>
              <div class="font-mono text-sm">{{ httpStatus }} {{ httpStatusText }}</div>
            </div>
            
            <!-- Error Details -->
            <div *ngIf="errorDetails" class="mt-4">
              <div class="flex justify-between items-center mb-1">
                <div class="text-sm font-medium text-gray-700">Additional Details:</div>
                <button 
                  *ngIf="errorDetails"
                  (click)="toggleDetails()" 
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  {{ showDetails ? 'Hide Details' : 'Show Details' }}
                </button>
              </div>
              <div *ngIf="showDetails" class="bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-64 transition-all duration-300">
                <pre class="text-xs font-mono whitespace-pre-wrap">{{ errorDetails }}</pre>
              </div>
            </div>
            
            <div *ngIf="errorOperation" class="mt-4 text-sm">
              <span class="font-medium">Operation:</span> {{ errorOperation }}
            </div>
            
            <div *ngIf="errorTimestamp" class="mt-4 text-xs text-gray-500">
              Occurred at: {{ errorTimestamp | date:'medium' }}
            </div>
            
            <div *ngIf="errorUrl" class="mt-4 text-xs text-gray-500">
              Endpoint: {{ errorUrl }}
            </div>
          </div>
          
          <!-- Footer -->
          <div class="flex items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
            <button 
              class="px-4 py-2 mr-2 text-sm font-medium rounded-md focus:outline-none bg-blue-600 text-white hover:bg-blue-700"
              (click)="onClose()">
              {{ buttonText }}
            </button>
            <button *ngIf="showRetryButton"
              class="px-4 py-2 text-sm font-medium rounded-md focus:outline-none bg-gray-200 text-gray-800 hover:bg-gray-300"
              (click)="onRetry()">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="isOpen" class="fixed inset-0 z-40 bg-black opacity-25" (click)="onClose()"></div>
  `,
  standalone: false
})
export class ErrorDialogComponent implements OnChanges {
  @Input() isOpen: boolean = true;
  @Input() title: string = 'Error';
  @Input() content: string = '';
  @Input() buttonText: string = 'OK';
  @Input() showCloseButton: boolean = true;
  @Input() showRetryButton: boolean = false;
  @Input() error: AppError | Error | HttpErrorResponse | any;
  @Input() showSpinner: boolean = true;
  @Input() spinnerImage: string = 'assets/icons/logoBot.png';
  @Input() spinnerSpeed: number = 3;
  
  safeContent: SafeHtml;
  isServerError: boolean = false;
  errorCode: string = '';
  errorCodeMessage: string = '';
  errorDetails: string = '';
  errorOperation: string = '';
  errorTimestamp: string = '';
  errorMessage: string = 'An error occurred';
  displayTitle: string = '';
  showDetails: boolean = false;
  httpStatus: number = null;
  httpStatusText: string = '';
  errorUrl: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() retry = new EventEmitter<any>();
  
  constructor(private sanitizer: DomSanitizer) {}
  
  ngOnChanges() {
    this.processError();
  }

  processError() {
    this.displayTitle = this.title;
    this.errorMessage = 'An error occurred';
    
    if (!this.error) {
      return;
    }
    
    // For debugging
    console.log('Error object:', this.error);
    
    // Handle HttpErrorResponse
    if (this.error.name === 'HttpErrorResponse') {
      this.isServerError = true;
      this.httpStatus = this.error.status;
      this.httpStatusText = this.error.statusText;
      this.errorUrl = this.error.url;
      
      // Handle nested error structure
      if (this.error.error && this.error.error.error) {
        const backendError = this.error.error.error;
        
        this.errorMessage = backendError.message || this.error.message;
        this.errorCode = backendError.code || '';
        this.errorCodeMessage = ErrorCodeMessages[this.errorCode] || '';
        this.errorDetails = backendError.details || '';
        this.errorOperation = backendError.operation || null;
        this.errorTimestamp = backendError.timestamp || '';
        
        if (this.title === 'Error' && backendError.operation) {
          this.displayTitle = `Error: ${backendError.operation}`;
        }
      } else if (this.error.error && typeof this.error.error === 'object') {
        // Handle direct error object
        const errorObj = this.error.error;
        
        this.errorMessage = errorObj.message || this.error.message;
        this.errorCode = errorObj.code || '';
        this.errorCodeMessage = ErrorCodeMessages[this.errorCode] || '';
        this.errorDetails = errorObj.details || JSON.stringify(errorObj, null, 2);
        this.errorOperation = errorObj.operation || null;
        this.errorTimestamp = errorObj.timestamp || '';
      } else {
        // Fallback for simple error
        this.errorMessage = this.error.message || `HTTP Error ${this.error.status}`;
        this.errorDetails = JSON.stringify(this.error, null, 2);
      }
    } 
    // Handle AppError format from backend
    else if (this.error.error && typeof this.error.error === 'object') {
      this.isServerError = true;
      
      const errorObj = this.error.error;
      
      // Set error code if available
      if (errorObj.code) {
        this.errorCode = errorObj.code;
        this.errorCodeMessage = ErrorCodeMessages[this.errorCode] || '';
      }
      
      // Set error details if available
      if (errorObj.details) {
        this.errorDetails = typeof errorObj.details === 'object' 
          ? JSON.stringify(errorObj.details, null, 2)
          : String(errorObj.details);
      } else {
        // If no specific details, show the full error object
        this.errorDetails = JSON.stringify(this.error, null, 2);
      }
      
      // Set operation if available
      if (errorObj.operation) {
        this.errorOperation = errorObj.operation;
      }
      
      // Set timestamp if available
      if (errorObj.timestamp) {
        this.errorTimestamp = errorObj.timestamp;
      }
      
      if (errorObj.message) {
        this.errorMessage = errorObj.message;
      }
      
      if (this.title === 'Error' && errorObj.operation) {
        this.displayTitle = `Error: ${errorObj.operation}`;
      }
    }
    // Handle standard Error objects
    else if (this.error instanceof Error) {
      this.errorMessage = this.error.message;
      if (this.error.stack) {
        this.errorDetails = this.error.stack;
      }
    } 
    // Handle string errors
    else if (typeof this.error === 'string') {
      this.errorMessage = this.error;
    }
    // Handle any other object
    else if (typeof this.error === 'object') {
      this.errorMessage = 'An error occurred';
      this.errorDetails = JSON.stringify(this.error, null, 2);
    }
  }

  tryParseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return null;
    }
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  onClose(): void {
    this.close.emit();
  }
  
  onRetry(): void {
    this.retry.emit('retry');
  }
} 