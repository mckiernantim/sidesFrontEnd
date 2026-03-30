import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnotationToolbarComponent } from './annotation-toolbar.component';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { BehaviorSubject } from 'rxjs';
import {
  AnnotationType,
  AnnotationToolState,
  AnnotationLayerSummary,
  Annotation,
  DEFAULT_TEXT_BOX_PRESETS
} from 'src/app/types/Annotation';

describe('AnnotationToolbarComponent', () => {
  let component: AnnotationToolbarComponent;
  let fixture: ComponentFixture<AnnotationToolbarComponent>;
  let mockAnnotationState: Partial<AnnotationStateService>;
  let toolStateSubject: BehaviorSubject<AnnotationToolState>;

  // Helper to create mock annotation
  const createMockAnnotation = (
    text: string,
    pageIndex: number = 0,
    annotationId: string = 'test-id'
  ): Annotation => ({
    annotationId,
    layerId: 'test-layer-id',
    type: 'textbox',
    pageIndex,
    normalizedX: 0.4,
    normalizedY: 0.15,
    normalizedWidth: 0.2,
    normalizedHeight: 0.05,
    text,
    style: {
      color: '#000000',
      opacity: 1.0,
      strokeWidth: 1,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif'
    },
    createdBy: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  beforeEach(async () => {
    // Create initial tool state
    toolStateSubject = new BehaviorSubject<AnnotationToolState>({
      activeTool: null,
      activeLayerId: null,
      selectedAnnotationIds: [],
      isDrawing: false,
      drawingStart: null,
      drawingCurrent: null
    });

    // Create mock object
    mockAnnotationState = {
      setActiveTool: jest.fn(),
      createAnnotation: jest.fn(),
      initializeForDocument: jest.fn(),
      createLayer: jest.fn(),
      setActiveLayer: jest.fn(),
      deleteLayer: jest.fn(),
      toolState$: toolStateSubject.asObservable(),
      activeLayerId: 'test-layer-id',
      layers: [
        {
          layerId: 'test-layer-id',
          name: 'Test Layer',
          createdBy: 'test-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          visibility: 'private' as const,
          annotationCount: 0,
          userPermission: 'owner' as const
        } as AnnotationLayerSummary
      ],
      annotations: new Map<string, Annotation>()
    };

    await TestBed.configureTestingModule({
      declarations: [AnnotationToolbarComponent],
      providers: [
        { provide: AnnotationStateService, useValue: mockAnnotationState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnnotationToolbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.currentPageIndex).toBe(0);
      expect(component.totalPages).toBe(1);
      expect(component.activeTool).toBeNull();
      expect(component.tools.length).toBeGreaterThan(0);
      expect(component.presets.length).toBeGreaterThan(0);
    });

    it('should subscribe to tool state changes', () => {
      fixture.detectChanges();

      expect(component.activeTool).toBeNull();

      // Update tool state
      toolStateSubject.next({
        activeTool: 'textbox',
        activeLayerId: 'test-layer-id',
        selectedAnnotationIds: [],
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null
      });

      expect(component.activeTool).toBe('textbox');
    });

    it('should have correct tool definitions', () => {
      expect(component.tools.length).toBe(5);
      expect(component.tools.find(t => t.id === 'textbox')).toBeDefined();
      expect(component.tools.find(t => t.id === 'highlight')).toBeDefined();
      expect(component.tools.find(t => t.id === 'shape')).toBeDefined();
      expect(component.tools.find(t => t.id === 'note')).toBeDefined();
      expect(component.tools.find(t => t.id === 'redaction')).toBeDefined();
    });

    it('should have preset definitions', () => {
      expect(component.presets.length).toBe(3);
      expect(component.presets.find(p => p.id === 'series-name')).toBeDefined();
      expect(component.presets.find(p => p.id === 'character-name')).toBeDefined();
      expect(component.presets.find(p => p.id === 'legal-disclaimer')).toBeDefined();
    });
  });

  describe('Tool Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select a tool', () => {
      component.selectTool('textbox');
      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith('textbox');
    });

    it('should deselect tool if clicking same tool', () => {
      // Set active tool
      toolStateSubject.next({
        activeTool: 'textbox',
        activeLayerId: 'test-layer-id',
        selectedAnnotationIds: [],
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null
      });

      component.selectTool('textbox');
      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith(null);
    });

    it('should switch between tools', () => {
      component.selectTool('textbox');
      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith('textbox');

      toolStateSubject.next({
        activeTool: 'textbox',
        activeLayerId: 'test-layer-id',
        selectedAnnotationIds: [],
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null
      });

      component.selectTool('highlight');
      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith('highlight');
    });

    it('should check if tool is active', () => {
      toolStateSubject.next({
        activeTool: 'textbox',
        activeLayerId: 'test-layer-id',
        selectedAnnotationIds: [],
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null
      });

      expect(component.isToolActive('textbox')).toBe(true);
      expect(component.isToolActive('highlight')).toBe(false);
    });
  });

  describe('Preset Insertion', () => {
    beforeEach(() => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue('new-annotation-id');
      fixture.detectChanges();
    });

    it('should activate textbox tool when inserting preset', async () => {
      const preset = component.presets[0];
      await component.insertPreset(preset);

      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith('textbox');
    });

    it('should create annotation with preset text', async () => {
      const preset = component.presets[0];
      await component.insertPreset(preset);

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'textbox',
          text: preset.text
        })
      );
    });

    it('should use current page index', async () => {
      component.currentPageIndex = 5;
      const preset = component.presets[0];
      await component.insertPreset(preset);

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 5
        })
      );
    });

    it('should handle insertion failure', async () => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue(null);
      const preset = component.presets[0];

      await component.insertPreset(preset);

      // Should not throw error
      expect(mockAnnotationState.createAnnotation).toHaveBeenCalled();
    });
  });

  describe('Scene Marker Functionality', () => {
    beforeEach(() => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue('scene-annotation-id');
      fixture.detectChanges();
    });

    it('should insert scene marker with auto-incrementing number', async () => {
      await component.insertSceneMarker();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'textbox',
          text: 'Scene 1'
        })
      );
    });

    it('should increment scene number based on existing scene markers', async () => {
      // Mock existing scene markers
      const mockAnnotations = new Map<string, Annotation>([
        ['ann-1', createMockAnnotation('Scene 1', 0, 'ann-1')],
        ['ann-2', createMockAnnotation('Scene 2', 1, 'ann-2')],
        ['ann-3', createMockAnnotation('Scene 3', 2, 'ann-3')]
      ]);

      mockAnnotationState.annotations = mockAnnotations;

      await component.insertSceneMarker();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Scene 4'
        })
      );
    });

    it('should use scene marker preset styling', async () => {
      const scenePreset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.isSceneMarker);

      await component.insertSceneMarker();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          normalizedX: scenePreset!.normalizedX,
          normalizedY: scenePreset!.normalizedY,
          style: scenePreset!.style
        })
      );
    });

    it('should activate textbox tool when inserting scene marker', async () => {
      await component.insertSceneMarker();

      expect(mockAnnotationState.setActiveTool).toHaveBeenCalledWith('textbox');
    });

    it('should use current page index for scene marker', async () => {
      component.currentPageIndex = 7;

      await component.insertSceneMarker();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 7
        })
      );
    });

    it('should handle scene marker insertion failure', async () => {
      (mockAnnotationState.createAnnotation as jest.Mock).mockResolvedValue(null);

      await component.insertSceneMarker();

      expect(mockAnnotationState.createAnnotation).toHaveBeenCalled();
      // Should not throw error
    });

    it('should get next scene number correctly', () => {
      const mockAnnotations = new Map<string, Annotation>([
        ['ann-1', createMockAnnotation('Scene 1', 0, 'ann-1')],
        ['ann-2', createMockAnnotation('Scene 5', 1, 'ann-2')],
        ['ann-3', createMockAnnotation('Scene 3', 2, 'ann-3')]
      ]);

      mockAnnotationState.annotations = mockAnnotations;

      expect(component.getNextSceneNumber()).toBe(6);
    });

    it('should return 1 as next scene number when no scene markers exist', () => {
      expect(component.getNextSceneNumber()).toBe(1);
    });

    it('should handle non-scene marker text annotations', () => {
      const mockAnnotations = new Map<string, Annotation>([
        ['ann-1', createMockAnnotation('Some random text', 0, 'ann-1')],
        ['ann-2', createMockAnnotation('Scene 2', 1, 'ann-2')],
        ['ann-3', createMockAnnotation('Character Name', 2, 'ann-3')]
      ]);

      mockAnnotationState.annotations = mockAnnotations;

      expect(component.getNextSceneNumber()).toBe(3);
    });
  });

  describe('Color Selection', () => {
    it('should select a color', () => {
      component.selectColor('#FF0000');

      expect(component.selectedColor).toBe('#FF0000');
      expect(component.showColorPicker).toBe(false);
    });

    it('should toggle color picker visibility', () => {
      expect(component.showColorPicker).toBe(false);

      component.toggleColorPicker();
      expect(component.showColorPicker).toBe(true);

      component.toggleColorPicker();
      expect(component.showColorPicker).toBe(false);
    });

    it('should have predefined color palette', () => {
      expect(component.colors.length).toBeGreaterThan(0);
      expect(component.colors).toContain('#FF0000');
      expect(component.colors).toContain('#0000FF');
    });
  });

  describe('Layer Management', () => {
    it('should return active layer name', () => {
      fixture.detectChanges();
      expect(component.getActiveLayerName()).toBe('Test Layer');
    });

    it('should return message when no layer selected', () => {
      mockAnnotationState.activeLayerId = null;

      fixture.detectChanges();
      expect(component.getActiveLayerName()).toBe('No Layer Selected');
    });

    it('should return unknown layer when layer not found', () => {
      mockAnnotationState.activeLayerId = 'unknown-layer-id';

      fixture.detectChanges();
      expect(component.getActiveLayerName()).toBe('Unknown Layer');
    });
  });

  describe('Clear All', () => {
    it('should prompt for confirmation before clearing', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.clearAll();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to clear all annotations on this layer?'
      );

      confirmSpy.mockRestore();
    });

    it('should not clear if user cancels', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.clearAll();

      expect(confirmSpy).toHaveBeenCalled();
      // Currently just logs - no actual deletion implemented yet

      confirmSpy.mockRestore();
    });

    it('should proceed if user confirms', () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      component.clearAll();

      expect(confirmSpy).toHaveBeenCalled();
      // Currently just logs - no actual deletion implemented yet

      confirmSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();

      const subscription = (component as any).toolStateSubscription;
      const unsubscribeSpy = jest.spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle missing subscription on destroy', () => {
      (component as any).toolStateSubscription = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
