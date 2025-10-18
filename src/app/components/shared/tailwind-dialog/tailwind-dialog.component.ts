import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-tailwind-dialog',
  templateUrl: './tailwind-dialog.component.html',
  styleUrls: ['./tailwind-dialog.component.css'],
  standalone: false
})
export class TailwindDialogComponent implements OnChanges {
  @Input() isOpen: boolean = true;
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() disableClose: boolean = false;
  @Input() actions: {label: string, value: any, style: 'primary' | 'secondary' | 'danger'}[] = [];
  @Input() showSpinner: boolean = false;
  @Input() spinnerImage: string = 'assets/icons/logoBot.png';
  @Input() data: any;
  
  safeContent: SafeHtml;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() actionSelected = new EventEmitter<any>();
  
  constructor(private sanitizer: DomSanitizer) {}
  
  ngOnChanges(changes?: SimpleChanges) {
    const contentToSanitize = this.content || (this.data && this.data.content) || '';
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(contentToSanitize);
    
    if (this.data) {
      this.title = this.data.title || this.title;
      this.showCloseButton = this.data.showCloseButton !== undefined ? this.data.showCloseButton : this.showCloseButton;
      this.disableClose = this.data.disableClose !== undefined ? this.data.disableClose : this.disableClose;
      this.actions = this.data.actions || this.actions;
      this.showSpinner = this.data.showSpinner !== undefined ? this.data.showSpinner : this.showSpinner;
      this.spinnerImage = this.data.spinnerImage || this.spinnerImage;
    }
  }

  onClose(): void {
    if (!this.disableClose) {
      this.close.emit();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.close.emit();
  }

  onAction(value: any): void {
    this.actionSelected.emit(value);
    this.close.emit();
  }
} 