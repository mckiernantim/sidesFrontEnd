import { Component, Input, OnInit } from '@angular/core';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { AnnotationApiService } from 'src/app/services/annotation/annotation-api.service';
import { DEFAULT_TEXT_BOX_PRESETS, Annotation, AnnotationBatchOperation } from 'src/app/types/Annotation';

/**
 * Disclaimer Toggle Component
 *
 * Provides one-click insertion of legal disclaimer text boxes with options to:
 * - Insert disclaimer on current page
 * - Apply disclaimer to all pages
 * - Show/hide disclaimer toggle
 *
 * The disclaimer text is: "Performers are not required to learn or memorize lines in advance of their interview."
 */
@Component({
  selector: 'app-disclaimer-toggle',
  templateUrl: './disclaimer-toggle.component.html',
  styleUrls: ['./disclaimer-toggle.component.css'],
  standalone: false
})
export class DisclaimerToggleComponent implements OnInit {

  @Input() currentPageIndex: number = 0;
  @Input() totalPages: number = 1;

  // Disclaimer state
  disclaimerActive: boolean = false;
  applyToAllPages: boolean = false;
  isProcessing: boolean = false;

  // Get the legal disclaimer preset
  private get disclaimerPreset() {
    return DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer')!;
  }

  constructor(
    private annotationState: AnnotationStateService,
    private annotationApi: AnnotationApiService
  ) {}

  ngOnInit(): void {
    // Check if disclaimer exists on current page
    this.checkDisclaimerStatus();
  }

  /**
   * Check if disclaimer annotation exists on the current page
   */
  private checkDisclaimerStatus(): void {
    const annotations = this.annotationState.getAnnotationsForPage(this.currentPageIndex);
    this.disclaimerActive = annotations.some(
      a => a.type === 'textbox' &&
           a.text === this.disclaimerPreset.defaultText
    );
  }

  /**
   * Toggle disclaimer on/off
   */
  async toggleDisclaimer(): Promise<void> {
    if (this.disclaimerActive) {
      await this.removeDisclaimer();
    } else {
      await this.insertDisclaimer();
    }
  }

