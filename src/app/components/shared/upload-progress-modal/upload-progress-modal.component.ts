import { Component, Input, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-upload-progress-modal',
  templateUrl: './upload-progress-modal.component.html',
  styleUrls: ['./upload-progress-modal.component.css'],
  standalone: false
})
export class UploadProgressModalComponent {
  @Input() message: string = 'Uploading your document...';
  @Input() progress: number = 0;
  @Input() currentStep: number = 1;
  @Input() totalSteps: number = 15;

  constructor(private cdr: ChangeDetectorRef) {}

  updateProgress(message: string, progress: number, currentStep?: number, totalSteps?: number) {
    this.message = message;
    this.progress = progress;
    if (currentStep !== undefined) this.currentStep = currentStep;
    if (totalSteps !== undefined) this.totalSteps = totalSteps;
    this.cdr.detectChanges();
  }
}

