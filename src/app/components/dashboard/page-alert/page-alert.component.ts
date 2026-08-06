import { Component, Input, HostListener, ElementRef } from '@angular/core';

@Component({
  selector: 'app-page-alert',
  templateUrl: './page-alert.component.html',
  styleUrls: ['./page-alert.component.css'],
  standalone: false,
})
export class PageAlertComponent {
  @Input() label: string = '';
  @Input() tooltipText: string = '';

  showTooltip: boolean = false;

  constructor(private elRef: ElementRef) {}

  toggleTooltip(): void {
    this.showTooltip = !this.showTooltip;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showTooltip = false;
    }
  }
}
