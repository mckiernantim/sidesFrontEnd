import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tailwind-dialog',
  templateUrl: './tailwind-dialog.component.html',
  styleUrls: ['./tailwind-dialog.component.css'],
  standalone: false
})
export class TailwindDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() showIcon: boolean = true;
  @Input() showConfirmButton: boolean = true;
  @Input() showCancelButton: boolean = true;
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  
  confirm(): void {
    this.confirmed.emit();
  }

  closeDialog(): void {
    this.close.emit();
  }
} 