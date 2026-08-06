import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { cloneDeep } from 'lodash';


@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
  standalone: false
})
export class LastLooksPageComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() page: any[] = [];
  @Input() canEditDocument: boolean = false;
  @Input() selectedLine: any = null;
  @Input() currentPageIndex: number = 0;
  @Input() totalPages: number = 0;
  @Input() editMode: boolean = false;
  @Input() resetDocState: boolean = false;
  @Output() lineChanged = new EventEmitter<any>();
  @Output() lineSelected = new EventEmitter<Line>();
  @Output() categoryChanged = new EventEmitter<any>();
  @Output() positionChanged = new EventEmitter<any>();
  @Output() pageUpdate = new EventEmitter<any[]>();
  @Output() proceedToCheckout = new EventEmitter<void>();
  @Output() toggleVisibilityRequest = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  /** Parent toggles Last Looks edit mode (Edit PDF / Save Changes). */
  @Output() editModeToggle = new EventEmitter<void>();

  showContextMenu: boolean = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedLineIndex: number = -1;
  
  categoryPresets = [
    { label: 'Scene Header', category: 'scene-header', xPos: '60px' },
    { label: 'Action', category: 'action', xPos: '60px' },
    { label: 'Character', category: 'character', xPos: '220px' },
    { label: 'Dialogue', category: 'dialogue', xPos: '150px' },
    { label: 'Parenthetical', category: 'parenthetical', xPos: '180px' },
    { label: 'Transition', category: 'transition', xPos: '400px' },
    { label: 'Shot', category: 'shot', xPos: '60px' },
    { label: 'General', category: 'general', xPos: '60px' }
  ];

  selectedLineIds: number[] = [];
  lastSelectedIndex: number | null = null;
  showInstructions: boolean = false;
  showEditTips: boolean = false;
  changesMade: boolean = false;
  /** When true, taps toggle lines into/out of multi-select without modifier keys */
  touchSelectMode = false;

  // Line editing properties
  editingLine: number | null = null;
  editingText: string = '';

  // MOUSE DRAG PROPERTIES
  mouseDragging: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragLineId: number | null = null;
  dragType: 'line' | 'end' | 'continue' | 'continue-top' = 'line';
  initialPosition: { x: number; y: number } = { x: 0, y: 0 };

  // Touch / mobile: long-press → same context menu as right-click
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTouchX = 0;
  private longPressTouchY = 0;
  private longPressLine: Line | null = null;
  private longPressLineIndex = -1;
  private longPressOpenedMenu = false;
  private suppressNextClick = false;
  private lastTapTime = 0;
  private lastTapLineId: number | null = null;
  private static readonly LONG_PRESS_MS = 480;
  private static readonly LONG_PRESS_MOVE_PX = 10;
  private static readonly DOUBLE_TAP_MS = 380;

  // Bar text dragging
  barTextDragging: boolean = false;
  barTextDragStartX: number = 0;
  barTextDragLineId: number | null = null;
  barTextDragType: 'start' | 'end' | 'continue' | 'continue-top' | null = null;
  barTextInitialOffset: number = 0;

  // Bar text editing
  barTextEditingId: number | null = null;
  barTextEditingType: 'start' | 'end' | 'continue' | 'continue-top' | null = null;
  barTextEditingContent: string = '';

  // Scene number editing
  editingSceneNumber: string | null = null;
  originalSceneNumber: string | null = null;
  editingSceneText: string | null = null;
  originalSceneText: string | null = null;
  callsheetLoadError: string | null = null;

  // Add initialPageState property
  private initialPageState: any[] = [];
  private isUndoInProgress: boolean = false;

  private subscription: Subscription;
  private sceneHeaderTextUpdateSubscription: Subscription;

  


  // ═══ X-BOX EDITING STATE ═══
  selectedXboxIndex: string | null = null;
  selectedAnnotationId: string | null = null;
  private xboxDragging = false;
  private xboxDragStartX = 0;
  private xboxDragStartY = 0;
  private xboxDragInitialTop = 0;
  private xboxDragInitialLeft = 0;
  private xboxDragInitialWidth = 0;
  private xboxDragInitialHeight = 0;
  private xboxResizing = false;
  private xboxResizeEdge: string | null = null;
  private xboxResizeInitial: { top: number; bottom: number; left: number; right: number } | null = null;
  private xboxResizeStartX = 0;
  private xboxResizeStartY = 0;
  private xboxUndoSnapshot: any[] = [];
  private xboxUndoRedoSubscription: Subscription | null = null;
  private readonly xboxPageWidth = 816;
  private readonly xboxPageHeight = 1056;

  @ViewChild('pdfViewer') pdfViewer: any;
  /** pageViewport ref kept for backward-compat but no longer drives zoom — zoom is owned by LastLooksComponent. */
  @ViewChild('pageViewport') pageViewport?: ElementRef<HTMLElement>;

  /** Authoritative scale passed from LastLooksComponent (FR-013, FR-017).
   *  All drag math divides screen-space deltas by this value to produce
   *  canonical document-space coordinates (SC-001). */
  @Input() pageScale: number = 1;

  // Page dimensions are canonical; they must not be used for zoom computation here.
  private static readonly PAGE_WIDTH = 816;
  private static readonly PAGE_HEIGHT = 1056;

  get pageTransform(): string {
    return `scale(${this.pageScale})`;
  }

  get scaledPageWidth(): number {
    return Math.round(LastLooksPageComponent.PAGE_WIDTH * this.pageScale);
  }

  get scaledPageHeight(): number {
    return Math.round(LastLooksPageComponent.PAGE_HEIGHT * this.pageScale);
  }

  // Temporary workaround to convert GCS URL to Firebase Storage URL
  public convertToFirebaseUrl(gcsUrl: string): string {
    console.log('convertToFirebaseUrl called with:', gcsUrl);
    
    if (!gcsUrl || !gcsUrl.includes('storage.googleapis.com')) {
      console.log('URL is not a Firebase Storage URL, returning as-is:', gcsUrl);
      return gcsUrl;
    }
    
    // Extract bucket and path from GCS URL
    const url = new URL(gcsUrl);
    const pathParts = url.pathname.split('/');
    const bucket = pathParts[1];
    const path = pathParts.slice(2).join('/');
    
    // Decode the path first to avoid double-encoding
    const decodedPath = decodeURIComponent(path);
    
    // Convert to Firebase Storage download URL
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(decodedPath)}?alt=media`;
    console.log('Converted Firebase URL:', firebaseUrl);
    
    return firebaseUrl;
  }

  constructor(
    private undoService: UndoService,
    public cdRef: ChangeDetectorRef,
    private pdfService: PdfService,
    private annotationState: AnnotationStateService
  ) {
    // Subscribe to line updates from the service
    this.subscription = this.pdfService.finalDocumentData$.subscribe(update => {
      if (update) {
        // If the update is for our current page
        if (update.docPageIndex === this.currentPageIndex) {
          // update.docPageLineIndex is already the array index within the page
          const lineIndex = update.docPageLineIndex;
          if (lineIndex >= 0 && lineIndex < this.page.length) {
            // Update only the specific line that changed
            this.page[lineIndex] = { ...update.line };
            this.cdRef.detectChanges();
            console.log('Updated line via subscription:', update.docPageLineIndex, update.line);
          }
        }
      }
    });

    // Subscribe to scene header text updates
    this.sceneHeaderTextUpdateSubscription = this.pdfService.sceneHeaderTextUpdated$.subscribe(
      ({ scene, newText }) => {
        // Update the scene text in the current page
        const updatedPage = this.page.map(line => {
          if (line.index === scene.index) {
            return { ...line, text: newText };
          }
          // Also update any lines that reference this scene
          if (line.sceneNumberText === scene.sceneNumberText && line.category === 'scene-header') {
            return { ...line, text: newText };
          }
          return line;
        });
        this.page = updatedPage;
        
        // Force change detection
        this.cdRef.detectChanges();
      }
    );

    this.xboxUndoRedoSubscription = this.undoService.undoRedo$.subscribe(({ item }) => {
      if ((item as any)?.type === 'xbox-change') {
        const restoredPage = this.pdfService.finalDocument?.data?.[this.currentPageIndex];
        if (restoredPage) {
          this.page = [...restoredPage];
        }
        if (this.selectedXboxIndex !== null && !this.getXboxById(this.selectedXboxIndex)) {
          this.selectedXboxIndex = null;
        }
        this.pageUpdate.emit([...this.page]);
        this.cdRef.detectChanges();
      }
    });

  }

  /** Returns true when the current page was doubled during a scene reorder (FR-001). */
  get isDoubledPage(): boolean {
    return !!this.page?.[0]?.isDoubledPage;
  }

  ngOnInit(): void {
    if (this.editMode) {
      this.canEditDocument = true;
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log('LastLooksPage ngOnChanges:', Object.keys(changes));

    if (changes['page']) {
      const newPage = changes['page'].currentValue;
      console.log('Page input changed. New page has', newPage?.length, 'lines');

      // Log scene numbers to verify updates are propagating
      if (newPage && Array.isArray(newPage)) {
        const sceneNumbers = newPage
          .filter(line => line.sceneNumberText)
          .map(line => `${line.category}: "${line.sceneNumberText}"`)
          .join(', ');
        console.log('Page scene numbers:', sceneNumbers);
      }

      // Store initial state when page changes (only if we have a valid page)
      this.callsheetLoadError = null;
      if (this.page && Array.isArray(this.page)) {
        this.initialPageState = [...this.page];
      }

      // Special handling for callsheet pages
      if (this.isCallsheetPage(newPage)) {
        console.log('New page is a callsheet page:', {
          imagePath: newPage[0]?.imagePath,
          type: newPage[0]?.type,
          category: newPage[0]?.category,
          hasLoadError: !!newPage[0]?.loadError
        });

        // Validate the image path
        if (!newPage[0]?.imagePath) {
          console.error('Callsheet page has no image path');
          if (newPage[0]) {
            newPage[0].loadError = 'No image path provided';
          }
        } else {
          console.log('Callsheet page has valid image path:', newPage[0].imagePath);
        }
      }

      // Only reset editing states if we're not currently in an undo operation
      // This prevents undo from being interrupted by page changes
      if (!this.isUndoInProgress) {
        // Reset editing states
        this.editingLine = null;
        this.editingText = '';
        this.editingSceneNumber = null;
        this.editingSceneText = null;
        this.barTextEditingId = null;
        this.barTextEditingType = null;
        this.barTextEditingContent = '';

        // Clear selection when page changes
        this.clearSelection();
      }

      // Force change detection
      this.cdRef.detectChanges();
    }
  
    // Handle other changes as before...
    if (changes['editMode']) {
      this.canEditDocument = changes['editMode'].currentValue;
      console.log('LastLooks editState changed to:', this.canEditDocument);
    }
  
    if (changes['resetDocState'] && changes['resetDocState'].currentValue) {
      console.log('LastLooksPage: Resetting to initial page state');

      // Reset to the initial page state
      this.page = JSON.parse(JSON.stringify(this.initialPageState));
      this.selectedLineIds = [];
      this.lastSelectedIndex = null;
      this.selectedLine = null;

      // Clear any editing states
      this.editingLine = null;
      this.editingText = '';
      this.editingSceneNumber = null;
      this.editingSceneText = null;
      this.barTextEditingId = null;
      this.barTextEditingType = null;
      this.barTextEditingContent = '';

      // Clear mouse dragging states
      this.mouseDragging = false;
      this.dragLineId = null;
      this.barTextDragging = false;
      this.barTextDragLineId = null;

      // Force change detection
      this.cdRef.detectChanges();

      // Emit the reset page
      this.pageUpdate.emit(this.page);

      console.log('LastLooksPage: Page reset to initial state complete');
    }
  }


  ngOnDestroy(): void {
    this.clearLongPressTimer();
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.sceneHeaderTextUpdateSubscription) {
      this.sceneHeaderTextUpdateSubscription.unsubscribe();
    }
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchUp);
    document.removeEventListener('touchmove', this.moveBarTextTouch);
    document.removeEventListener('touchend', this.endBarTextDragTouch);
    document.removeEventListener('mousemove', this.handleXboxDragMove);
    document.removeEventListener('mouseup', this.handleXboxDragEnd);
    document.removeEventListener('mousemove', this.handleXboxResizeMove);
    document.removeEventListener('mouseup', this.handleXboxResizeEnd);
    this.xboxUndoRedoSubscription?.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.pdfViewer) {
      // Disable right-click context menu
      this.pdfViewer.nativeElement.addEventListener('contextmenu', (e: Event) => {
        e.preventDefault();
        return false;
      });

      // Disable keyboard shortcuts
      this.pdfViewer.nativeElement.addEventListener('keydown', (e: KeyboardEvent) => {
        // Prevent common download shortcuts
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          return false;
        }
      });
    }
  }

  // ============= MOUSE DRAG METHODS =============

  onMouseDown(event: MouseEvent, line: Line): void {
    // Only auto-select if no modifier keys are pressed AND line is not selected
    // This provides immediate feedback for drag operations
    if (!this.canEditDocument || event.shiftKey || event.ctrlKey || event.metaKey) return;

    if (!this.isLineSelected(line)) {
      console.log('🔽 Auto-selecting line on mousedown:', line.docPageLineIndex);
      const mockEvent = { shiftKey: false, ctrlKey: false, metaKey: false } as MouseEvent;
      this.selectLine(line, mockEvent);
    }
  }

  startLineDrag(event: MouseEvent, line: Line, type: 'line' | 'end' | 'continue' | 'continue-top'): void {
    // Don't start drag if we're in a double-click situation
    if (event.detail > 1) {
        return;
    }

    if (!this.canEditDocument) return;

    // Don't start drag if modifier keys are pressed (allow multi-selection)
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    // For main line drag, always select the line (whether it was selected or not)
    if (type === 'line') {
      console.log('🎯 Selecting line for drag:', line.docPageLineIndex);
      const mockEvent = { shiftKey: false, ctrlKey: false, metaKey: false } as MouseEvent;
      this.selectLine(line, mockEvent);
    }

    // Store the original state before any changes for undo
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex !== -1) {
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        cloneDeep(line), // Deep clone of the original state
        `Drag ${type} position`
      );
    }

    event.preventDefault();
    event.stopPropagation();

    this.mouseDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragLineId = line.docPageLineIndex;
    this.dragType = type;

    // Add grab cursor to body
    document.body.classList.add('grab-cursor');

    // Store initial position
    switch (type) {
        case 'line':
            this.initialPosition = {
                x: parseInt(String(line.calculatedXpos || '0')),
                y: parseInt(String(line.calculatedYpos || '0'))
            };
            break;
        case 'end':
            this.initialPosition = {
                x: 0,
                y: parseInt(String(line.calculatedEnd || '0'))
            };
            break;
        case 'continue':
        case 'continue-top':
            this.initialPosition = {
                x: 0,
                y: parseInt(String(line.calculatedBarY || '0'))
            };
            break;
    }

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  // Handle mouse move
  handleMouseMove = (event: MouseEvent): void => {
    if (!this.mouseDragging) return;
    
    // Screen movement must be divided by the page scale to stay in page coordinates
    const scale = this.pageScale;
    const deltaX = (event.clientX - this.dragStartX) / scale;
    const deltaY = (event.clientY - this.dragStartY) / scale;
    
    // Calculate new position: INITIAL + DELTA
    const newX = this.initialPosition.x + deltaX;
    const newY = this.initialPosition.y - deltaY; // Invert Y for bottom-based coordinates
    
    // Find the line
    const lineIndex = this.page.findIndex(line => line.docPageLineIndex === this.dragLineId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    // Update position based on type
    switch (this.dragType) {
      case 'line':
        line.calculatedXpos = Math.max(0, newX) + 'px';
        line.calculatedYpos = Math.max(0, newY) + 'px';
        break;
      case 'end':
        line.calculatedEnd = Math.max(0, newY) + 'px';
        break;
      case 'continue':
        line.calculatedBarY = Math.max(0, newY) + 'px';
        break;
      case 'continue-top':
        line.calculatedBarY = Math.max(0, newY) + 'px';
        break;
    }
    
    // Force update
    this.cdRef.detectChanges();
  };

  // Handle mouse up
  handleMouseUp = (event: MouseEvent): void => {
    if (!this.mouseDragging) return;

    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    // Remove grab cursor
    document.body.classList.remove('grab-cursor');

    // Calculate final position (screen delta converted to page coordinates)
    const scale = this.pageScale;
    const deltaX = (event.clientX - this.dragStartX) / scale;
    const deltaY = (event.clientY - this.dragStartY) / scale;
    const finalX = this.initialPosition.x + deltaX;
    const finalY = this.initialPosition.y - deltaY;

    // Find the line
    const lineIndex = this.page.findIndex(line => line.docPageLineIndex === this.dragLineId);
    if (lineIndex === -1) return;

    const line = this.page[lineIndex];

    // Check if position actually changed (minimum drag threshold)
    const hasPositionChanged = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;

    // Set final position and store raw values
    switch (this.dragType) {
      case 'line':
        line.calculatedXpos = Math.max(0, finalX) + 'px';
        line.calculatedYpos = Math.max(0, finalY) + 'px';
        line.xPos = Math.max(0, finalX);
        line.yPos = Math.max(0, finalY);
        break;
      case 'end':
        line.calculatedEnd = Math.max(0, finalY) + 'px';
        line.endY = Math.max(0, finalY);
        break;
      case 'continue':
      case 'continue-top':
        line.calculatedBarY = Math.max(0, finalY) + 'px';
        line.barY = Math.max(0, finalY);
        break;
    }

    // Only emit events and update if position actually changed
    if (hasPositionChanged) {
      // Emit events and update PdfService
      this.positionChanged.emit({
        line,
        lineIndex,
        newPosition: { x: Math.max(0, finalX) + 'px', y: Math.max(0, finalY) + 'px' },
        originalPosition: { x: this.initialPosition.x + 'px', y: this.initialPosition.y + 'px' },
        isEndSpan: this.dragType === 'end',
        isContinueSpan: this.dragType === 'continue',
        isContinueTopSpan: this.dragType === 'continue-top'
      });

      // Note: pageUpdate.emit() removed to prevent duplicate PDF service updates
      // handlePositionChange in parent component already handles the update
    }

    // Clear dragging state
    this.mouseDragging = false;
    this.dragLineId = null;

    this.cdRef.detectChanges();
  };

  // ============= BAR TEXT DRAGGING METHODS =============
  
  startBarTextDrag(event: MouseEvent, line: Line, type: 'start' | 'end' | 'continue' | 'continue-top'): void {
    if (!this.canEditDocument || this.barTextEditingId !== null) return;

    // Don't start bar text drag if modifier keys are pressed (allow multi-selection)
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    // Record undo state before dragging bar text
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      cloneDeep(line), // Deep clone of the original state
      `Drag ${type} bar text`
    );
    
    this.barTextDragging = true;
    this.barTextDragStartX = event.clientX;
    this.barTextDragLineId = line.docPageLineIndex;
    this.barTextDragType = type;
    
    switch (type) {
      case 'start':
        this.barTextInitialOffset = line.startTextOffset || 0;
        break;
      case 'end':
        this.barTextInitialOffset = line.endTextOffset || 0;
        break;
      case 'continue':
        this.barTextInitialOffset = line.continueTextOffset || 0;
        break;
      case 'continue-top':
        this.barTextInitialOffset = line.continueTopTextOffset || 0;
        break;
    }
    
    document.addEventListener('mousemove', this.moveBarText);
    document.addEventListener('mouseup', this.endBarTextDrag);
    document.body.classList.add('ew-resize-cursor');
  }

  moveBarText = (event: MouseEvent): void => {
    if (!this.barTextDragging) return;
    
    const deltaX = (event.clientX - this.barTextDragStartX) / this.pageScale;
    const newOffset = this.barTextInitialOffset + deltaX;
    
    const lineIndex = this.page.findIndex(line => line.docPageLineIndex === this.barTextDragLineId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    switch (this.barTextDragType) {
      case 'start':
        line.startTextOffset = newOffset;
        break;
      case 'end':
        line.endTextOffset = newOffset;
        break;
      case 'continue':
        line.continueTextOffset = newOffset;
        break;
      case 'continue-top':
        line.continueTopTextOffset = newOffset;
        break;
    }
    
    this.cdRef.detectChanges();
    this.pageUpdate.emit([...this.page]);
  };

  endBarTextDrag = (event: MouseEvent): void => {
    if (!this.barTextDragging) return;

    // Check if text offset actually changed (minimum drag threshold)
    const lineIndex = this.page.findIndex(line => line.docPageLineIndex === this.barTextDragLineId);
    if (lineIndex !== -1) {
      const line = this.page[lineIndex];
      let currentOffset = 0;

      switch (this.barTextDragType) {
        case 'start':
          currentOffset = line.startTextOffset || 0;
          break;
        case 'end':
          currentOffset = line.endTextOffset || 0;
          break;
        case 'continue':
          currentOffset = line.continueTextOffset || 0;
          break;
        case 'continue-top':
          currentOffset = line.continueTopTextOffset || 0;
          break;
      }

      const hasOffsetChanged = Math.abs(currentOffset - this.barTextInitialOffset) > 2;

      // If no significant change, revert to original offset
      if (!hasOffsetChanged) {
        switch (this.barTextDragType) {
          case 'start':
            line.startTextOffset = this.barTextInitialOffset;
            break;
          case 'end':
            line.endTextOffset = this.barTextInitialOffset;
            break;
          case 'continue':
            line.continueTextOffset = this.barTextInitialOffset;
            break;
          case 'continue-top':
            line.continueTopTextOffset = this.barTextInitialOffset;
            break;
        }
      }
    }

    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
    document.body.classList.remove('ew-resize-cursor');

    this.pageUpdate.emit([...this.page]);

    this.barTextDragging = false;
    this.barTextDragLineId = null;
    this.barTextDragType = null;
  };

  // ============= TOUCH / MOBILE (long-press menu + drag) =============

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onLineTouchStart(event: TouchEvent, line: Line, lineIndex: number): void {
    if (!this.canEditDocument || this.editingLine !== null) return;
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.longPressOpenedMenu = false;
    this.longPressTouchX = touch.clientX;
    this.longPressTouchY = touch.clientY;
    this.longPressLine = line;
    this.longPressLineIndex = lineIndex;

    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null;
      if (!this.longPressLine) return;

      // Haptic feedback when available
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          (navigator as Navigator & { vibrate?: (p: number) => void }).vibrate?.(12);
        }
      } catch {
        /* ignore */
      }

      this.longPressOpenedMenu = true;
      this.suppressNextClick = true;
      this.openContextMenu(
        {
          clientX: this.longPressTouchX,
          clientY: this.longPressTouchY,
          preventDefault: () => undefined
        },
        this.longPressLine,
        this.longPressLineIndex
      );
    }, LastLooksPageComponent.LONG_PRESS_MS);
  }

  onLineTouchMove(event: TouchEvent): void {
    if (!event.touches.length) return;
    const touch = event.touches[0];

    // Cancel long-press if finger moves (scroll / start drag)
    if (this.longPressTimer) {
      const dist = Math.hypot(
        touch.clientX - this.longPressTouchX,
        touch.clientY - this.longPressTouchY
      );
      if (dist > LastLooksPageComponent.LONG_PRESS_MOVE_PX) {
        this.clearLongPressTimer();
        // Convert into a line drag once the user has clearly moved
        if (this.longPressLine && this.canEditDocument && !this.mouseDragging) {
          event.preventDefault();
          this.beginLineDragFromPoint(
            touch.clientX,
            touch.clientY,
            this.longPressLine,
            'line'
          );
          document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
          document.addEventListener('touchend', this.handleTouchUp);
          document.addEventListener('touchcancel', this.handleTouchUp);
        }
      }
    } else if (this.mouseDragging) {
      event.preventDefault();
    }
  }

  onLineTouchEnd(event: TouchEvent): void {
    const wasWaiting = !!this.longPressTimer;
    this.clearLongPressTimer();

    if (this.longPressOpenedMenu) {
      this.longPressOpenedMenu = false;
      this.suppressNextClick = true;
      setTimeout(() => { this.suppressNextClick = false; }, 350);
      return;
    }

    // Quick tap → select (existing click handler) + double-tap → edit text
    if (wasWaiting && this.longPressLine && !this.mouseDragging) {
      const line = this.longPressLine;
      const now = Date.now();
      const isDoubleTap =
        this.lastTapLineId === line.docPageLineIndex &&
        now - this.lastTapTime < LastLooksPageComponent.DOUBLE_TAP_MS;

      this.lastTapTime = now;
      this.lastTapLineId = line.docPageLineIndex;

      if (isDoubleTap) {
        event.preventDefault();
        this.suppressNextClick = true;
        setTimeout(() => { this.suppressNextClick = false; }, 350);
        if (!this.isLineSelected(line)) {
          this.selectLine(line, { shiftKey: false, ctrlKey: false, metaKey: false } as MouseEvent);
        }
        this.startEditingLine(line.docPageLineIndex, line.text);
        this.lastTapLineId = null;
      }
    }

    this.longPressLine = null;
    this.longPressLineIndex = -1;
  }

  /** Shared drag bootstrap used by mouse + touch. */
  private beginLineDragFromPoint(
    clientX: number,
    clientY: number,
    line: Line,
    type: 'line' | 'end' | 'continue' | 'continue-top'
  ): void {
    if (type === 'line') {
      const mockEvent = { shiftKey: false, ctrlKey: false, metaKey: false } as MouseEvent;
      this.selectLine(line, mockEvent);
    }

    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex !== -1) {
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        cloneDeep(line),
        `Drag ${type} position`
      );
    }

    this.mouseDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.dragLineId = line.docPageLineIndex;
    this.dragType = type;
    document.body.classList.add('grab-cursor');

    switch (type) {
      case 'line':
        this.initialPosition = {
          x: parseInt(String(line.calculatedXpos || '0'), 10) || 0,
          y: parseInt(String(line.calculatedYpos || '0'), 10) || 0
        };
        break;
      case 'end':
        this.initialPosition = {
          x: 0,
          y: parseInt(String(line.calculatedEnd || '0'), 10) || 0
        };
        break;
      case 'continue':
      case 'continue-top':
        this.initialPosition = {
          x: 0,
          y: parseInt(String(line.calculatedBarY || '0'), 10) || 0
        };
        break;
    }
  }

  startLineTouchDrag(
    event: TouchEvent,
    line: Line,
    type: 'line' | 'end' | 'continue' | 'continue-top'
  ): void {
    if (!this.canEditDocument || event.touches.length !== 1) return;
    this.clearLongPressTimer();
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this.beginLineDragFromPoint(touch.clientX, touch.clientY, line, type);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchUp);
    document.addEventListener('touchcancel', this.handleTouchUp);
  }

  handleTouchMove = (event: TouchEvent): void => {
    if (!this.mouseDragging || !event.touches.length) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  };

  handleTouchUp = (event: TouchEvent): void => {
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchUp);
    document.removeEventListener('touchcancel', this.handleTouchUp);
    const touch = event.changedTouches?.[0];
    if (touch) {
      this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    } else if (this.mouseDragging) {
      this.handleMouseUp({ clientX: this.dragStartX, clientY: this.dragStartY } as MouseEvent);
    }
    this.suppressNextClick = true;
    setTimeout(() => { this.suppressNextClick = false; }, 350);
  };

  startBarTextTouchDrag(
    event: TouchEvent,
    line: Line,
    type: 'start' | 'end' | 'continue' | 'continue-top'
  ): void {
    if (!this.canEditDocument || this.barTextEditingId !== null || event.touches.length !== 1) return;
    event.stopPropagation();
    event.preventDefault();
    this.clearLongPressTimer();

    const touch = event.touches[0];
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      cloneDeep(line),
      `Drag ${type} bar text`
    );

    this.barTextDragging = true;
    this.barTextDragStartX = touch.clientX;
    this.barTextDragLineId = line.docPageLineIndex;
    this.barTextDragType = type;

    switch (type) {
      case 'start':
        this.barTextInitialOffset = line.startTextOffset || 0;
        break;
      case 'end':
        this.barTextInitialOffset = line.endTextOffset || 0;
        break;
      case 'continue':
        this.barTextInitialOffset = line.continueTextOffset || 0;
        break;
      case 'continue-top':
        this.barTextInitialOffset = line.continueTopTextOffset || 0;
        break;
    }

    document.addEventListener('touchmove', this.moveBarTextTouch, { passive: false });
    document.addEventListener('touchend', this.endBarTextDragTouch);
    document.addEventListener('touchcancel', this.endBarTextDragTouch);
    document.body.classList.add('ew-resize-cursor');
  }

  moveBarTextTouch = (event: TouchEvent): void => {
    if (!this.barTextDragging || !event.touches.length) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.moveBarText({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  };

  endBarTextDragTouch = (event: TouchEvent): void => {
    document.removeEventListener('touchmove', this.moveBarTextTouch);
    document.removeEventListener('touchend', this.endBarTextDragTouch);
    document.removeEventListener('touchcancel', this.endBarTextDragTouch);
    const touch = event.changedTouches?.[0];
    this.endBarTextDrag({ clientX: touch?.clientX ?? this.barTextDragStartX, clientY: touch?.clientY ?? 0 } as MouseEvent);
  };

  onSceneNumberTouchEnd(event: TouchEvent, line: Line): void {
    if (!this.canEditDocument || line.category !== 'scene-header') return;
    const now = Date.now();
    const key = Number(`-1${line.docPageLineIndex}`); // namespace separate from line taps
    const isDoubleTap =
      this.lastTapLineId === key &&
      now - this.lastTapTime < LastLooksPageComponent.DOUBLE_TAP_MS;
    this.lastTapTime = now;
    this.lastTapLineId = key;
    if (isDoubleTap) {
      event.preventDefault();
      this.startEditingSceneNumber(line);
      this.lastTapLineId = null;
    }
  }

  // ============= BAR TEXT EDITING METHODS =============

  onBarTextDoubleClick(event: MouseEvent, line: Line, type: 'start' | 'end' | 'continue' | 'continue-top'): void {
    if (!this.canEditDocument) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    // Record undo state before editing bar text
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit ${type} bar text`
    );
    
    this.barTextEditingId = line.docPageLineIndex;
    this.barTextEditingType = type;
    
    switch (type) {
      case 'start':
        this.barTextEditingContent = line.customStartText || `START ${line.sceneNumberText || ''}`;
        break;
      case 'end':
        this.barTextEditingContent = line.customEndText || `END ${line.sceneNumberText || ''}`;
        break;
      case 'continue':
        this.barTextEditingContent = line.customContinueText || `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`;
        break;
      case 'continue-top':
        this.barTextEditingContent = line.customContinueTopText || `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`;
        break;
    }
    
    this.cdRef.detectChanges();
    
    setTimeout(() => {
      const editableElement = document.getElementById(`bar-text-edit-${line.docPageLineIndex}-${type}`);
      if (editableElement) {
        editableElement.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableElement);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }

  onBarTextChange(event: Event, line: Line): void {
    const target = event.target as HTMLElement;
    this.barTextEditingContent = target.textContent || '';
  }

  saveBarTextEdit(): void {
    if (this.barTextEditingId === null || this.barTextEditingType === null) return;
    
    const lineIndex = this.page.findIndex(line => line.docPageLineIndex === this.barTextEditingId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    switch (this.barTextEditingType) {
      case 'start':
        line.customStartText = this.barTextEditingContent;
        break;
      case 'end':
        line.customEndText = this.barTextEditingContent;
        break;
      case 'continue':
        line.customContinueText = this.barTextEditingContent;
        break;
      case 'continue-top':
        line.customContinueTopText = this.barTextEditingContent;
        break;
    }
    
    this.barTextEditingId = null;
    this.barTextEditingType = null;
    this.barTextEditingContent = '';
    
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  cancelBarTextEdit(): void {
    this.barTextEditingId = null;
    this.barTextEditingType = null;
    this.barTextEditingContent = '';
    this.cdRef.detectChanges();
  }

  handleBarTextKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveBarTextEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelBarTextEdit();
    }
  }

  // ============= SELECTION METHODS =============

  selectLine(line: Line, event: MouseEvent): void {
    if (this.suppressNextClick) {
      return;
    }
    console.log('🖱️ selectLine called for line:', line.docPageLineIndex, 'shiftKey:', event.shiftKey, 'ctrlKey:', event.ctrlKey, 'lastSelectedIndex:', this.lastSelectedIndex);
    if (!this.canEditDocument) return;

    const lineId = line.docPageLineIndex;
    
    if (event.shiftKey && this.lastSelectedIndex !== null) {
      // Shift + click for range selection
      this.selectedLineIds = [];

      // Find array indices for both the last selected line and current line
      const lastSelectedArrayIndex = this.page.findIndex(l => l.docPageLineIndex === this.lastSelectedIndex);
      const currentArrayIndex = this.page.findIndex(l => l.docPageLineIndex === lineId);

      if (lastSelectedArrayIndex !== -1 && currentArrayIndex !== -1) {
        const startIndex = Math.min(lastSelectedArrayIndex, currentArrayIndex);
        const endIndex = Math.max(lastSelectedArrayIndex, currentArrayIndex);

        for (let i = startIndex; i <= endIndex; i++) {
          if (this.page[i] && this.page[i].docPageLineIndex !== undefined) {
            this.selectedLineIds.push(this.page[i].docPageLineIndex);
          }
        }
      }
    } else if (this.touchSelectMode || event.ctrlKey || event.metaKey) {
      // Touch-select mode or Ctrl/Cmd + click for multi-selection
      const index = this.selectedLineIds.indexOf(lineId);
      if (index === -1) {
        this.selectedLineIds.push(lineId);
      } else {
        this.selectedLineIds.splice(index, 1);
      }
      this.lastSelectedIndex = lineId;
    } else {
      // Single selection
      this.selectedLineIds = [lineId];
      this.lastSelectedIndex = lineId;
    }
    
    // Update selection state for all lines
    this.page.forEach(l => {
      l.multipleSelected = this.selectedLineIds.length > 1;
    });
    
    this.emitSelectedLines();
    this.cdRef.detectChanges();

    console.log('After selection, selectedLineIds:', this.selectedLineIds);
  }

  private emitSelectedLines() {
    if (this.selectedLineIds.length === 0) {
      this.lineSelected.emit(null);
      return;
    }
    
    if (this.selectedLineIds.length === 1) {
      const selectedLine = this.page.find(line => line.docPageLineIndex === this.selectedLineIds[0]);
      this.lineSelected.emit(selectedLine);
      return;
    }
    
    const primaryLine = this.page.find(line => line.docPageLineIndex === this.selectedLineIds[0]);
    if (primaryLine) {
      primaryLine.multipleSelected = true;
      primaryLine.selectedCount = this.selectedLineIds.length;
      this.lineSelected.emit(primaryLine);
    }
  }

  isLineSelected(line: Line): boolean {
    if (!this.canEditDocument) return false;
    return this.selectedLineIds.includes(line.docPageLineIndex);
  }

  isSelectedLine(line: any, index: number): boolean {
    if (!this.selectedLine) return false;
    return this.selectedLine.docPageLineIndex === line.docPageLineIndex;
  }

  isLineEditing(line: any): boolean {
    return this.editingLine === line.docPageLineIndex;
  }

  clearSelection(): void {
    // Clear selection state
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.lineSelected.emit(null);

    // Cancel editing if currently editing
    if (this.editingLine !== null) {
      this.cancelEdit();
    }

    // Update selection state for all lines
    this.page.forEach(l => {
      l.multipleSelected = false;
    });

    this.cdRef.detectChanges();
  }

  // ============= CONTEXT MENU METHODS =============

  openContextMenu(event: { clientX: number; clientY: number; preventDefault?: () => void }, line: any, lineIndex: number): void {
    console.log('🔴 openContextMenu called, selectedLineIds:', this.selectedLineIds, 'line:', line?.docPageLineIndex);
    event.preventDefault?.();

    // If no lines are selected, select the right-clicked / long-pressed line
    if (this.selectedLineIds.length === 0 && line) {
      console.log('🔴 No lines selected, auto-selecting line');
      this.selectedLineIds = [line.docPageLineIndex];
      this.lastSelectedIndex = line.docPageLineIndex;
      this.emitSelectedLines();
    }

    console.log('🔴 Opening context menu');
    this.showContextMenu = true;
    this.contextMenuPosition = this.clampContextMenuPosition(event.clientX, event.clientY);
    this.selectedLine = line;
    this.selectedLineIndex = lineIndex;
    this.cdRef.detectChanges();
  }

  /** Keep the menu on-screen on phones (right-click coords can be near the edge). */
  private clampContextMenuPosition(clientX: number, clientY: number): { x: number; y: number } {
    const menuWidth = 240;
    const menuHeight = 420;
    const pad = 8;
    const maxX = Math.max(pad, window.innerWidth - menuWidth - pad);
    const maxY = Math.max(pad, window.innerHeight - menuHeight - pad);
    return {
      x: Math.min(Math.max(pad, clientX), maxX),
      y: Math.min(Math.max(pad, clientY), maxY)
    };
  }

  /** Toolbar / mobile fallback: open the same menu for the current selection. */
  openContextMenuForSelection(): void {
    if (!this.canEditDocument || this.selectedLineIds.length === 0) return;
    const lineId = this.selectedLineIds[this.selectedLineIds.length - 1];
    const line = this.page.find(l => l.docPageLineIndex === lineId);
    if (!line) return;
    this.openContextMenu(
      {
        clientX: Math.min(window.innerWidth - 24, window.innerWidth * 0.55),
        clientY: Math.min(window.innerHeight - 24, window.innerHeight * 0.35),
        preventDefault: () => undefined
      },
      line,
      lineId
    );
  }

  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  editSelectedLineText(event: Event): void {
    console.log('🎯 Edit Text clicked! selectedLineIds:', this.selectedLineIds);
    event.stopPropagation();
    this.showContextMenu = false;

    // Only allow editing one line at a time
    if (this.selectedLineIds.length === 1) {
      const lineId = this.selectedLineIds[0];
      const line = this.page.find(l => l.docPageLineIndex === lineId);
      console.log('🎯 Found line to edit:', line, 'lineId:', lineId);
      if (line) {
        // Start editing this line
        this.startEditingLine(lineId, line.text);
      }
    } else {
      console.log('🎯 Cannot edit - selectedLineIds length:', this.selectedLineIds.length);
    }
  }

  private startEditingLine(lineId: number, text: string): void {
    console.log('startEditingLine called with lineId:', lineId, 'text:', text);

    // Find the line
    const line = this.page.find(line => line.docPageLineIndex === lineId);
    if (!line) {
      console.log('Line not found for lineId:', lineId);
      return;
    }

    // Get the array index for undo recording
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === lineId);

    console.log('Setting editingLine to:', lineId, 'editingText to:', text);

    // Record undo state before editing
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit line text: "${text}"`
    );

    this.editingLine = lineId;
    this.editingText = text;

    console.log('About to force change detection, editingLine is now:', this.editingLine);

    // Force immediate UI update - just change detection, no pageUpdate emit for editing setup
    this.cdRef.detectChanges();

    // Focus the line element after the UI has updated
    setTimeout(() => {
      const lineElement = document.getElementById(lineId.toString());
      console.log('Looking for element with ID:', lineId.toString(), 'found:', lineElement);
      if (lineElement) {
        // Ensure contenteditable is set (backup to Angular binding)
        lineElement.setAttribute('contenteditable', 'true');
        console.log('Set contenteditable manually, now focusing element');
        lineElement.focus();
        console.log('Focused element, contenteditable:', lineElement.getAttribute('contenteditable'));

        // Place cursor at the end of the text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(lineElement);
        range.collapse(false); // false means collapse to end
        sel?.removeAllRanges();
        sel?.addRange(range);
        console.log('Set cursor position');
      } else {
        console.log('Element not found with ID:', lineId.toString());
      }
    }, 100); // Increased timeout
  }

  changeLineCategory(event: Event, category: string, xPos: string, line: any, lineIndex: number): void {
    event.stopPropagation();
    this.showContextMenu = false;
    
    // Get all selected lines
    const selectedLines = this.selectedLineIds.map(lineId => {
      const line = this.page.find(l => l.docPageLineIndex === lineId);
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === lineId);
      return { line, lineIndex };
    });

    // Record undo state for all selected lines as one batch operation
    const batchChanges = selectedLines.map(({ line, lineIndex }) => ({
      pageIndex: this.currentPageIndex,
      lineIndex,
      currentLineState: line,
      changeDescription: `Change category: ${line.category} → ${category} (batch operation)`
    }));
    this.undoService.recordBatchChanges(batchChanges);
    
    // Update all selected lines
    selectedLines.forEach(({ line, lineIndex }) => {
      // Update the line's category
      line.category = category;
      
      // Update xPos if provided and not hiding
      if (xPos && category !== 'hidden') {
        line.calculatedXpos = xPos;
      }

      // For scene headers, ensure we update the scene number text
      if (category === 'scene-header') {
        line.sceneNumberText = line.sceneNumberText || '';
      }

      // For END/CONTINUE lines, ensure proper text formatting
      if (category === 'end') {
        line.customEndText = line.customEndText || `END ${line.sceneNumberText || ''}`;
      } else if (category === 'continue' || category === 'continue-top') {
        line.customContinueText = line.customContinueText || `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`;
      }

      // Update the line in the PDF service with all changes
      this.pdfService.updateLine(
        this.currentPageIndex,
        lineIndex,
        { 
          ...line,
          category,
          calculatedXpos: xPos && category !== 'hidden' ? xPos : line.calculatedXpos,
          sceneNumberText: category === 'scene-header' ? (line.sceneNumberText || '') : line.sceneNumberText,
          customEndText: category === 'end' ? (line.customEndText || `END ${line.sceneNumberText || ''}`) : line.customEndText,
          customContinueText: (category === 'continue' || category === 'continue-top') ? 
            (line.customContinueText || `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`) : line.customContinueText
        }
      );
      
      this.categoryChanged.emit({
        line,
        lineIndex,
        category
      });
    });
    
    this.pageUpdate.emit([...this.page]);
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    console.log('🖱️ Right-click detected on document');
    // Check if click is on a line element
    const clickedLine = (event.target as HTMLElement).closest('li');
    console.log('🖱️ Clicked element:', clickedLine, 'id:', clickedLine?.id);
    if (!clickedLine) {
      console.log('🖱️ Not clicked on a line, hiding context menu');
      this.showContextMenu = false;
      return;
    }

    // Get the line ID from the clicked element
    const lineId = parseInt(clickedLine.id);
    const line = this.page.find(l => l.docPageLineIndex === lineId);
    console.log('🖱️ Found line for context menu:', line, 'lineId:', lineId);

    if (line) {
      this.openContextMenu(event, line, lineId);
    } else {
      console.log('🖱️ No line found for lineId:', lineId);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if click is outside of any line elements and context menu
    const clickedLine = (event.target as HTMLElement).closest('li');
    const clickedContextMenu = (event.target as HTMLElement).closest('.context-menu');
    
    if (!clickedLine && !clickedContextMenu) {
      this.clearSelection();
      this.showContextMenu = false;
    }
  }

  // ============= TEXT EDITING METHODS =============

  onDoubleClick(event: MouseEvent, lineId: number, text: string): void {
    if (!this.canEditDocument) return;

    // Prevent default behavior and stop propagation to avoid interference
    event.preventDefault();
    event.stopPropagation();

    // Find the line using docPageLineIndex
    const line = this.page.find(line => line.docPageLineIndex === lineId);
    if (!line) return;

    // Auto-select the line if it's not already selected
    if (!this.isLineSelected(line)) {
      // Create a mock mouse event for single selection
      const mockEvent = { shiftKey: false, ctrlKey: false, metaKey: false } as MouseEvent;
      this.selectLine(line, mockEvent);
    }

    // Use the same logic as the context menu
    this.startEditingLine(lineId, text);
  }

  onEditTextChange(newText: string): void {
    if (this.editingLine !== null) {
      this.editingText = newText;
    }
  }

  handleEditKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingLine = null;
    this.editingText = '';
    this.cdRef.detectChanges();
  }

  saveEdit(): void {
    if (this.editingLine !== null) {
      const line = this.page.find(line => line.docPageLineIndex === this.editingLine);
      if (!line) return;

      // Get the array index for undo recording
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === this.editingLine);

      // Record undo state
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        line,
        `Edit line text: "${line.text}" → "${this.editingText}"`
      );

      if (line.category === 'scene-header') {
        // Use updateSceneHeaderText for scene headers
        this.pdfService.updateSceneHeaderText(line, this.editingText).subscribe(
          ({ success }) => {
            if (success) {
              // Clean up editing state
              this.editingLine = null;
              this.editingText = '';
              this.cdRef.detectChanges();
            }
          }
        );
      } else {
        // Use updateLine for other lines
        this.pdfService.updateLine(this.currentPageIndex, lineIndex, {
          ...line,
          text: this.editingText
        });

        // Clean up editing state
        this.editingLine = null;
        this.editingText = '';

        // Don't emit pageUpdate here - the PDF service update will trigger the parent component update
        // this.pageUpdate.emit([...this.page]);
      }
    }
  }
  handleCallsheetImageError(event: any): void {
    console.error('Error loading callsheet image:', event);
    
    const img = event.target as HTMLImageElement;
    const src = img.src;
    
    let errorMessage = 'Failed to load callsheet image';
    
    // Determine specific error type
    if (!src || src.trim() === '') {
      errorMessage = 'No image path provided';
    } else if (src.includes('blob:')) {
      errorMessage = 'Blob URL expired or invalid';
    } else if (src.startsWith('data:')) {
      errorMessage = 'Invalid image data';
    } else if (src.includes('404') || event.type === 'error') {
      errorMessage = 'Image not found on server';
    } else if (src.includes('CORS')) {
      errorMessage = 'CORS error - image blocked by server';
    }
    
    // Update the page state with error information
    if (this.page && this.page[0]) {
      this.page[0].loadError = errorMessage;
      console.error('Callsheet load error details:', {
        src: src,
        error: errorMessage,
        event: event
      });
    }
    
    this.cdRef.detectChanges();
  }
  
  onCallsheetImageLoad(event: any): void {
    console.log('Callsheet image loaded successfully:', event.target?.src);
    
    // Clear any previous error state
    if (this.page && this.page[0]) {
      this.page[0].loadError = null;
    }
    
    this.cdRef.detectChanges();
  }
  
  retryCallsheetLoad(): void {
    console.log('Retrying callsheet load');
    
    if (this.page && this.page[0]) {
      // Clear the error state
      this.page[0].loadError = null;
      
      // Get the original path and add cache busting
      const originalPath = this.page[0].imagePath;
      if (originalPath) {
        // Add cache-busting parameter
        const separator = originalPath.includes('?') ? '&' : '?';
        this.page[0].imagePath = originalPath + separator + 'cb=' + Date.now();
        
        console.log('Retrying with cache-busted path:', this.page[0].imagePath);
      }
    }
    
    this.cdRef.detectChanges();
  }
  
  // Enhanced callsheet page detection
  isCallsheetPage(page: any[]): boolean {
    if (!page || !Array.isArray(page) || page.length === 0) {
      return false;
    }
    
    const firstLine = page[0];
    return firstLine && 
           (firstLine.type === 'callsheet' || firstLine.category === 'callsheet') &&
           firstLine.imagePath;
  }
  
  // ============= KEYBOARD HANDLERS =============

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
  
    if (!this.canEditDocument) return;

    const target = event.target as HTMLElement | null;
    const fromEditable = !!target && (
      target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    );

    if (!fromEditable && (event.key === 'Delete' || event.key === 'Backspace') && this.selectedXboxIndex !== null) {
      this.deleteXbox(this.selectedXboxIndex, event);
      return;
    }

    // Handle Ctrl+Z for undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.performUndo();
      return;
    }
    
    // Handle Ctrl+Y or Ctrl+Shift+Z for redo
    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      event.stopPropagation();
      this.performRedo();
      return;
    }
    
    // Handle X key to toggle visibility of selected line(s)
    if ((event.key === 'x' || event.key === 'X') && this.selectedLineIds.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      
      // Get all selected lines
      const selectedLines = this.selectedLineIds.map(lineId => {
        const lineIndex = this.page.findIndex(line => line.docPageLineIndex === lineId);
        return lineIndex !== -1 ? { line: this.page[lineIndex], lineIndex } : null;
      }).filter(item => item !== null);
      
      if (selectedLines.length === 0) return;
      
      // Record undo for all lines as one batch operation
      const batchChanges = selectedLines.map(({ line, lineIndex }) => ({
        pageIndex: this.currentPageIndex,
        lineIndex,
        currentLineState: line,
        changeDescription: `Toggle visibility: ${line.visible} (batch operation)`
      }));
      this.undoService.recordBatchChanges(batchChanges);
      
      // Get the visibility state of the first selected line
      const firstLine = selectedLines[0];
      const referenceVisibility = firstLine.line.visible;
      
      // Check if ALL selected lines have the same visibility as the first line
      const allSameVisibility = selectedLines.every(item => 
        item.line.visible === referenceVisibility
      );
      
      if (allSameVisibility) {
        // All lines have same visibility, so toggle ALL
        const newVisibility = referenceVisibility === 'true' ? 'false' : 'true';
        
        selectedLines.forEach(({ line, lineIndex }) => {
          // Update the line in the PDF service
          this.pdfService.updateLine(
            this.currentPageIndex,
            line.docPageLineIndex,
            { ...line, visible: newVisibility }
          );
        });
      } else {
        // Mixed visibility, make ALL match the first line
        selectedLines.forEach(({ line, lineIndex }) => {
          if (line.visible !== referenceVisibility) {
            // Update the line in the PDF service
            this.pdfService.updateLine(
              this.currentPageIndex,
              line.docPageLineIndex,
              { ...line, visible: referenceVisibility }
            );
          }
        });
      }
      
      this.cdRef.detectChanges();
    }
  }
  
  // ============= UNDO/REDO METHODS =============
  
  performUndo(): void {
    console.log('[UNDO] Starting undo operation');
    this.isUndoInProgress = true;
    this.undoService.undo();
    // Reset flag after a short delay to allow updates to complete
    setTimeout(() => {
      this.isUndoInProgress = false;
      console.log('[UNDO] Undo operation completed');
    }, 100);
  }

  performRedo(): void {
    console.log('[UNDO] Starting redo operation');
    this.isUndoInProgress = true;
    this.undoService.redo();
    // Reset flag after a short delay to allow updates to complete
    setTimeout(() => {
      this.isUndoInProgress = false;
      console.log('[UNDO] Redo operation completed');
    }, 100);
  }
  
  handleKeyDown(event: KeyboardEvent, line: Line, lineIndex: number): void {
    if (this.editingLine === lineIndex) {

      this.handleEditKeyDown(event);
      return;
    }
    if (event.key === 'x' || event.key === 'X') {
      event.preventDefault();
      event.stopPropagation();
      
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        line,
        `Toggle visibility: ${line.visible}`
      );
      
      // Use the service to update visibility
      this.pdfService.updateLine(
        this.currentPageIndex,
        line.docPageLineIndex,
        { ...line, visible: line.visible === 'true' ? 'false' : 'true' }
      );
    }
  }

  // ============= SCENE NUMBER EDITING METHODS =============

  startEditingSceneNumber(line: any): void {
    if (!this.canEditDocument) return;
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    // Record undo state before editing scene number
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit scene number: ${line.sceneNumberText}`
    );
    
    this.editingSceneNumber = line.sceneNumberText;
    this.originalSceneNumber = line.sceneNumberText;
    
    setTimeout(() => {
      const selection = window.getSelection();
      const range = document.createRange();
      
      const elements = document.querySelectorAll('.scene-number-left, .scene-number-right');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.textContent?.trim() === this.editingSceneNumber) {
          range.selectNodeContents(el);
          selection?.removeAllRanges();
          selection?.addRange(range);
          break;
        }
      }
    }, 10);
  }

  handleSceneNumberKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneNumberEdit();
    }
  }

  cancelSceneNumberEdit(): void {
    const elements = document.querySelectorAll('.scene-number-left, .scene-number-right');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (el.textContent?.trim() === this.editingSceneNumber) {
        el.textContent = this.originalSceneNumber;
      }
    }
    
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
  }

  saveSceneNumberEdit(line: Line, event: FocusEvent): void {
    if (!this.canEditDocument) return;
    
    const newSceneNumber = (event.target as HTMLElement).textContent?.trim();
    
    if (newSceneNumber && newSceneNumber !== line.sceneNumberText) {
      // Record undo state before changing scene number
      this.undoService.recordLineChange(
        this.currentPageIndex,
        line.docPageLineIndex,
        line,
        `Edit scene number: ${line.sceneNumberText} → ${newSceneNumber}`
      );

      // Use updateSceneNumber from the PDF service
      this.pdfService.updateSceneNumber(line, newSceneNumber, this.currentPageIndex).subscribe(
        ({ success }) => {
          if (success) {
            // Find the start and end of the scene
            const sceneStartIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
            let sceneEndIndex = sceneStartIndex;
            
            // Find the next scene header or end of page
            for (let i = sceneStartIndex + 1; i < this.page.length; i++) {
              if (this.page[i].category === 'scene-header') {
                break;
              }
              sceneEndIndex = i;
            }

            // Get all lines in this scene
            const sceneLines = this.page.slice(sceneStartIndex, sceneEndIndex + 1);

            // Update all lines in the scene in our local state
            sceneLines.forEach(l => {
              const lineIndex = this.page.findIndex(pageLine => pageLine.docPageLineIndex === l.docPageLineIndex);
              if (lineIndex !== -1) {
                this.page[lineIndex] = {
                  ...this.page[lineIndex],
                  sceneNumber: newSceneNumber,
                  sceneNumberText: newSceneNumber,
                  // Update text for specific line types
                  text: l.category === 'scene-header' ? l.text :
                        l.category === 'end' ? `END ${newSceneNumber}` :
                        (l.category === 'continue' || l.category === 'continue-top') ? 
                        `↓↓↓ ${newSceneNumber} CONTINUED ↓↓↓` : l.text
                };
              }
            });

            // Emit the page update to ensure Dashboard Right gets the change
            this.pageUpdate.emit([...this.page]);
          }
        }
      );
    }
    
    this.editingSceneNumber = null;
    this.cdRef.detectChanges();
  }

  // ============= SCENE TEXT EDITING METHODS =============

  startEditingSceneText(line: any): void {
    if (!this.canEditDocument) return;
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    // Record undo state before editing scene text
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit scene text: "${line.text}"`
    );
    
    this.editingSceneText = line.text;
    this.originalSceneText = line.text;
    
    setTimeout(() => {
      const selection = window.getSelection();
      const range = document.createRange();
      
      const elements = document.querySelectorAll('.scene-text');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.textContent?.trim() === this.editingSceneText) {
          range.selectNodeContents(el);
          selection?.removeAllRanges();
          selection?.addRange(range);
          break;
        }
      }
    }, 10);
  }

  handleSceneTextKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneTextEdit();
    }
  }

  cancelSceneTextEdit(): void {
    const elements = document.querySelectorAll('.scene-text');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (el.textContent?.trim() === this.editingSceneText) {
        el.textContent = this.originalSceneText;
      }
    }
    
    this.editingSceneText = null;
    this.originalSceneText = null;
  }

  saveSceneTextEdit(line: Line, event: FocusEvent): void {
    if (this.editingSceneText !== null && this.editingSceneText !== this.originalSceneText) {
      // Record undo state before changing scene text
      this.undoService.recordLineChange(
        this.currentPageIndex,
        line.docPageLineIndex,
        line,
        `Edit scene text: "${line.text}" → "${this.editingSceneText}"`
      );

      this.pdfService.updateSceneHeaderText(line, this.editingSceneText).subscribe(
        ({ success }) => {
          if (success) {
            // Update local state
            const updatedPage = this.page.map(l => {
              if (l.index === line.index) {
                return { ...l, text: this.editingSceneText };
              }
              return l;
            });
            this.page = updatedPage;
            
            // Emit the page update to parent
            this.pageUpdate.emit(updatedPage);
            
            // Reset editing state
            this.editingSceneText = null;
            this.originalSceneText = null;
            this.cdRef.detectChanges();
          }
        }
      );
    } else {
      this.cancelSceneTextEdit();
    }
  }

  // ============= UTILITY METHODS =============

  // Add resetPage method
  resetPage(newPage: Line[]): void {
    console.log('Resetting page with new data:', newPage.length);
    this.page = [...newPage];
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.selectedLine = null;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Undo/Redo utility getters
  get canUndo(): boolean {
    return this.undoService.canUndo;
  }

  get canRedo(): boolean {
    return this.undoService.canRedo;
  }

  getUndoInfo(): string {
    const lastUndo = this.undoService.peekLastUndo();
    return lastUndo ? lastUndo.changeDescription || 'Last change' : 'No changes to undo';
  }

  getRedoInfo(): string {
    const lastRedo = this.undoService.peekLastRedo();
    return lastRedo ? lastRedo.changeDescription || 'Last undone change' : 'No changes to redo';
  }
  getWatermarkBlocks(blockCount: number): number[] {
  
    if (!blockCount || blockCount <= 0) {
      return [];
    }
    return Array.from({ length: blockCount }, (_, i) => i);
  }
  
  /**
   * Check if current page has an active watermark
   */
  hasWatermark(page: any[]): boolean {
    return page && page[0] && page[0].watermarkData && page[0].watermarkData.isActive;
  }
  
  /**
   * Get watermark data for current page
   */
  getWatermarkData(page: any[]): any {
    return page && page[0] && page[0].watermarkData ? page[0].watermarkData : null;
  }
  
  getContinueBarPosition(line: Line): string {
    // If manually positioned, keep custom position
    if (line.calculatedBarY && line.calculatedBarY !== '90px' && parseInt(String(line.calculatedBarY)) !== 90) {
      return String(line.calculatedBarY);
    }
    
    // Find lowest Y position (closest to bottom) of visible text lines
    let lowestYPos = 0;
    for (const pageLine of this.page) {
      if (pageLine.docPageLineIndex !== line.docPageLineIndex && 
          pageLine.visible === 'true' && 
          pageLine.category !== 'page-number' && 
          pageLine.category !== 'injected-break' &&
          pageLine.category !== 'callsheet') {
        const yPos = parseInt(String(pageLine.calculatedYpos || pageLine.yPos || '0'));
        if (yPos > 0 && (yPos < lowestYPos || lowestYPos === 0)) {
          lowestYPos = yPos;
        }
      }
    }
    
    // Position CONTINUE bar 55px below last line
    if (lowestYPos > 0) {
      return Math.max(20, lowestYPos - 75) + 'px';
    }
    
    return '90px';
  }

  // ============= SKIPPED SECTION X-BOX METHODS =============

  /**
   * Compute bounding boxes for each contiguous block of skipped (false/hidden)
   * content lines on the current page, for rendering SVG X-box overlays.
   */
  getSkippedSections(): Array<{ top: number; bottom: number; left: number; right: number; lineIds: number[]; stableKey: string }> {
    const PAGE_HEIGHT = 1056;
    const CONTENT_LEFT = 88;
    const CONTENT_RIGHT = 739;
    const PAD_TOP = 16;
    const PAD_BOTTOM = 4;

    const EXCLUDED_CATEGORIES = new Set([
      'page-number',
      'page-number-hidden',
      'injected-break',
      'callsheet',
    ]);

    const sections: Array<{ top: number; bottom: number; left: number; right: number; lineIds: number[]; stableKey: string }> = [];

    let groupMaxYPos: number | null = null;
    let groupMinYPos: number | null = null;
    let groupLineIds: number[] = [];

    const flushGroup = () => {
      if (groupMaxYPos !== null && groupMinYPos !== null) {
        const svgTop = PAGE_HEIGHT - groupMaxYPos - PAD_TOP;
        const svgBottom = PAGE_HEIGHT - groupMinYPos + PAD_BOTTOM;

        if (groupLineIds.length > 0 && svgBottom > svgTop + 4) {
          sections.push({
            top: Math.max(0, svgTop),
            bottom: Math.min(PAGE_HEIGHT, svgBottom),
            left: CONTENT_LEFT,
            right: CONTENT_RIGHT,
            lineIds: [...groupLineIds],
            stableKey: this.getXboxStableKey(groupLineIds),
          });
        }
      }
      groupMaxYPos = null;
      groupMinYPos = null;
      groupLineIds = [];
    };

    for (const line of this.page) {
      if (EXCLUDED_CATEGORIES.has(line.category)) {
        continue;
      }
      if (line.hidden === 'hidden') {
        continue;
      }

      const isSkipped = line.visible === 'false' || (line.visible as any) === false;

      if (isSkipped) {
        const scaledBottom = line.calculatedYpos
          ? parseInt(String(line.calculatedYpos), 10)
          : (typeof line.yPos === 'number' ? Math.round(line.yPos * 1.3) : 0);
        const yPos = scaledBottom;

        if (yPos > 0) {
          if (groupMaxYPos === null || yPos > groupMaxYPos) groupMaxYPos = yPos;
          if (groupMinYPos === null || yPos < groupMinYPos) groupMinYPos = yPos;
          const lineId = this.getXboxLineId(line);
          if (lineId !== null) {
            groupLineIds.push(lineId);
          }
        }
      } else {
        flushGroup();
      }
    }

    flushGroup();
    return sections;
  }

  // ============= X-BOX EDITING METHODS (freestanding) =============

  /**
   * Create a freestanding X-box on the current page.
   * Independent of line selection / visibility — geometry-only annotation.
   */
  addXbox(): void {
    if (!this.canEditDocument || !this.pdfService.finalDocument) return;

    const previousXboxes = this.cloneXboxesSnapshot();
    const id = this.generateXboxId();
    const record = {
      id,
      pageIndex: this.currentPageIndex,
      top: 400,
      bottom: 600,
      left: 88,
      right: 739,
      isFreestanding: true,
      lineIds: [] as number[],
    };

    const doc = this.pdfService.finalDocument as any;
    if (!Array.isArray(doc.xboxes)) {
      doc.xboxes = [];
    }
    doc.xboxes = [...doc.xboxes, record];

    this.selectedXboxIndex = id;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();
    this.selectedLineIds = [];

    const lineChanges = this.recomputeXboxOwnedLineIds(id, 'Add X-box');
    this.undoService.recordXboxChange(previousXboxes, lineChanges, 'Add X-box');
    this.cdRef.detectChanges();
  }

  /**
   * All X visuals for the page: freestanding boxes + auto stubs over crossed-out lines.
   */
  getDisplayedSkippedSections(): Array<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    originalIndex: string;
    isFreestanding: boolean;
    lineIds: number[];
  }> {
    const freestanding = this.getFreestandingXboxesForPage().map((xbox: any) => ({
      top: xbox.top,
      bottom: xbox.bottom,
      left: xbox.left,
      right: xbox.right,
      originalIndex: xbox.id as string,
      isFreestanding: true,
      lineIds: [] as number[],
    }));

    // Auto stubs are visual-only (from line.visible === false). They do not own
    // interactive handles — freestanding boxes are the editable objects.
    const freestandingBounds = freestanding.map(s => ({ top: s.top, bottom: s.bottom }));
    const stubSections = this.getSkippedSections()
      .filter(section => {
        const mid = (section.top + section.bottom) / 2;
        return !freestandingBounds.some(b => mid >= b.top && mid <= b.bottom);
      })
      .map(section => ({
        top: section.top,
        bottom: section.bottom,
        left: section.left,
        right: section.right,
        originalIndex: section.stableKey,
        isFreestanding: false,
        lineIds: [...section.lineIds],
      }));

    return [...freestanding, ...stubSections];
  }

  /** Interactive overlay targets — freestanding boxes only. */
  getEditableXboxSections(): Array<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    originalIndex: string;
  }> {
    return this.getFreestandingXboxesForPage().map((xbox: any) => ({
      top: xbox.top,
      bottom: xbox.bottom,
      left: xbox.left,
      right: xbox.right,
      originalIndex: xbox.id as string,
    }));
  }

  selectXbox(originalIndex: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.getXboxById(originalIndex)) return;
    this.selectedXboxIndex = originalIndex;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();
    this.cdRef.detectChanges();
  }

  deselectXbox(): void {
    this.selectedXboxIndex = null;
    this.cdRef.detectChanges();
  }

  deleteXbox(originalIndex: string, event?: MouseEvent | KeyboardEvent): void {
    event?.stopPropagation();
    event?.preventDefault();

    const xbox = this.getXboxById(originalIndex);
    if (!xbox) return;

    const previousXboxes = this.cloneXboxesSnapshot();

    // Release the lines back to visible before the box goes away, otherwise they
    // would stay greyed with nothing covering them.
    const lineChanges = this.setXboxLinesVisibleInPage(
      (xbox.lineIds || []) as number[],
      true,
      'Delete X-box'
    );

    const doc = this.pdfService.finalDocument as any;
    doc.xboxes = (doc.xboxes || []).filter((x: any) => x.id !== originalIndex);

    if (this.selectedXboxIndex === originalIndex) {
      this.selectedXboxIndex = null;
    }

    this.undoService.recordXboxChange(previousXboxes, lineChanges, 'Delete X-box');
    this.cdRef.detectChanges();
  }

  startXboxDrag(originalIndex: string, event: MouseEvent): void {
    if (!this.canEditDocument) return;
    if ((event.target as HTMLElement).closest('.xbox-delete-btn') ||
        (event.target as HTMLElement).closest('.xbox-resize-handle')) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const xbox = this.getXboxById(originalIndex);
    if (!xbox) return;

    this.selectedXboxIndex = originalIndex;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();

    this.xboxUndoSnapshot = this.cloneXboxesSnapshot();
    this.xboxDragging = true;
    this.xboxDragStartX = event.clientX;
    this.xboxDragStartY = event.clientY;
    this.xboxDragInitialTop = xbox.top;
    this.xboxDragInitialLeft = xbox.left;
    this.xboxDragInitialWidth = xbox.right - xbox.left;
    this.xboxDragInitialHeight = xbox.bottom - xbox.top;

    document.addEventListener('mousemove', this.handleXboxDragMove);
    document.addEventListener('mouseup', this.handleXboxDragEnd);
  }

  handleXboxDragMove = (event: MouseEvent): void => {
    if (!this.xboxDragging || this.selectedXboxIndex === null) return;
    const xbox = this.getXboxById(this.selectedXboxIndex);
    if (!xbox) return;

    const scale = this.pageScale || 1;
    const deltaX = (event.clientX - this.xboxDragStartX) / scale;
    const deltaY = (event.clientY - this.xboxDragStartY) / scale;
    const newTop = this.clamp(
      this.xboxDragInitialTop + deltaY,
      0,
      this.xboxPageHeight - this.xboxDragInitialHeight
    );
    const newLeft = this.clamp(
      this.xboxDragInitialLeft + deltaX,
      0,
      this.xboxPageWidth - this.xboxDragInitialWidth
    );

    xbox.top = newTop;
    xbox.bottom = newTop + this.xboxDragInitialHeight;
    xbox.left = newLeft;
    xbox.right = newLeft + this.xboxDragInitialWidth;

    this.cdRef.detectChanges();
  };

  handleXboxDragEnd = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.handleXboxDragMove);
    document.removeEventListener('mouseup', this.handleXboxDragEnd);
    if (!this.xboxDragging || this.selectedXboxIndex === null) {
      this.xboxDragging = false;
      this.xboxUndoSnapshot = [];
      return;
    }

    const lineChanges = this.recomputeXboxOwnedLineIds(this.selectedXboxIndex, 'Drag X-box');
    this.undoService.recordXboxChange(this.xboxUndoSnapshot, lineChanges, 'Drag X-box');

    this.xboxDragging = false;
    this.xboxUndoSnapshot = [];
    this.cdRef.detectChanges();
  };

  startXboxResize(originalIndex: string, edge: string, event: MouseEvent): void {
    if (!this.canEditDocument) return;
    event.stopPropagation();
    event.preventDefault();

    const xbox = this.getXboxById(originalIndex);
    if (!xbox) return;

    this.selectedXboxIndex = originalIndex;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();

    this.xboxUndoSnapshot = this.cloneXboxesSnapshot();
    this.xboxResizing = true;
    this.xboxResizeEdge = edge;
    this.xboxResizeStartX = event.clientX;
    this.xboxResizeStartY = event.clientY;
    this.xboxResizeInitial = { top: xbox.top, bottom: xbox.bottom, left: xbox.left, right: xbox.right };

    document.addEventListener('mousemove', this.handleXboxResizeMove);
    document.addEventListener('mouseup', this.handleXboxResizeEnd);
  }

  handleXboxResizeMove = (event: MouseEvent): void => {
    if (!this.xboxResizing || this.selectedXboxIndex === null || !this.xboxResizeInitial) return;
    const xbox = this.getXboxById(this.selectedXboxIndex);
    if (!xbox) return;

    const scale = this.pageScale || 1;
    const deltaX = (event.clientX - this.xboxResizeStartX) / scale;
    const deltaY = (event.clientY - this.xboxResizeStartY) / scale;
    const MIN_SIZE = 30;
    const init = this.xboxResizeInitial;

    switch (this.xboxResizeEdge) {
      case 'top-left':
        xbox.top = this.clamp(init.top + deltaY, 0, init.bottom - MIN_SIZE);
        xbox.left = this.clamp(init.left + deltaX, 0, init.right - MIN_SIZE);
        xbox.bottom = init.bottom;
        xbox.right = init.right;
        break;
      case 'top-right':
        xbox.top = this.clamp(init.top + deltaY, 0, init.bottom - MIN_SIZE);
        xbox.right = this.clamp(init.right + deltaX, init.left + MIN_SIZE, this.xboxPageWidth);
        xbox.bottom = init.bottom;
        xbox.left = init.left;
        break;
      case 'bottom-left':
        xbox.bottom = this.clamp(init.bottom + deltaY, init.top + MIN_SIZE, this.xboxPageHeight);
        xbox.left = this.clamp(init.left + deltaX, 0, init.right - MIN_SIZE);
        xbox.top = init.top;
        xbox.right = init.right;
        break;
      case 'bottom-right':
        xbox.bottom = this.clamp(init.bottom + deltaY, init.top + MIN_SIZE, this.xboxPageHeight);
        xbox.right = this.clamp(init.right + deltaX, init.left + MIN_SIZE, this.xboxPageWidth);
        xbox.top = init.top;
        xbox.left = init.left;
        break;
    }

    this.cdRef.detectChanges();
  };

  handleXboxResizeEnd = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.handleXboxResizeMove);
    document.removeEventListener('mouseup', this.handleXboxResizeEnd);
    if (!this.xboxResizing || this.selectedXboxIndex === null) {
      this.xboxResizing = false;
      this.xboxResizeEdge = null;
      this.xboxResizeInitial = null;
      this.xboxUndoSnapshot = [];
      return;
    }

    const lineChanges = this.recomputeXboxOwnedLineIds(this.selectedXboxIndex, 'Resize X-box');
    this.undoService.recordXboxChange(this.xboxUndoSnapshot, lineChanges, 'Resize X-box');

    this.xboxResizing = false;
    this.xboxResizeEdge = null;
    this.xboxResizeInitial = null;
    this.xboxUndoSnapshot = [];
    this.cdRef.detectChanges();
  };

  // ============= X-BOX HELPERS =============

  private generateXboxId(): string {
    return `xbox-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getSavedXboxesForPage(): any[] {
    if (!this.pdfService.finalDocument) return [];
    const all = (this.pdfService.finalDocument as any).xboxes;
    if (!Array.isArray(all)) {
      (this.pdfService.finalDocument as any).xboxes = [];
      return [];
    }
    return all.filter((xbox: any) => xbox && xbox.pageIndex === this.currentPageIndex);
  }

  private getFreestandingXboxesForPage(): any[] {
    return this.getSavedXboxesForPage().filter((xbox: any) => !!xbox.isFreestanding);
  }

  private setSavedXboxesForPage(xboxes: any[]): void {
    if (!this.pdfService.finalDocument) return;
    const all = Array.isArray((this.pdfService.finalDocument as any).xboxes)
      ? (this.pdfService.finalDocument as any).xboxes
      : [];
    const otherPages = all.filter((xbox: any) => xbox && xbox.pageIndex !== this.currentPageIndex);
    (this.pdfService.finalDocument as any).xboxes = [...otherPages, ...xboxes];
  }

  private getXboxById(id: string): any | null {
    if (!this.pdfService.finalDocument || !id) return null;
    const all = (this.pdfService.finalDocument as any).xboxes || [];
    return all.find((xbox: any) => xbox && xbox.id === id) || null;
  }

  private cloneXboxesSnapshot(): any[] {
    const all = (this.pdfService.finalDocument as any)?.xboxes || [];
    return cloneDeep(all);
  }

  private ensureXboxIsSaved(originalIndex: string): string | null {
    if (!originalIndex) return null;
    if (this.getXboxById(originalIndex)) return originalIndex;

    const stub = this.getSkippedSections().find(s => s.stableKey === originalIndex);
    if (!stub) return null;

    const existingForSameLines = this.getSavedXboxesForPage().find((xbox: any) =>
      this.getXboxStableKey(((xbox.lineIds || []) as number[])) === stub.stableKey
    );
    if (existingForSameLines) {
      return existingForSameLines.id;
    }

    const id = this.generateXboxId();
    const record = {
      id,
      pageIndex: this.currentPageIndex,
      lineIds: [...stub.lineIds],
      top: stub.top,
      bottom: stub.bottom,
      left: stub.left,
      right: stub.right,
    };
    this.setSavedXboxesForPage([...this.getSavedXboxesForPage(), record]);
    return id;
  }

  private recomputeXboxOwnedLineIds(id: string, changeDescription: string): any[] {
    const xbox = this.getXboxById(id);
    if (!xbox) return [];

    const otherSavedLineIds = new Set<number>(
      this.getSavedXboxesForPage()
        .filter((other: any) => other.id !== id)
        .flatMap((other: any) => (other.lineIds || []) as number[])
    );

    const previouslyOwned = new Set<number>((xbox.lineIds || []) as number[]);
    const currentlyInside = this.getLineIdsInXboxBounds(xbox)
      .filter(lineId => previouslyOwned.has(lineId) || !otherSavedLineIds.has(lineId));
    const nextSet = new Set<number>(currentlyInside);

    const toShow: number[] = [];
    previouslyOwned.forEach(lineId => { if (!nextSet.has(lineId)) toShow.push(lineId); });
    const toHide: number[] = [];
    nextSet.forEach(lineId => { if (!previouslyOwned.has(lineId)) toHide.push(lineId); });

    const lineChanges: any[] = [];
    if (toShow.length > 0) {
      lineChanges.push(...this.setXboxLinesVisibleInPage(toShow, true, changeDescription));
    }
    if (toHide.length > 0) {
      lineChanges.push(...this.setXboxLinesVisibleInPage(toHide, false, changeDescription));
    }

    xbox.lineIds = currentlyInside;
    return lineChanges;
  }

  private computeXboxGeometryForLineIds(lineIds: number[]): { top: number; bottom: number; left: number; right: number } | null {
    if (lineIds.length === 0) return null;
    const PAGE_HEIGHT = this.xboxPageHeight;
    const CONTENT_LEFT = 88;
    const CONTENT_RIGHT = 739;
    const PAD_TOP = 16;
    const PAD_BOTTOM = 4;

    const idSet = new Set(lineIds);
    let groupMaxYPos: number | null = null;
    let groupMinYPos: number | null = null;

    for (const line of this.page) {
      const id = this.getXboxLineId(line);
      if (id === null || !idSet.has(id)) continue;
      const scaledBottom = line.calculatedYpos
        ? parseInt(String(line.calculatedYpos), 10)
        : (typeof line.yPos === 'number' ? Math.round(line.yPos * 1.3) : 0);
      if (scaledBottom <= 0) continue;
      if (groupMaxYPos === null || scaledBottom > groupMaxYPos) groupMaxYPos = scaledBottom;
      if (groupMinYPos === null || scaledBottom < groupMinYPos) groupMinYPos = scaledBottom;
    }
    if (groupMaxYPos === null || groupMinYPos === null) return null;

    const top = Math.max(0, PAGE_HEIGHT - groupMaxYPos - PAD_TOP);
    const bottom = Math.min(PAGE_HEIGHT, PAGE_HEIGHT - groupMinYPos + PAD_BOTTOM);
    if (bottom <= top + 4) return null;

    return { top, bottom, left: CONTENT_LEFT, right: CONTENT_RIGHT };
  }

  private setXboxLinesVisibleInPage(
    lineIds: number[],
    isVisible: boolean,
    changeDescription: string
  ): { pageIndex: number; lineIndex: number; previousLineState: any; changeDescription: string }[] {
    const visible = isVisible ? 'true' : 'false';
    const lineChanges: { pageIndex: number; lineIndex: number; previousLineState: any; changeDescription: string }[] = [];

    lineIds.forEach(lineId => {
      const lineIndex = this.page.findIndex(line => this.getXboxLineId(line) === lineId);
      if (lineIndex === -1) return;
      const line = this.page[lineIndex];
      if (line.visible === visible) return;

      lineChanges.push({
        pageIndex: this.currentPageIndex,
        lineIndex,
        previousLineState: cloneDeep(line),
        changeDescription,
      });
      line.visible = visible;
      this.pdfService.updateLine(this.currentPageIndex, lineIndex, { visible }, true);
    });

    if (lineChanges.length > 0) {
      this.pageUpdate.emit([...this.page]);
    }
    return lineChanges;
  }

  private getXboxStableKey(lineIds: number[]): string {
    return [...lineIds].sort((a, b) => a - b).join('|');
  }

  private getLineIdsInXboxBounds(section: { top: number; bottom: number; left: number; right: number }): number[] {
    return this.page
      .filter(line => this.isXboxContentLine(line))
      .filter(line => {
        const y = this.getLineSvgY(line);
        return y >= section.top && y <= section.bottom;
      })
      .map(line => this.getXboxLineId(line))
      .filter((lineId): lineId is number => lineId !== null);
  }

  private isXboxContentLine(line: any): boolean {
    return !!line &&
      this.getXboxLineId(line) !== null &&
      line.hidden !== 'hidden' &&
      !['page-number', 'page-number-hidden', 'injected-break', 'callsheet'].includes(line.category);
  }

  private getXboxLineId(line: any): number | null {
    if (!line) {
      return null;
    }

    return typeof line.docPageLineIndex === 'number'
      ? line.docPageLineIndex
      : (typeof line.index === 'number' ? line.index : null);
  }

  private getLineSvgY(line: any): number {
    const bottom = line.calculatedYpos
      ? parseInt(String(line.calculatedYpos), 10)
      : (typeof line.yPos === 'number' ? Math.round(line.yPos * 1.3) : 0);
    return this.xboxPageHeight - bottom;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  // ============= EDITING TOOLBAR METHODS =============

  toggleTouchSelectMode(): void {
    this.touchSelectMode = !this.touchSelectMode;
    if (!this.touchSelectMode) {
      this.clearSelection();
    }
    this.cdRef.detectChanges();
  }

  isVisibilityToggled(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.visible === 'false');
  }

  getVisibilityTooltip(): string {
    if (this.selectedLineIds.length === 0) return 'Toggle Visibility';
    return this.isVisibilityToggled() ? 'Show Lines' : 'Hide Lines';
  }

  toggleSelectedVisibility(): void {
    if (this.selectedLineIds.length === 0) return;

    const selectedLines = this.selectedLineIds.map(lineId => {
      const line = this.page.find(l => l.docPageLineIndex === lineId);
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === lineId);
      return { line, lineIndex };
    }).filter(item => item.line);

    if (selectedLines.length === 0) return;

    const firstLine = selectedLines[0].line;
    const newVisibility = firstLine.visible === 'true' ? 'false' : 'true';

    const batchChanges = selectedLines.map(({ line, lineIndex }) => ({
      pageIndex: this.currentPageIndex,
      lineIndex,
      currentLineState: { ...line },
      changeDescription: `Toggle visibility: ${line.visible} → ${newVisibility}`
    }));
    this.undoService.recordBatchChanges(batchChanges);

    selectedLines.forEach(({ line }) => {
      this.pdfService.updateLine(
        this.currentPageIndex,
        line.docPageLineIndex,
        { ...line, visible: newVisibility }
      );
    });

    this.cdRef.detectChanges();
  }

  hasStartBar(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    return this.page
      .filter(line => this.selectedLineIds.includes(line.docPageLineIndex))
      .some(line => line.bar === 'bar');
  }

  toggleStartBarForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (!firstLine) return;

    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);
    this.undoService.recordLineChange(this.currentPageIndex, lineIndex, firstLine, 'Toggle start bar');

    if (firstLine.bar === 'bar') {
      firstLine.bar = 'hideBar';
      firstLine.calculatedBarY = undefined;
      firstLine.startTextOffset = undefined;
    } else {
      firstLine.bar = 'bar';
      if (!firstLine.calculatedBarY) {
        firstLine.calculatedBarY = (parseInt(firstLine.calculatedYpos as string) + 20) + 'px';
        firstLine.barY = parseInt(firstLine.calculatedBarY) / 1.3;
      }
      firstLine.startTextOffset = 10;
    }

    this.pdfService.updateLine(this.currentPageIndex, lineIndex, firstLine);
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  hasEndBar(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    return this.page
      .filter(line => this.selectedLineIds.includes(line.docPageLineIndex))
      .some(line => line.end === 'END');
  }

  toggleEndBarForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (!firstLine) return;

    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);
    this.undoService.recordLineChange(this.currentPageIndex, lineIndex, firstLine, 'Toggle end bar');

    if (firstLine.end === 'END') {
      firstLine.end = 'hideEnd';
      firstLine.calculatedEnd = undefined;
      firstLine.endTextOffset = undefined;
    } else {
      firstLine.end = 'END';
      if (!firstLine.calculatedEnd) {
        firstLine.calculatedEnd = (parseInt(firstLine.calculatedYpos as string) - 20) + 'px';
        firstLine.endY = parseInt(firstLine.calculatedEnd) / 1.3;
      }
      firstLine.endTextOffset = 10;
    }

    this.pdfService.updateLine(this.currentPageIndex, lineIndex, firstLine);
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  hasContinueTop(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    return this.page
      .filter(line => this.selectedLineIds.includes(line.docPageLineIndex))
      .some(line => line.cont === 'CONTINUE-TOP');
  }

  toggleContinueTopForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (!firstLine) return;

    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);
    this.undoService.recordLineChange(this.currentPageIndex, lineIndex, firstLine, 'Toggle continue top bar');

    if (firstLine.cont === 'CONTINUE-TOP') {
      firstLine.cont = 'hideCont';
      firstLine.calculatedBarY = undefined;
      firstLine.continueTopTextOffset = undefined;
    } else {
      firstLine.cont = 'CONTINUE-TOP';
      if (!firstLine.calculatedBarY) {
        firstLine.calculatedBarY = '40px';
        firstLine.barY = 40;
      }
      if (!firstLine.continueTopTextOffset) {
        firstLine.continueTopTextOffset = 10;
      }
    }

    this.pdfService.updateLine(this.currentPageIndex, lineIndex, firstLine);
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  hasContinue(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    return this.page
      .filter(line => this.selectedLineIds.includes(line.docPageLineIndex))
      .some(line => line.cont === 'CONTINUE');
  }

  toggleContinueForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (!firstLine) return;

    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);
    this.undoService.recordLineChange(this.currentPageIndex, lineIndex, firstLine, 'Toggle continue bar');

    if (firstLine.cont === 'CONTINUE') {
      firstLine.cont = 'hideCont';
      firstLine.calculatedBarY = undefined;
      firstLine.continueTextOffset = undefined;
    } else {
      firstLine.cont = 'CONTINUE';
      if (!firstLine.calculatedBarY) {
        firstLine.calculatedBarY = '90px';
        firstLine.barY = 90;
      }
      if (!firstLine.continueTextOffset) {
        firstLine.continueTextOffset = 10;
      }
    }

    this.pdfService.updateLine(this.currentPageIndex, lineIndex, firstLine);
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  combinePages(): void {
    const totalPages = this.pdfService.finalDocument?.data?.length || 0;
    if (totalPages === 0) {
      alert('No pages to condense.');
      return;
    }

    const confirmMsg = totalPages <= 8
      ? `Current document has ${totalPages} pages (within 8-page limit).\nCondensing will remove all crossed-out lines and repack pages.\n\nThis cannot be undone. Continue?`
      : `Current document has ${totalPages} pages (exceeds 8-page SAG-AFTRA limit).\nCondensing will remove all crossed-out lines and try to fit within 8 pages.\n\nThis cannot be undone. Continue?`;

    if (!confirm(confirmMsg)) return;

    this.undoService.recordDocumentReorderChange(
      cloneDeep(this.pdfService.finalDocument.data),
      'Combine/condense pages'
    );

    const result = this.pdfService.combinePages(8);
    if (!result.condensed) {
      alert('No hidden lines found to remove. Document is already condensed.');
      return;
    }

    const newPages = this.pdfService.finalDocument.data;
    const newCurrentPageIndex = Math.min(this.currentPageIndex, newPages.length - 1);
    this.currentPageIndex = newCurrentPageIndex;
    this.page = newPages[newCurrentPageIndex] || [];
    this.pageUpdate.emit([...this.page]);
    this.pageChange.emit(newCurrentPageIndex);
    this.pdfService.saveDocumentState();
    this.cdRef.detectChanges();

    const pageReduction = newPages.length <= 8
      ? `Now ${newPages.length} pages — within SAG-AFTRA limit!`
      : `Now ${newPages.length} pages — still exceeds 8-page limit. Consider removing more material.`;
    alert(`Condensed: removed ${result.removedLines} hidden lines.\n${pageReduction}`);
  }

  resetToInitialState(): void {
    if (!confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
      return;
    }

    this.undoService.reset();

    if (this.initialPageState && this.initialPageState.length > 0) {
      this.page = JSON.parse(JSON.stringify(this.initialPageState));
    }

    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.selectedLine = null;
    this.touchSelectMode = false;

    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  saveChanges(): void {
    if (this.pdfService.finalDocument?.data) {
      this.pdfService.finalDocument.data[this.currentPageIndex] = [...this.page];
      this.pdfService.saveDocumentState();
      this.pageUpdate.emit([...this.page]);
    }
    alert('Changes saved successfully!');
    this.cdRef.detectChanges();
  }
  
}
