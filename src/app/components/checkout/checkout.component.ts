import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface scriptData {
  
    selected: any[],
    script: any[]
    totalPages: number
    callsheet: string 
    waitingForScript: boolean,
  
}

@Component({
  selector: 'app-checkout',
  template: `
    <section>
      <div>

      </div>
      <button (click)="fireGetPdf()">Get my Sides</button>
    </section>
  `,
  styleUrls: ['./checkout.component.css']
})

export class CheckoutComponent {
  @Input() scriptData: scriptData;
  @Input() getPdf: () => void;
  @Output() generatePdfEvent: EventEmitter<any> = new EventEmitter<any>();
 
  fireGetPdf() {
    // Call the function received from the parent component
    this.generatePdfEvent.emit();
  }
}
