import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ScanWarning {
  type: 'warning' | 'info' | 'error';
  category: 'scene_headers' | 'scene_numbers' | 'cover_page' | 'pdf_source' | 'formatting' | 'other';
  message: string;
  details?: string;
}

export interface DocumentMetadata {
  filename: string;
  sceneCount: number;
  source?: string; // 'Final Draft', 'Highland', 'WriterDuet', 'Unknown', etc.
  linesProcessed?: number;
  warnings?: ScanWarning[];
  scanMessages?: string[];
}

@Component({
  selector: 'app-document-ready-modal',
  templateUrl: './document-ready-modal.component.html',
  styleUrls: ['./document-ready-modal.component.css'],
  standalone: false
})
export class DocumentReadyModalComponent {
  @Input() metadata: DocumentMetadata = {
    filename: 'Document',
    sceneCount: 0,
    source: 'Unknown',
    warnings: []
  };

  @Output() continue = new EventEmitter<void>();

  get hasWarnings(): boolean {
    // Only count errors and warnings, not info messages
    const actualWarnings = this.metadata.warnings?.filter(w => 
      w.type === 'error' || w.type === 'warning'
    ) || [];
    return actualWarnings.length > 0;
  }

  get hasAnyMessages(): boolean {
    // Check if there are any messages at all (including info)
    return (this.metadata.warnings?.length || 0) > 0;
  }

  get hasErrors(): boolean {
    return this.metadata.warnings?.some(w => w.type === 'error') || false;
  }

  get warningCount(): number {
    return this.metadata.warnings?.filter(w => w.type === 'warning').length || 0;
  }

  get errorCount(): number {
    return this.metadata.warnings?.filter(w => w.type === 'error').length || 0;
  }

  get infoCount(): number {
    return this.metadata.warnings?.filter(w => w.type === 'info').length || 0;
  }

  getWarningIcon(type: 'warning' | 'info' | 'error'): string {
    switch (type) {
      case 'error':
        return 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z';
      case 'warning':
        return 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z';
      case 'info':
        return 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z';
      default:
        return '';
    }
  }

  getWarningColorClasses(type: 'warning' | 'info' | 'error'): { bg: string, border: string, text: string, icon: string } {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-500'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-500'
        };
    }
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'scene_headers': 'Scene Headers',
      'scene_numbers': 'Scene Numbers',
      'cover_page': 'Cover Page',
      'pdf_source': 'PDF Source',
      'formatting': 'Formatting',
      'other': 'General'
    };
    return labels[category] || category;
  }

  onContinue(): void {
    this.continue.emit();
  }
}

