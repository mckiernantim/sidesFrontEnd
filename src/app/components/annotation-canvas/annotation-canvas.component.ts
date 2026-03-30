/**
 * Annotation Canvas Component
 *
 * Renders annotations on an HTML5 canvas overlay.
 * Handles user interactions for creating, selecting, and editing annotations.
 *
 * Features:
 * - Canvas 2D rendering with zoom/pan support
 * - Mouse/touch event handling for drawing
 * - Real-time preview while drawing
 * - Selection and editing of existing annotations
 * - Integration with AnnotationStateService
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  HostListener,
  AfterViewInit,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AnnotationStateService } from '../../services/annotation/annotation-state.service';
import { CoordinateService } from '../../services/coordinate/coordinate.service';
import {
  Annotation,
  AnnotationType,
  CanvasPoint,
  CanvasBoundingBox,
  DEFAULT_ANNOTATION_STYLES,
} from '../../types/Annotation';

@Component({
  selector: 'app-annotation-canvas',
  templateUrl: './annotation-canvas.component.html',
  styleUrls: ['./annotation-canvas.component.css'],
  standalone: false
})
export class AnnotationCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('annotationCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() pageWidth: number = 800;
  @Input() pageHeight: number = 1100;
  @Input() pageIndex: number = 0;

  private ctx: CanvasRenderingContext2D | null = null;
  private destroy$ = new Subject<void>();

  // Current annotations for this page
  private currentPageAnnotations: Annotation[] = [];

  // Mouse state
  private isMouseDown = false;
  private mouseDownPos: CanvasPoint | null = null;
  private currentMousePos: CanvasPoint | null = null;

  // Hovered annotation ID
  private hoveredAnnotationId: string | null = null;

  // Dragging state
  private isDraggingAnnotation = false;
  private draggedAnnotation: Annotation | null = null;
  private dragStartOffset: { x: number; y: number } | null = null;

  // Resizing state
  private isResizingAnnotation = false;
  private resizedAnnotation: Annotation | null = null;
  private resizeHandle: 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private resizeStartBox: CanvasBoundingBox | null = null;
  private resizeStartFontSize: number = 14; // Font size at the start of resize operation

  // Editing state
  private editingAnnotationId: string | null = null;
  private lastClickTime = 0;
  private lastClickedAnnotationId: string | null = null;

  constructor(
    private annotationState: AnnotationStateService,
    private coordService: CoordinateService
  ) {}

  /**
   * Canvas only captures pointer-events when a drawing tool is active
   * or an annotation drag/resize is in progress.
   * Otherwise, events pass through to lines/text underneath.
   */
  get isCanvasInteractive(): boolean {
    const toolState = this.annotationState.toolState;
    return !!(toolState.activeTool) || this.isDraggingAnnotation || this.isResizingAnnotation;
  }

  ngOnInit(): void {
    // Subscribe to annotation changes
    this.annotationState.annotations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((annotations) => {
        this.currentPageAnnotations = Array.from(annotations.values()).filter(
          (a) => a.pageIndex === this.pageIndex
        );
        this.render();
      });

    // Subscribe to tool state changes
    this.annotationState.toolState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.render();
      });

    // Subscribe to canvas state changes (zoom, pan)
    this.annotationState.canvasState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.render();
      });
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.render();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // Mouse Event Handlers
  // ─────────────────────────────────────────────

  onMouseDown(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    this.isMouseDown = true;
    this.mouseDownPos = { canvasX, canvasY };
    this.currentMousePos = { canvasX, canvasY };

    const toolState = this.annotationState.toolState;

    // Check if clicking on existing annotation (selection/drag mode)
    if (!toolState.activeTool || toolState.activeTool === null) {
      const clickedAnnotation = this.findAnnotationAtPoint({ canvasX, canvasY });

      if (clickedAnnotation) {
        // Check for double-click on ANY annotation type (all can have text)
        const now = Date.now();
        const isDoubleClick =
          this.lastClickedAnnotationId === clickedAnnotation.annotationId &&
          now - this.lastClickTime < 300;

        if (isDoubleClick) {
          // Start editing text on ANY annotation type
          this.startEditingAnnotation(clickedAnnotation);
          this.lastClickTime = 0;
          this.lastClickedAnnotationId = null;
          return;
        }

        this.lastClickTime = now;
        this.lastClickedAnnotationId = clickedAnnotation.annotationId;

        // Check if clicking on a resize handle
        const selectedIds = this.annotationState.getSelectedAnnotations().map(a => a.annotationId);
        if (selectedIds.includes(clickedAnnotation.annotationId)) {
          const handle = this.findResizeHandleAtPoint({ canvasX, canvasY }, clickedAnnotation);
          if (handle) {
            // Start resizing
            this.isResizingAnnotation = true;
            this.resizedAnnotation = clickedAnnotation;
            this.resizeHandle = handle;
            this.resizeStartFontSize = clickedAnnotation.style?.fontSize || 14; // Capture original font size

            const box = this.coordService.normalizedBoxToCanvas(
              {
                normalizedX: clickedAnnotation.normalizedX,
                normalizedY: clickedAnnotation.normalizedY,
                normalizedWidth: clickedAnnotation.normalizedWidth,
                normalizedHeight: clickedAnnotation.normalizedHeight,
              },
              this.pageWidth,
              this.pageHeight
            );
            this.resizeStartBox = box;
            this.render();
            return;
          }
        }

        // Start dragging the annotation
        this.isDraggingAnnotation = true;
        this.draggedAnnotation = clickedAnnotation;

        // Calculate offset from annotation's top-left corner
        const box = this.coordService.normalizedBoxToCanvas(
          {
            normalizedX: clickedAnnotation.normalizedX,
            normalizedY: clickedAnnotation.normalizedY,
            normalizedWidth: clickedAnnotation.normalizedWidth,
            normalizedHeight: clickedAnnotation.normalizedHeight,
          },
          this.pageWidth,
          this.pageHeight
        );

        this.dragStartOffset = {
          x: canvasX - box.canvasX,
          y: canvasY - box.canvasY
        };

        // Select the annotation if not already selected
        if (!selectedIds.includes(clickedAnnotation.annotationId)) {
          this.annotationState.selectAnnotations([clickedAnnotation.annotationId], event.shiftKey);
        }
      } else {
        // Clicked on empty space, clear selection
        this.annotationState.clearSelection();
      }
    } else {
      // Drawing mode
      this.annotationState.updateToolState({
        isDrawing: true,
        drawingStart: this.mouseDownPos,
        drawingCurrent: this.currentMousePos,
      });
    }

    this.render();
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    this.currentMousePos = { canvasX, canvasY };

    // Update hovered annotation (only if not dragging)
    if (!this.isDraggingAnnotation) {
      const hovered = this.findAnnotationAtPoint({ canvasX, canvasY });
      const newHoveredId = hovered?.annotationId || null;

      if (newHoveredId !== this.hoveredAnnotationId) {
        this.hoveredAnnotationId = newHoveredId;
        this.annotationState.updateCanvasState({ hoveredAnnotationId: newHoveredId });
        this.render();
      }

      // Update cursor style
      canvas.style.cursor = hovered ? 'move' : 'crosshair';
    }

    if (this.isMouseDown && this.mouseDownPos) {
      const toolState = this.annotationState.toolState;

      if (this.isResizingAnnotation && this.resizedAnnotation && this.resizeHandle && this.resizeStartBox) {
        // Resize the annotation
        const deltaX = canvasX - this.mouseDownPos.canvasX;
        const deltaY = canvasY - this.mouseDownPos.canvasY;

        let newBox = { ...this.resizeStartBox };

        switch (this.resizeHandle) {
          case 'tl': // Top-left
            newBox.canvasX += deltaX;
            newBox.canvasY += deltaY;
            newBox.canvasWidth -= deltaX;
            newBox.canvasHeight -= deltaY;
            break;
          case 'tr': // Top-right
            newBox.canvasY += deltaY;
            newBox.canvasWidth += deltaX;
            newBox.canvasHeight -= deltaY;
            break;
          case 'bl': // Bottom-left
            newBox.canvasX += deltaX;
            newBox.canvasWidth -= deltaX;
            newBox.canvasHeight += deltaY;
            break;
          case 'br': // Bottom-right
            newBox.canvasWidth += deltaX;
            newBox.canvasHeight += deltaY;
            break;
        }

        // Enforce minimum size
        if (newBox.canvasWidth < 20) newBox.canvasWidth = 20;
        if (newBox.canvasHeight < 20) newBox.canvasHeight = 20;

        // Calculate dampened scale factor for font size
        // Uses the ORIGINAL box size (from when resize started), not the current frame
        const originalWidth = this.resizeStartBox.canvasWidth;
        const originalHeight = this.resizeStartBox.canvasHeight;
        const newWidth = newBox.canvasWidth;
        const newHeight = newBox.canvasHeight;

        // Use width-dominant scaling (more intuitive for text boxes)
        // Dampened with square root to prevent overly aggressive font changes
        const rawScaleX = newWidth / originalWidth;
        const dampedScale = Math.sqrt(rawScaleX); // Square root dampening

        // Convert to normalized coordinates
        const normalizedBox = this.coordService.canvasBoxToNormalized(
          newBox,
          this.pageWidth,
          this.pageHeight
        );

        // Clamp to valid range
        const clampedBox = this.coordService.clampNormalizedBox(normalizedBox);

        // Calculate new font size from the ORIGINAL font size at start of resize (not current)
        const newFontSize = Math.max(8, Math.min(72, Math.round(this.resizeStartFontSize * dampedScale)));

        // Update annotation (optimistic update)
        this.resizedAnnotation.normalizedX = clampedBox.normalizedX;
        this.resizedAnnotation.normalizedY = clampedBox.normalizedY;
        this.resizedAnnotation.normalizedWidth = clampedBox.normalizedWidth;
        this.resizedAnnotation.normalizedHeight = clampedBox.normalizedHeight;

        // Update font size (ensure style object exists with required properties)
        if (!this.resizedAnnotation.style) {
          this.resizedAnnotation.style = {
            color: '#000000',
            opacity: 1.0,
            strokeWidth: 2,
            fontSize: newFontSize
          };
        } else {
          this.resizedAnnotation.style.fontSize = newFontSize;
        }

        this.render();
      } else if (this.isDraggingAnnotation && this.draggedAnnotation && this.dragStartOffset) {
        // Move the annotation
        const newCanvasX = canvasX - this.dragStartOffset.x;
        const newCanvasY = canvasY - this.dragStartOffset.y;

        // Convert to normalized coordinates
        const normalizedX = newCanvasX / this.pageWidth;
        const normalizedY = newCanvasY / this.pageHeight;

        // Clamp to valid range [0, 1]
        const clampedX = Math.max(0, Math.min(1 - this.draggedAnnotation.normalizedWidth, normalizedX));
        const clampedY = Math.max(0, Math.min(1 - this.draggedAnnotation.normalizedHeight, normalizedY));

        // Update annotation position (optimistic update for smooth dragging)
        this.draggedAnnotation.normalizedX = clampedX;
        this.draggedAnnotation.normalizedY = clampedY;

        this.render();
      } else if (toolState.isDrawing) {
        // Update drawing preview
        this.annotationState.updateToolState({
          drawingCurrent: this.currentMousePos,
        });
        this.render();
      }
    }
  }

  async onMouseUp(event: MouseEvent): Promise<void> {
    if (!this.isMouseDown || !this.mouseDownPos || !this.currentMousePos) {
      this.isMouseDown = false;
      return;
    }

    const toolState = this.annotationState.toolState;

    if (this.isResizingAnnotation && this.resizedAnnotation) {
      // Save the new size AND font size to the backend
      await this.annotationState.updateAnnotation(this.resizedAnnotation.annotationId, {
        normalizedX: this.resizedAnnotation.normalizedX,
        normalizedY: this.resizedAnnotation.normalizedY,
        normalizedWidth: this.resizedAnnotation.normalizedWidth,
        normalizedHeight: this.resizedAnnotation.normalizedHeight,
        style: this.resizedAnnotation.style, // Save updated font size
      });

      // Reset resizing state
      this.isResizingAnnotation = false;
      this.resizedAnnotation = null;
      this.resizeHandle = null;
      this.resizeStartBox = null;
    } else if (this.isDraggingAnnotation && this.draggedAnnotation) {
      // Save the new position to the backend
      await this.annotationState.updateAnnotation(this.draggedAnnotation.annotationId, {
        normalizedX: this.draggedAnnotation.normalizedX,
        normalizedY: this.draggedAnnotation.normalizedY,
      });

      // Reset dragging state
      this.isDraggingAnnotation = false;
      this.draggedAnnotation = null;
      this.dragStartOffset = null;
    } else if (toolState.isDrawing && toolState.activeTool) {
      // Finalize annotation creation
      this.createAnnotationFromDrawing(
        toolState.activeTool,
        this.mouseDownPos,
        this.currentMousePos
      );

      // Reset drawing state
      this.annotationState.updateToolState({
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null,
      });
    }

    this.isMouseDown = false;
    this.mouseDownPos = null;
    this.currentMousePos = null;

    this.render();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.isMouseDown) {
      // Cancel drawing or dragging if mouse leaves canvas
      this.annotationState.updateToolState({
        isDrawing: false,
        drawingStart: null,
        drawingCurrent: null,
      });

      // Reset dragging state
      this.isDraggingAnnotation = false;
      this.draggedAnnotation = null;
      this.dragStartOffset = null;

      this.isMouseDown = false;
      this.mouseDownPos = null;
      this.currentMousePos = null;
      this.render();
    }
  }

  // ─────────────────────────────────────────────
  // Annotation Creation
  // ─────────────────────────────────────────────

  private createAnnotationFromDrawing(
    type: AnnotationType,
    start: CanvasPoint,
    end: CanvasPoint
  ): void {
    // Create bounding box from points
    const box = this.coordService.createBoxFromPoints(start, end);

    // Ignore very small boxes (likely accidental clicks)
    if (box.canvasWidth < 5 && box.canvasHeight < 5) {
      return;
    }

    // Convert to normalized coordinates
    const normalizedBox = this.coordService.canvasBoxToNormalized(
      box,
      this.pageWidth,
      this.pageHeight
    );

    // Clamp to valid range
    const clampedBox = this.coordService.clampNormalizedBox(normalizedBox);

    // Get default style for this annotation type
    const defaultStyle = DEFAULT_ANNOTATION_STYLES[type] || DEFAULT_ANNOTATION_STYLES.note;

    // Create annotation
    this.annotationState.createAnnotation({
      type,
      pageIndex: this.pageIndex,
      normalizedX: clampedBox.normalizedX,
      normalizedY: clampedBox.normalizedY,
      normalizedWidth: clampedBox.normalizedWidth,
      normalizedHeight: clampedBox.normalizedHeight,
      text: type === 'textbox' ? 'New Text' : '',
      style: { ...defaultStyle },
    });
  }

  // ─────────────────────────────────────────────
  // Hit Testing
  // ─────────────────────────────────────────────

  private findAnnotationAtPoint(point: CanvasPoint): Annotation | null {
    // Check annotations in reverse order (top-most first)
    for (let i = this.currentPageAnnotations.length - 1; i >= 0; i--) {
      const annotation = this.currentPageAnnotations[i];
      // Skip text boxes — they are handled as DOM elements, not canvas
      if (annotation.type === 'textbox') continue;
      const box = this.coordService.normalizedBoxToCanvas(
        {
          normalizedX: annotation.normalizedX,
          normalizedY: annotation.normalizedY,
          normalizedWidth: annotation.normalizedWidth,
          normalizedHeight: annotation.normalizedHeight,
        },
        this.pageWidth,
        this.pageHeight
      );

      if (this.coordService.isPointInBox(point, box)) {
        return annotation;
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────

  private render(): void {
    if (!this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render existing annotations (skip textbox — rendered as DOM elements)
    this.currentPageAnnotations.forEach((annotation) => {
      if (annotation.type === 'textbox') return; // Text boxes are DOM-based, not canvas
      this.renderAnnotation(annotation);
    });

    // Render drawing preview
    const toolState = this.annotationState.toolState;
    if (toolState.isDrawing && toolState.drawingStart && toolState.drawingCurrent) {
      this.renderDrawingPreview(toolState.drawingStart, toolState.drawingCurrent);
    }

    // Render selection handles
    const selectedAnnotations = this.annotationState.getSelectedAnnotations();
    selectedAnnotations.forEach((annotation) => {
      if (annotation.pageIndex === this.pageIndex) {
        this.renderSelectionHandles(annotation);
      }
    });
  }

  private renderAnnotation(annotation: Annotation): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const box = this.coordService.normalizedBoxToCanvas(
      {
        normalizedX: annotation.normalizedX,
        normalizedY: annotation.normalizedY,
        normalizedWidth: annotation.normalizedWidth,
        normalizedHeight: annotation.normalizedHeight,
      },
      this.pageWidth,
      this.pageHeight
    );

    const style = annotation.style;
    const isHovered = this.hoveredAnnotationId === annotation.annotationId;

    // Save context
    ctx.save();

    // Apply style
    ctx.globalAlpha = style.opacity || 1.0;
    ctx.strokeStyle = style.color || '#000000';
    ctx.lineWidth = style.strokeWidth || 2;

    if (style.fillColor) {
      ctx.fillStyle = style.fillColor;
    }

    // Render based on type
    switch (annotation.type) {
      case 'highlight':
        ctx.fillStyle = style.color || '#FFFF00';
        ctx.fillRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
        break;

      case 'shape':
        if (style.shapeType === 'rectangle' || !style.shapeType) {
          if (style.fillColor && style.fillOpacity) {
            ctx.globalAlpha = style.fillOpacity;
            ctx.fillRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
            ctx.globalAlpha = style.opacity || 1.0;
          }
          ctx.strokeRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
        } else if (style.shapeType === 'arrow') {
          this.drawArrow(
            ctx,
            box.canvasX,
            box.canvasY,
            box.canvasX + box.canvasWidth,
            box.canvasY + box.canvasHeight,
            style.color || '#000000',
            style.strokeWidth || 2
          );
        }
        break;

      case 'note':
        // Note type is used for arrows (context arrows)
        this.drawArrow(
          ctx,
          box.canvasX,
          box.canvasY,
          box.canvasX + box.canvasWidth,
          box.canvasY + box.canvasHeight,
          style.color || '#000000',
          style.strokeWidth || 3
        );
        break;

      case 'textbox':
        // Draw text background
        if (style.fillColor) {
          ctx.fillStyle = style.fillColor;
          ctx.fillRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
        }
        break;

      case 'redaction':
        ctx.fillStyle = '#000000';
        ctx.fillRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
        break;
    }

    // Draw text for ALL annotation types (if text exists)
    if (annotation.text && annotation.type !== 'redaction') {
      ctx.fillStyle = style.color || '#000000';
      ctx.font = `${style.fontSize || 14}px ${style.fontFamily || 'Arial'}`;
      ctx.textBaseline = 'top';

      // Word wrap text to fit within box
      const maxWidth = box.canvasWidth - 8;
      const words = annotation.text.split(' ');
      let line = '';
      let y = box.canvasY + 4;
      const lineHeight = (style.fontSize || 14) * 1.2;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, box.canvasX + 4, y);
          line = words[i] + ' ';
          y += lineHeight;

          // Stop if text exceeds box height
          if (y + lineHeight > box.canvasY + box.canvasHeight) {
            break;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, box.canvasX + 4, y);
    }

    // Hover effect
    if (isHovered) {
      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(box.canvasX - 2, box.canvasY - 2, box.canvasWidth + 4, box.canvasHeight + 4);
    }

    // Restore context
    ctx.restore();
  }

  private renderDrawingPreview(start: CanvasPoint, end: CanvasPoint): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const box = this.coordService.createBoxFromPoints(start, end);
    const toolState = this.annotationState.toolState;
    const activeTool = toolState.activeTool;

    if (!activeTool) return;

    const defaultStyle = DEFAULT_ANNOTATION_STYLES[activeTool];

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = defaultStyle.color || '#FFFF00';
    ctx.lineWidth = defaultStyle.strokeWidth || 2;
    ctx.setLineDash([5, 5]);

    // For arrows (note type), draw arrow preview
    if (activeTool === 'note') {
      this.drawArrow(
        ctx,
        start.canvasX,
        start.canvasY,
        end.canvasX,
        end.canvasY,
        defaultStyle.color || '#FF0000',
        defaultStyle.strokeWidth || 3
      );
    } else {
      // For other tools, draw rectangle preview
      ctx.strokeRect(box.canvasX, box.canvasY, box.canvasWidth, box.canvasHeight);
    }

    ctx.restore();
  }

  private renderSelectionHandles(annotation: Annotation): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const box = this.coordService.normalizedBoxToCanvas(
      {
        normalizedX: annotation.normalizedX,
        normalizedY: annotation.normalizedY,
        normalizedWidth: annotation.normalizedWidth,
        normalizedHeight: annotation.normalizedHeight,
      },
      this.pageWidth,
      this.pageHeight
    );

    ctx.save();

    // Selection border
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(box.canvasX - 2, box.canvasY - 2, box.canvasWidth + 4, box.canvasHeight + 4);

    // Resize handles (small squares at corners)
    const handleSize = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;

    const handles = [
      { x: box.canvasX, y: box.canvasY }, // Top-left
      { x: box.canvasX + box.canvasWidth, y: box.canvasY }, // Top-right
      { x: box.canvasX, y: box.canvasY + box.canvasHeight }, // Bottom-left
      { x: box.canvasX + box.canvasWidth, y: box.canvasY + box.canvasHeight }, // Bottom-right
    ];

    handles.forEach((handle) => {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });

    ctx.restore();
  }

  // ─────────────────────────────────────────────
  // Editing & Resizing
  // ─────────────────────────────────────────────

  /**
   * Find which resize handle (if any) is at the given point
   */
  private findResizeHandleAtPoint(
    point: CanvasPoint,
    annotation: Annotation
  ): 'tl' | 'tr' | 'bl' | 'br' | null {
    const box = this.coordService.normalizedBoxToCanvas(
      {
        normalizedX: annotation.normalizedX,
        normalizedY: annotation.normalizedY,
        normalizedWidth: annotation.normalizedWidth,
        normalizedHeight: annotation.normalizedHeight,
      },
      this.pageWidth,
      this.pageHeight
    );

    const handleSize = 8;
    const tolerance = handleSize;

    const handles = [
      { type: 'tl' as const, x: box.canvasX, y: box.canvasY },
      { type: 'tr' as const, x: box.canvasX + box.canvasWidth, y: box.canvasY },
      { type: 'bl' as const, x: box.canvasX, y: box.canvasY + box.canvasHeight },
      { type: 'br' as const, x: box.canvasX + box.canvasWidth, y: box.canvasY + box.canvasHeight },
    ];

    for (const handle of handles) {
      const dist = Math.sqrt(
        Math.pow(point.canvasX - handle.x, 2) + Math.pow(point.canvasY - handle.y, 2)
      );
      if (dist <= tolerance) {
        return handle.type;
      }
    }

    return null;
  }

  /**
   * Start editing ANY annotation (all types can have text)
   */
  private startEditingAnnotation(annotation: Annotation): void {
    this.editingAnnotationId = annotation.annotationId;

    // Create a temporary input element for editing
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const box = this.coordService.normalizedBoxToCanvas(
      {
        normalizedX: annotation.normalizedX,
        normalizedY: annotation.normalizedY,
        normalizedWidth: annotation.normalizedWidth,
        normalizedHeight: annotation.normalizedHeight,
      },
      this.pageWidth,
      this.pageHeight
    );

    // Create input element
    const input = document.createElement('textarea');
    input.value = annotation.text || '';
    input.style.position = 'absolute';
    input.style.left = `${rect.left + box.canvasX}px`;
    input.style.top = `${rect.top + box.canvasY}px`;
    input.style.width = `${box.canvasWidth}px`;
    input.style.height = `${box.canvasHeight}px`;
    input.style.fontSize = `${annotation.style?.fontSize || 14}px`;
    input.style.fontFamily = annotation.style?.fontFamily || 'Arial';
    input.style.color = annotation.style?.color || '#000000';
    input.style.backgroundColor = annotation.style?.fillColor || 'transparent';
    input.style.border = '2px solid #0066FF';
    input.style.padding = '4px';
    input.style.resize = 'none';
    input.style.zIndex = '10000';

    document.body.appendChild(input);
    input.focus();
    input.select();

    // Save on blur or Enter key
    const saveAndRemove = async () => {
      const newText = input.value;
      await this.annotationState.updateAnnotation(annotation.annotationId, {
        text: newText,
      });
      document.body.removeChild(input);
      this.editingAnnotationId = null;
      this.render();
    };

    input.addEventListener('blur', saveAndRemove);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveAndRemove();
      } else if (e.key === 'Escape') {
        document.body.removeChild(input);
        this.editingAnnotationId = null;
        this.render();
      }
    });
  }

  // ─────────────────────────────────────────────
  // Drawing Helpers
  // ─────────────────────────────────────────────

  /**
   * Draw an arrow from (x1, y1) to (x2, y2)
   */
  private drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number
  ): void {
    const headLength = 15; // Length of arrow head in pixels
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
