import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DisclaimerToggleComponent } from './disclaimer-toggle.component';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { AnnotationApiService } from 'src/app/services/annotation/annotation-api.service';
import { of, throwError } from 'rxjs';
import { Annotation, DEFAULT_TEXT_BOX_PRESETS } from 'src/app/types/Annotation';

describe('DisclaimerToggleComponent', () => {
  let component: DisclaimerToggleComponent;
  let fixture: ComponentFixture<DisclaimerToggleComponent>;
  let mockAnnotationState: Partial<AnnotationStateService>;
  let mockAnnotationApi: Partial<AnnotationApiService>;

  // Helper function to create mock annotation
  const createMockAnnotation = (
    pageIndex: number,
    text: string,
    annotationId: string = 'test-annotation-id'
  ): Annotation => ({
    annotationId,
    layerId: 'test-layer-id',
    type: 'textbox',
    pageIndex,
    normalizedX: 0.1,
    normalizedY: 0.95,
    normalizedWidth: 0.8,
    normalizedHeight: 0.04,
    text,
    style: {
      color: '#666666',
      opacity: 1.0,
      strokeWidth: 0,
      fontSize: 10,
      fontFamily: 'Arial, sans-serif'
    },
    createdBy: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  beforeEach(async () => {
    // Create mock objects
    mockAnnotationState = {
      getAnnotationsForPage: jest.fn(),
      createAnnotation: jest.fn(),
      deleteAnnotation: jest.fn(),
      setActiveLayer: jest.fn(),
      activeLayerId: 'test-layer-id',
      currentDocumentId: 'test-document-id',
      annotations: new Map()
    };

    mockAnnotationApi = {
      batchOperations: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [DisclaimerToggleComponent],
      imports: [FormsModule],
      providers: [
        { provide: AnnotationStateService, useValue: mockAnnotationState },
        { provide: AnnotationApiService, useValue: mockAnnotationApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DisclaimerToggleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.disclaimerActive).toBe(false);
      expect(component.applyToAllPages).toBe(false);
      expect(component.isProcessing).toBe(false);
      expect(component.currentPageIndex).toBe(0);
      expect(component.totalPages).toBe(1);
    });

    it('should check disclaimer status on init', () => {
      const disclaimerText = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer')!.defaultText;
      const mockAnnotations = [createMockAnnotation(0, disclaimerText)];

      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue(mockAnnotations);

      fixture.detectChanges();

      expect(component.disclaimerActive).toBe(true);
    });

    it('should not set disclaimerActive if no disclaimer exists', () => {
      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([]);

      fixture.detectChanges();

      expect(component.disclaimerActive).toBe(false);
    });
  });

  describe('Toggle Disclaimer', () => {
    it('should insert disclaimer when toggled on', async () => {
      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([]);
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue('new-annotation-id');

      fixture.detectChanges();

      await component.toggleDisclaimer();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalled();
      expect(component.disclaimerActive).toBe(true);
    });

    it('should remove disclaimer when toggled off', async () => {
      const disclaimerText = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer')!.defaultText;
      const mockAnnotation = createMockAnnotation(0, disclaimerText);

      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([mockAnnotation]);
      (mockAnnotationState.deleteAnnotation as jest.Mock).mockResolvedValue(true);

      fixture.detectChanges();

      await component.toggleDisclaimer();

      expect(mockAnnotationState.deleteAnnotation).toHaveBeenCalledWith('test-annotation-id');
      expect(component.disclaimerActive).toBe(false);
    });

    it('should set processing state during toggle operation', async () => {
      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([]);
      (mockAnnotationState.createAnnotation as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('new-annotation-id'), 100))
      );

      fixture.detectChanges();

      const togglePromise = component.toggleDisclaimer();

      // Should be processing immediately
      expect(component.isProcessing).toBe(true);

      await togglePromise;

      // Should not be processing after completion
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('Insert Disclaimer - Single Page', () => {
    beforeEach(() => {
      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([]);
      component.applyToAllPages = false;
      fixture.detectChanges();
    });

    it('should create annotation with correct preset values', async () => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue('new-annotation-id');

      await component.toggleDisclaimer();

      const preset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer')!;

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith({
        type: 'textbox',
        pageIndex: component.currentPageIndex,
        normalizedX: preset.normalizedX,
        normalizedY: preset.normalizedY,
        normalizedWidth: preset.normalizedWidth || 0.8,
        normalizedHeight: preset.normalizedHeight || 0.04,
        text: preset.defaultText,
        style: preset.style
      });
    });

    it('should not insert if no active layer', async () => {
      mockAnnotationState.activeLayerId = null;

      await component.toggleDisclaimer();

      expect(mockAnnotationState.createAnnotation).not.toHaveBeenCalled();
    });

    it('should not insert if no document ID', async () => {
      mockAnnotationState.currentDocumentId = null;

      await component.toggleDisclaimer();

      expect(mockAnnotationState.createAnnotation).not.toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue(null);

      await component.toggleDisclaimer();

      // Should still reset processing state
      expect(component.isProcessing).toBe(false);
      // Should not set disclaimerActive on failure
      expect(component.disclaimerActive).toBe(false);
    });
  });

  describe('Insert Disclaimer - All Pages', () => {
    beforeEach(() => {
      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([]);
      component.applyToAllPages = true;
      component.totalPages = 3;
      fixture.detectChanges();
    });

    it('should call batch operations for all pages', async () => {
      (mockAnnotationApi.batchOperations as jest.Mock).mockReturnValue(of({
        success: true,
        message: 'Batch operations completed',
        created: 3,
        updated: 0,
        deleted: 0
      }));

      await component.toggleDisclaimer();

      expect(mockAnnotationApi.batchOperations).toHaveBeenCalled();

      const call = (mockAnnotationApi.batchOperations as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('test-layer-id');
      expect(call[1].operations.length).toBe(3);
    });

    it('should reload layer after successful batch operation', async () => {
      (mockAnnotationApi.batchOperations as jest.Mock).mockReturnValue(of({
        success: true,
        message: 'Batch operations completed',
        created: 3,
        updated: 0,
        deleted: 0
      }));
      (mockAnnotationState.setActiveLayer as jest.Mock).mockResolvedValue(undefined);

      await component.toggleDisclaimer();

      expect(mockAnnotationState.setActiveLayer).toHaveBeenCalledWith('test-layer-id');
    });

    it('should handle batch operation errors', async () => {
      (mockAnnotationApi.batchOperations as jest.Mock).mockReturnValue(
        throwError(() => new Error('Batch operation failed'))
      );

      await component.toggleDisclaimer();

      expect(component.isProcessing).toBe(false);
      expect(component.disclaimerActive).toBe(false);
    });
  });

  describe('Remove Disclaimer - Single Page', () => {
    beforeEach(() => {
      component.applyToAllPages = false;
      fixture.detectChanges();
    });

    it('should delete disclaimer annotation from current page', async () => {
      const disclaimerText = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer')!.defaultText;
      const mockAnnotation = createMockAnnotation(0, disclaimerText);

      (mockAnnotationState.getAnnotationsForPage as jest.Mock).mockReturnValue([mockAnnotation]);
      (mockAnnotationState.deleteAnnotation as jest.Mock).mockResolvedValue(true);

      fixture.detectChanges();

      await component.toggleDisclaimer();

      expect(mockAnnotationState.deleteAnnotation).toHaveBeenCalledWith('test-annotation-id');
      expect(component.disclaimerActive).toBe(false);
    });
  });

  describe('UI Helper Methods', () => {
    it('should return correct button text when active', () => {
      component.disclaimerActive = true;
      expect(component.getButtonText()).toBe('Remove Disclaimer');
    });

    it('should return correct button text when inactive', () => {
      component.disclaimerActive = false;
      expect(component.getButtonText()).toBe('Add Disclaimer');
    });

    it('should return processing text when processing', () => {
      component.isProcessing = true;
      expect(component.getButtonText()).toBe('Processing...');
    });

    it('should return correct tooltip for single page add', () => {
      component.disclaimerActive = false;
      component.applyToAllPages = false;
      expect(component.getButtonTooltip()).toBe('Add legal disclaimer to current page');
    });

    it('should return correct tooltip for all pages add', () => {
      component.disclaimerActive = false;
      component.applyToAllPages = true;
      expect(component.getButtonTooltip()).toBe('Add legal disclaimer to all pages');
    });
  });
});
