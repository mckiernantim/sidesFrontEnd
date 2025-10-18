import { Component, Input, OnInit, Optional, Inject, ChangeDetectorRef } from '@angular/core';

type ServerError = {
  message: string;
  code: number;
  type: string;
}

interface ModalData {
  title: string;
  dialogOption: string;
  selected?: string[];
  response?: any;
  error?: ServerError;
}

@Component({
  selector: 'app-spinning-bot',
  templateUrl: './spinning-bot.component.html',
  styleUrls: ['./spinning-bot.component.scss'],
  standalone: false
})
export class SpinningBotComponent implements OnInit {
  @Input() error?: ServerError | null;
  @Input() title?: string;
  @Input() dialogOption?: string;
  @Input() paymentMsg: string = "Building sides for: ";
  @Input() response?: any;
  @Input() modalData?: ModalData;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Ensure error is properly initialized
    if (this.error === undefined) {
      this.error = null;
    }
  }

  getErrorMessage(): string {
    return this.error?.message || 'An unknown error occurred';
  }

  getErrorType(): string {
    return this.error?.type || 'Unknown';
  }
}

  


   

