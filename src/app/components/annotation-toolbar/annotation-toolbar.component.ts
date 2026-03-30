import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { AnnotationType, AnnotationToolState, DEFAULT_TEXT_BOX_PRESETS } from 'src/app/types/Annotation';

interface ToolButton {
  id: AnnotationType;
  label: string;
  icon: string;
  tooltip: string;
}

interface PresetButton {
  id: string;
  label: string;
  tooltip: string;
  text: string;
}

@Component({
  selector: 'app-annotation-toolbar',
  templateUrl: './annotation-toolbar.component.html',
  styleUrls: ['./annotation-toolbar.component.css'],
  standalone: false
})
export class AnnotationToolbarComponent implements OnInit, OnDestroy {

  @Input() currentPageIndex: number = 0;
  @Input() totalPages: number = 1;

  // Scene marker state
  private sceneMarkerCounter: number = 1;

  // Available annotation tools
  tools: ToolButton[] = [
    {
      id: 'textbox',
      label: 'Text Box',
      icon: '📝',
      tooltip: 'Add a text box annotation'
    },
    {
      id: 'highlight',
      label: 'Highlight',
      icon: '🖍️',
      tooltip: 'Highlight text or areas'
    },
    {
      id: 'shape',
      label: 'Rectangle',
      icon: '▢',
      tooltip: 'Draw a rectangle (red border, transparent fill)'
    },
    {
      id: 'note',
      label: 'Arrow',
      icon: '→',
      tooltip: 'Draw a context arrow'
    },
    {
      id: 'redaction',
      label: 'Redact',
      icon: '█',
      tooltip: 'Redact content (black box)'
    }
  ];

  // Text box presets from spec
  presets: PresetButton[] = [
    {
      id: 'series-name',
      label: 'Series Name',
      tooltip: 'Insert series name preset',
      text: '[SERIES NAME]'
    },
    {
      id: 'character-name',
      label: 'Character',
      tooltip: 'Insert character name preset',
      text: '[CHARACTER NAME]'
    },
    {
      id: 'legal-disclaimer',
      label: 'Legal',
      tooltip: 'Insert legal disclaimer',
      text: 'This material is the property of [STUDIO NAME] and is intended solely for the use of [RECIPIENT]. Any distribution or copying of this material is strictly prohibited.'
    }
  ];

  // Current tool state
  activeTool: AnnotationType | null = null;
  selectedColor: string = '#FF0000';
  showColorPicker: boolean = false;

  // Available colors
  colors: string[] = [
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#000000', // Black
    '#FFFFFF', // White
    '#FFA500', // Orange
    '#800080'  // Purple
  ];

  private toolStateSubscription?: Subscription;

  constructor(private annotationState: AnnotationStateService) {}