  /**
   * Insert disclaimer annotation(s)
   */
  private async insertDisclaimer(): Promise<void> {
    const layerId = this.annotationState.activeLayerId;
    const documentId = this.annotationState.currentDocumentId;

    if (!layerId || !documentId) {
      console.error('No active layer or document');
      return;
    }

    this.isProcessing = true;

    try {
      if (this.applyToAllPages) {
        // Create batch operations for all pages
        await this.insertDisclaimerAllPages();
      } else {
        // Insert on current page only
        await this.insertDisclaimerCurrentPage();
      }

      this.disclaimerActive = true;
    } catch (error) {
      console.error('Error inserting disclaimer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Insert disclaimer on current page
   */
  private async insertDisclaimerCurrentPage(): Promise<void> {
    const preset = this.disclaimerPreset;

    await this.annotationState.createAnnotation({
      type: 'textbox',
      pageIndex: this.currentPageIndex,
      normalizedX: preset.normalizedX,
      normalizedY: preset.normalizedY,
      normalizedWidth: preset.normalizedWidth || 0.8,
      normalizedHeight: preset.normalizedHeight || 0.04,
      text: preset.defaultText,
      style: preset.style
    });
  }

  /**
   * Insert disclaimer on all pages using batch operation
   */
  private async insertDisclaimerAllPages(): Promise<void> {
    const layerId = this.annotationState.activeLayerId;
    const documentId = this.annotationState.currentDocumentId;

    if (!layerId || !documentId) return;

    const preset = this.disclaimerPreset;
    const operations: AnnotationBatchOperation[] = [];

    // Create batch create operations for each page
    for (let pageIndex = 0; pageIndex < this.totalPages; pageIndex++) {
      // Check if disclaimer already exists on this page
      const pageAnnotations = this.annotationState.getAnnotationsForPage(pageIndex);
      const hasDisclaimer = pageAnnotations.some(
        a => a.type === 'textbox' && a.text === preset.defaultText
      );

      if (!hasDisclaimer) {
        operations.push({
          action: 'create',
          annotation: {
            type: 'textbox',
            pageIndex,
            normalizedX: preset.normalizedX,
            normalizedY: preset.normalizedY,
            normalizedWidth: preset.normalizedWidth || 0.8,
            normalizedHeight: preset.normalizedHeight || 0.04,
            text: preset.defaultText,
            style: preset.style,
            layerId
          }
        });
      }
    }

    if (operations.length > 0) {
      try {
        const response = await this.annotationApi.batchOperations(layerId, {
          documentId,
          operations
        }).toPromise();

        if (response && response.success) {
          console.log(`Disclaimer applied to ${response.created} pages`);
          // Reload annotations for current layer
          await this.annotationState.setActiveLayer(layerId);
        }
      } catch (error) {
        console.error('Error applying disclaimer to all pages:', error);
        throw error;
      }
    }
  }

  /**
   * Remove disclaimer annotation(s)
   */
  private async removeDisclaimer(): Promise<void> {
    const layerId = this.annotationState.activeLayerId;
    const documentId = this.annotationState.currentDocumentId;

    if (!layerId || !documentId) {
      console.error('No active layer or document');
      return;
    }

    this.isProcessing = true;

    try {
      if (this.applyToAllPages) {
        // Remove from all pages
        await this.removeDisclaimerAllPages();
      } else {
        // Remove from current page only
        await this.removeDisclaimerCurrentPage();
      }

      this.disclaimerActive = false;
    } catch (error) {
      console.error('Error removing disclaimer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Remove disclaimer from current page
   */
  private async removeDisclaimerCurrentPage(): Promise<void> {
    const annotations = this.annotationState.getAnnotationsForPage(this.currentPageIndex);
    const disclaimerAnnotation = annotations.find(
      a => a.type === 'textbox' && a.text === this.disclaimerPreset.defaultText
    );

    if (disclaimerAnnotation) {
      await this.annotationState.deleteAnnotation(disclaimerAnnotation.annotationId);
    }
  }

  /**
   * Remove disclaimer from all pages using batch operation
   */
  private async removeDisclaimerAllPages(): Promise<void> {
    const layerId = this.annotationState.activeLayerId;
    const documentId = this.annotationState.currentDocumentId;

    if (!layerId || !documentId) return;

    const allAnnotations = Array.from(this.annotationState.annotations.values());
    const disclaimerAnnotations = allAnnotations.filter(
      a => a.type === 'textbox' && a.text === this.disclaimerPreset.defaultText
    );

    if (disclaimerAnnotations.length > 0) {
      const operations: AnnotationBatchOperation[] = disclaimerAnnotations.map(annotation => ({
        action: 'delete',
        annotationId: annotation.annotationId
      }));

      try {
        const response = await this.annotationApi.batchOperations(layerId, {
          documentId,
          operations
        }).toPromise();

        if (response && response.success) {
          console.log(`Disclaimer removed from ${response.deleted} pages`);
          // Reload annotations for current layer
          await this.annotationState.setActiveLayer(layerId);
        }
      } catch (error) {
        console.error('Error removing disclaimer from all pages:', error);
        throw error;
      }
    }
  }

  /**
   * Handle checkbox change for "Apply to All Pages"
   */
  onApplyToAllPagesChange(): void {
    // This is just a toggle - the actual application happens on insert/remove
    console.log('Apply to all pages:', this.applyToAllPages);
  }

  /**
   * Get the button text based on current state
   */
  getButtonText(): string {
    if (this.isProcessing) {
      return 'Processing...';
    }
    return this.disclaimerActive ? 'Remove Disclaimer' : 'Add Disclaimer';
  }

  /**
   * Get the button tooltip
   */
  getButtonTooltip(): string {
    if (this.disclaimerActive) {
      return this.applyToAllPages
        ? 'Remove legal disclaimer from all pages'
        : 'Remove legal disclaimer from current page';
    } else {
      return this.applyToAllPages
        ? 'Add legal disclaimer to all pages'
        : 'Add legal disclaimer to current page';
    }
  }
}