  ngOnInit(): void {
    // Subscribe to tool state changes
    this.toolStateSubscription = this.annotationState.toolState$.subscribe(
      (toolState: AnnotationToolState) => {
        this.activeTool = toolState.activeTool;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.toolStateSubscription) {
      this.toolStateSubscription.unsubscribe();
    }
  }

  /**
   * Activate a specific annotation tool
   */
  selectTool(toolType: AnnotationType): void {
    if (this.activeTool === toolType) {
      // Deselect if clicking the same tool
      this.annotationState.setActiveTool(null);
    } else {
      // Select the new tool
      this.annotationState.setActiveTool(toolType);
      console.log('Tool selected:', toolType);
    }
  }

  /**
   * Check if a tool is currently active
   */
  isToolActive(toolType: AnnotationType): boolean {
    return this.activeTool === toolType;
  }

  /**
   * Insert a preset text box
   */
  async insertPreset(preset: PresetButton): Promise<void> {
    // First activate the textbox tool
    this.annotationState.setActiveTool('textbox');

    // Create a textbox annotation with the preset text
    // Position it in the center of the current page
    const annotationId = await this.annotationState.createAnnotation({
      type: 'textbox',
      pageIndex: this.currentPageIndex,
      normalizedX: 0.3,
      normalizedY: 0.3,
      normalizedWidth: 0.4,
      normalizedHeight: 0.1,
      text: preset.text,
      style: {
        color: this.selectedColor,
        opacity: 1.0,
        strokeWidth: 2,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif'
      }
    });

    if (annotationId) {
      console.log('Preset inserted:', preset.id, annotationId);
    } else {
      console.error('Failed to insert preset:', preset.id);
    }
  }

  /**
   * Change the selected color
   */
  selectColor(color: string): void {
    this.selectedColor = color;
    this.showColorPicker = false;
    console.log('Color selected:', color);

    // Update the active tool's color if there is one
    // This will be used for new annotations
  }

  /**
   * Toggle the color picker visibility
   */
  toggleColorPicker(): void {
    this.showColorPicker = !this.showColorPicker;
  }

  /**
   * Clear all annotations on the current layer
   */
  clearAll(): void {
    const confirmed = confirm('Are you sure you want to clear all annotations on this layer?');
    if (confirmed) {
      // TODO: Implement bulk delete in annotation state service
      console.log('Clear all annotations requested');
    }
  }

  /**
   * Get the active layer name
   */
  getActiveLayerName(): string {
    const activeLayerId = this.annotationState.activeLayerId;
    if (!activeLayerId) {
      return 'No Layer Selected';
    }

    const layer = this.annotationState.layers.find(l => l.layerId === activeLayerId);
    return layer ? layer.name : 'Unknown Layer';
  }

  /**
   * Insert a scene marker with auto-incrementing number
   */
  async insertSceneMarker(): Promise<void> {
    // Get the highest scene number currently in use across all pages
    const allAnnotations = Array.from(this.annotationState.annotations.values());
    const sceneMarkerPattern = /^Scene (\d+)$/;
    let highestSceneNumber = 0;

    allAnnotations.forEach(annotation => {
      if (annotation.type === 'textbox' && annotation.text) {
        const match = annotation.text.match(sceneMarkerPattern);
        if (match) {
          const sceneNumber = parseInt(match[1], 10);
          if (sceneNumber > highestSceneNumber) {
            highestSceneNumber = sceneNumber;
          }
        }
      }
    });

    // Use the next available scene number
    const nextSceneNumber = highestSceneNumber + 1;
    const sceneText = `Scene ${nextSceneNumber}`;

    // Get the scene marker preset for styling
    const sceneMarkerPreset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.isSceneMarker);

    if (!sceneMarkerPreset) {
      console.error('Scene marker preset not found');
      return;
    }

    // Activate textbox tool
    this.annotationState.setActiveTool('textbox');

    // Create the scene marker annotation
    // Position it above script lines (normalized Y around 0.15-0.25 depending on page content)
    const annotationId = await this.annotationState.createAnnotation({
      type: 'textbox',
      pageIndex: this.currentPageIndex,
      normalizedX: sceneMarkerPreset.normalizedX,
      normalizedY: sceneMarkerPreset.normalizedY,
      normalizedWidth: sceneMarkerPreset.normalizedWidth || 0.2,
      normalizedHeight: sceneMarkerPreset.normalizedHeight || 0.05,
      text: sceneText,
      style: sceneMarkerPreset.style
    });

    if (annotationId) {
      console.log('Scene marker inserted:', sceneText, annotationId);
      this.sceneMarkerCounter = nextSceneNumber + 1;
    } else {
      console.error('Failed to insert scene marker');
    }
  }

  /**
   * Get the next scene marker number that will be inserted
   */
  getNextSceneNumber(): number {
    const allAnnotations = Array.from(this.annotationState.annotations.values());
    const sceneMarkerPattern = /^Scene (\d+)$/;
    let highestSceneNumber = 0;

    allAnnotations.forEach(annotation => {
      if (annotation.type === 'textbox' && annotation.text) {
        const match = annotation.text.match(sceneMarkerPattern);
        if (match) {
          const sceneNumber = parseInt(match[1], 10);
          if (sceneNumber > highestSceneNumber) {
            highestSceneNumber = sceneNumber;
          }
        }
      }
    });

    return highestSceneNumber + 1;
  }
}
