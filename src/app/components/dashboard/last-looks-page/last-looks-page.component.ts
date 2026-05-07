import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { PdfService } from 'src/app/services/pdf/pdf.service';
import { AnnotationStateService } from 'src/app/services/annotation/annotation-state.service';
import { DEFAULT_TEXT_BOX_PRESETS } from 'src/app/types/Annotation';
import { cloneDeep } from 'lodash';


@Component({
  selector: 'app-last-looks-page',
  templateUrl: './last-looks-page.component.html',
  styleUrls: ['./last-looks-page.component.css'],
  standalone: false
})
export class LastLooksPageComponent implements OnInit, OnChanges, OnDestroy {
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
  changesMade: boolean = false;

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

  // Annotation mode properties
  private documentId: string | null = null;
  private initialAnnotations: any[] = []; // Store initial annotation state

  // Phase 1: Annotation toolbar state
  showPresetMenu: boolean = false;
  disclaimerActive: boolean = false;
  activeDrawingTool: string | null = null; // Tracks which drawing tool is active ('note', 'highlight', etc.)

  // Simple text box state (DOM-based, not canvas)
  editingTextBoxId: string | null = null; // Currently editing text box annotation ID
  /** Snapshot of text when edit mode starts — template binds this so CD does not clobber contenteditable. */
  editingTextBoxInitial: string = '';
  draggingTextBoxId: string | null = null; // Currently dragging text box annotation ID
  textBoxDragStartX: number = 0;
  textBoxDragStartY: number = 0;
  textBoxInitialNormX: number = 0;
  textBoxInitialNormY: number = 0;
  resizingTextBoxId: string | null = null;
  private textBoxResizeStartX = 0;
  private textBoxResizeStartY = 0;
  private textBoxInitialNormWidth = 0;
  private textBoxInitialNormHeight = 0;

  /** Highlight hit-area drag (DOM overlay; canvas draws the fill underneath). */
  draggingHighlightId: string | null = null;
  private highlightDragStartX = 0;
  private highlightDragStartY = 0;
  private highlightInitialNormX = 0;
  private highlightInitialNormY = 0;

  /** Arrow DOM overlay editing state. */
  draggingArrowId: string | null = null;
  private arrowDragStartX = 0;
  private arrowDragStartY = 0;
  private arrowInitialNormX = 0;
  private arrowInitialNormY = 0;
  private resizingArrowId: string | null = null;
  private arrowResizeEndpoint: 'start' | 'end' | null = null;
  private arrowResizeFixedPoint: { x: number; y: number } | null = null;
  private arrowResizePageRect: DOMRect | null = null;
  private rotatingArrowId: string | null = null;
  private arrowRotatePageRect: DOMRect | null = null;
  private arrowRotateStartAngle = 0;
  private arrowInitialRotationDegrees = 0;

  /** Undo snapshot captured at the start of any arrow mutation (drag/resize/rotate/delete). */
  private arrowUndoSnapshot: any[] = [];
  private isRestoringAnnotations = false;

  // Unified annotation selection (works for text boxes, arrows, shapes, highlights)
  selectedAnnotationId: string | null = null;
  private toolStateSubscription: Subscription | null = null;
  private annotationsSyncSubscription: Subscription | null = null;
  private xboxUndoRedoSubscription: Subscription | null = null;

  // ═══ X-BOX EDITING STATE ═══
  // Saved X-box records live on pdfService.finalDocument.xboxes (per-page list of
  // { id, pageIndex, top, bottom, left, right, lineIds }). Drag/resize mutate those
  // records directly so identity stays stable through every interaction.
  selectedXboxIndex: string | null = null;
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
  private readonly xboxPageWidth = 816;
  private readonly xboxPageHeight = 1056;

  @ViewChild('pdfViewer') pdfViewer: any;

  // Backend uploads files with makePublic() so the GCS URL is already publicly
  // accessible via IAM. Converting to Firebase format routes through Security Rules
  // which aren't deployed to the dev project. Return unchanged.
  public convertToFirebaseUrl(gcsUrl: string): string {
    return gcsUrl;
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
      if ((item as any)?.type === 'annotation-change') {
        this.syncAnnotationStateFromDocument();
        return;
      }

      if ((item as any)?.type === 'xbox-change') {
        const restoredPage = this.pdfService.finalDocument?.data?.[this.currentPageIndex];
        if (restoredPage) {
          this.page = [...restoredPage];
        }
        // If the previously selected X-box no longer exists after restore, clear selection.
        if (this.selectedXboxIndex !== null && !this.getXboxById(this.selectedXboxIndex)) {
          this.selectedXboxIndex = null;
        }
        this.pageUpdate.emit([...this.page]);
        this.cdRef.detectChanges();
      }
    });
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
  
    // Handle page index changes - save annotations when changing pages
    if (changes['currentPageIndex'] && !changes['currentPageIndex'].firstChange) {
      console.log('Page changed from', changes['currentPageIndex'].previousValue, 'to', changes['currentPageIndex'].currentValue);
      // Save current state to document when navigating pages
      if (this.canEditDocument) {
        this.saveAnnotationsToDocument();
      }
    }

    // Handle other changes as before...
    if (changes['editMode']) {
      const wasEditMode = changes['editMode'].previousValue;
      const isEditMode = changes['editMode'].currentValue;

      console.log('========================================');
      console.log('EDIT MODE CHANGED:', wasEditMode, '->', isEditMode);
      console.log('========================================');

      this.canEditDocument = isEditMode;

      // Initialize or clean up annotation system based on edit mode
      if (isEditMode) {
        console.log('📝 ENABLING EDIT MODE - Loading annotations...');
        this.initializeAnnotationSystem();
      } else {
        console.log('💾 DISABLING EDIT MODE - Performing full save...');

        // === FULL SAVE SEQUENCE (must happen in this order) ===

        // Step 1: Sync current page state to pdfService
        if (this.pdfService.finalDocument?.data && this.page) {
          console.log('Step 1: Syncing page', this.currentPageIndex, 'to pdfService (', this.page.length, 'lines)');
          this.pdfService.finalDocument.data[this.currentPageIndex] = [...this.page];
        }

        // Step 2: Save annotations to document
        this.saveAnnotationsToDocument();

        // Step 3: Create a persistent save point (deep copy)
        this.pdfService.saveDocumentState();

        // Log what we saved
        if (this.pdfService.finalDocument?.annotations) {
          console.log('✅ Saved', this.pdfService.finalDocument.annotations.length, 'annotations to document');
        }
        console.log('✅ Document state saved. Pages:', this.pdfService.finalDocument?.data?.length);

        // Step 4: Emit page update so parent re-syncs its local state
        this.pageUpdate.emit([...this.page]);

        // Step 5: Clear annotation state and selection
        this.selectedAnnotationId = null;
        this.toolStateSubscription?.unsubscribe();
        this.annotationsSyncSubscription?.unsubscribe();
        this.annotationState.clear();
      }
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
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.sceneHeaderTextUpdateSubscription) {
      this.sceneHeaderTextUpdateSubscription.unsubscribe();
    }
    this.xboxUndoRedoSubscription?.unsubscribe();
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
    document.removeEventListener('mousemove', this.resizeTextBox);
    document.removeEventListener('mouseup', this.endTextBoxResize);
    document.removeEventListener('mousemove', this.handleXboxDragMove);
    document.removeEventListener('mouseup', this.handleXboxDragEnd);
    document.removeEventListener('mousemove', this.handleXboxResizeMove);
    document.removeEventListener('mouseup', this.handleXboxResizeEnd);
    document.removeEventListener('mousemove', this.rotateArrow);
    document.removeEventListener('mouseup', this.endArrowRotate);
    document.removeEventListener('mousemove', this.moveArrow);
    document.removeEventListener('mouseup', this.endArrowDrag);
    document.removeEventListener('mousemove', this.resizeArrow);
    document.removeEventListener('mouseup', this.endArrowResize);

    // Clean up annotation system
    this.toolStateSubscription?.unsubscribe();
    this.annotationsSyncSubscription?.unsubscribe();
    if (this.canEditDocument) {
      this.annotationState.clear();
    }
  }

  // ─────────────────────────────────────────────
  // Annotation Mode Methods
  // ─────────────────────────────────────────────

  /**
   * Initialize the annotation system for the current document
   * This is called automatically when edit mode is enabled
   */
  private initializeAnnotationSystem(): void {
    // Use a stable document ID derived from finalDocument name, or generate once and reuse
    if (!this.documentId) {
      const docName = this.pdfService.finalDocument?.name || 'untitled';
      this.documentId = `doc-${docName.replace(/\s+/g, '-').toLowerCase()}`;
      console.log('Using stable document ID:', this.documentId);
    }

    try {
      // Initialize locally first — don't depend on backend API for basic functionality
      this.annotationState.initializeLocal(this.documentId);
      console.log('Annotation system initialized locally for document:', this.documentId);

      // Load annotations from saved document state
      this.loadAnnotationsFromDocument();

      // Store initial annotation state for reset
      if (this.pdfService.finalDocument?.annotations) {
        this.initialAnnotations = JSON.parse(JSON.stringify(this.pdfService.finalDocument.annotations));
      }

      // Subscribe to tool state to pick up canvas-based selections (arrows, shapes, highlights)
      this.toolStateSubscription?.unsubscribe();
      this.toolStateSubscription = this.annotationState.toolState$.subscribe(toolState => {
        if (toolState.selectedAnnotationIds.length > 0) {
          this.selectedAnnotationId = toolState.selectedAnnotationIds[0];
        }
      });

      // Subscribe to annotation changes so that DOM-based overlays (arrows, text boxes)
      // stay in sync with the canvas-based annotation state.
      // Debounced to avoid excessive syncs during drag/type operations.
      this.annotationsSyncSubscription?.unsubscribe();
      this.annotationsSyncSubscription = this.annotationState.annotations$
        .pipe(debounceTime(200))
        .subscribe(() => {
          if (this.isRestoringAnnotations) {
            return;
          }
          const previousAnnotations = this.cloneAnnotationsSnapshot();
          const nextAnnotations = Array.from(this.annotationState.annotations.values());
          if (this.hasNewArrowAnnotation(previousAnnotations, nextAnnotations)) {
            this.undoService.recordAnnotationChange(previousAnnotations, 'Add arrow');
          }
          this.saveAnnotationsToDocument();
          // Do NOT call cdRef.detectChanges() while the user is actively typing in a
          // text box.  detectChanges() causes Angular to re-evaluate the *ngFor that
          // renders annotation-textbox-overlay.  Because getAnnotationsForCurrentPage()
          // returns a new array reference on every call, Angular destroys and recreates
          // every DOM node in the list — including the live <span contenteditable> the
          // user is typing into — resetting its textContent to editingTextBoxInitial and
          // losing both the typed text and focus.  The contenteditable span is already
          // live in the DOM while editing, so no re-render is needed mid-keystroke.
          // finishTextBoxEdit() calls detectChanges() after the edit completes, which is
          // the only time we actually need to refresh the display span.
          if (!this.editingTextBoxId) {
            this.cdRef.detectChanges();
          }
        });
    } catch (error) {
      console.error('Error initializing annotation system:', error);
    }
  }

  /**
   * Load annotations from the saved document into the annotation system.
   * Preserves annotationIds so state and document stay in sync.
   */
  private loadAnnotationsFromDocument(): void {
    console.log('📂 loadAnnotationsFromDocument() called');

    // Check if we have saved annotations in the document
    const savedAnnotations = this.pdfService.finalDocument?.annotations;
    if (!savedAnnotations || savedAnnotations.length === 0) {
      console.log('⚠️ No saved annotations found in document');
      return;
    }

    console.log('✅ Loading', savedAnnotations.length, 'saved annotations from document');

    // Load each annotation into the local state, PRESERVING the original annotationId.
    // This is critical — the DOM text box template and the annotation preview both
    // reference annotations by annotationId from finalDocument.annotations.
    // If the state Map uses different IDs, updates via updateAnnotation() would fail.
    let loadedCount = 0;
    for (const annotation of savedAnnotations) {
      const annotationId = this.annotationState.addAnnotationLocally({
        annotationId: annotation.annotationId,   // Preserve the saved ID!
        type: annotation.type,
        pageIndex: annotation.pageIndex,
        normalizedX: annotation.normalizedX,
        normalizedY: annotation.normalizedY,
        normalizedWidth: annotation.normalizedWidth,
        normalizedHeight: annotation.normalizedHeight,
        text: annotation.text,
        style: annotation.style,
      });

      if (annotationId) {
        loadedCount++;
      }
    }

    console.log('✅ LOADED', loadedCount, '/', savedAnnotations.length, 'ANNOTATIONS');
  }

  // ─────────────────────────────────────────────
  // Phase 1: Annotation Toolbar Methods
  // ─────────────────────────────────────────────

  /**
   * Toggle a drawing tool on/off. When active, the user can draw annotations on the canvas.
   */
  toggleDrawingTool(tool: 'note' | 'highlight' | 'shape' | 'redaction'): void {
    if (this.activeDrawingTool === tool) {
      // Deactivate
      this.activeDrawingTool = null;
      this.annotationState.setActiveTool(null);
    } else {
      // Activate
      this.activeDrawingTool = tool;
      this.annotationState.setActiveTool(tool);
    }
  }

  clearActiveDrawingTool(): void {
    if (!this.activeDrawingTool && !this.annotationState.toolState.activeTool) {
      return;
    }
    this.activeDrawingTool = null;
    this.annotationState.setActiveTool(null);
  }

  // ============= SIMPLE TEXT BOX METHODS =============

  /**
   * Add a new text box to the current page at a default position.
   * The text box is a DOM element the user can type in and drag around.
   */
  async addTextBox(): Promise<void> {
    const annotationId = await this.annotationState.createAnnotation({
      type: 'textbox',
      pageIndex: this.currentPageIndex,
      normalizedX: 0.1,
      normalizedY: 0.1,
      normalizedWidth: 0.35,
      normalizedHeight: 0.04,
      text: '',
      style: {
        color: '#000000',
        opacity: 1.0,
        strokeWidth: 1,
        fontSize: 16,
        fontFamily: "'Courier Prime', monospace",
        fontWeight: '900',
      }
    });

    if (annotationId) {
      // Save to document and immediately enter editing on the new box
      this.saveAnnotationsToDocument();
      this.editingTextBoxInitial = '';
      this.editingTextBoxId = annotationId;
      this.cdRef.detectChanges();

      // Focus the new text box after render
      setTimeout(() => {
        const el = document.getElementById('textbox-' + annotationId);
        if (el) {
          el.focus();
        }
      }, 50);
    }
  }

  /**
   * Handle double-click on a text box to start editing.
   */
  onTextBoxDoubleClick(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument) return;
    event.stopPropagation();
    event.preventDefault();
    this.editingTextBoxInitial = annotation.text || '';
    this.editingTextBoxId = annotation.annotationId;
    this.cdRef.detectChanges();

    setTimeout(() => {
      const el = document.getElementById('textbox-' + annotation.annotationId);
      if (el) {
        el.focus();
        // Select all text for easy replacement
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }

  /**
   * Handle text input in a text box.
   */
  onTextBoxInput(event: Event, annotation: any): void {
    const target = event.target as HTMLElement;
    const newText = target.textContent || '';

    // Update the annotation text in the state service (use updateAnnotation, NOT addAnnotationLocally)
    this.annotationState.updateAnnotation(annotation.annotationId, {
      text: newText,
    });
  }

  /**
   * Handle keydown in text box (Enter to finish, Escape to cancel).
   */
  onTextBoxKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.finishTextBoxEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.editingTextBoxId = null;
      this.editingTextBoxInitial = '';
    }
  }

  /**
   * Finish editing a text box (on blur or Enter).
   *
   * Read the DOM directly before saving.  The annotationsSyncSubscription has a
   * 200 ms debounce, so the very last onTextBoxInput call may not have propagated
   * into annotationState yet when blur fires.  One final DOM read here guarantees
   * we capture that last character before saveAnnotationsToDocument() runs.
   */
  finishTextBoxEdit(): void {
    if (this.editingTextBoxId) {
      const el = document.getElementById('textbox-' + this.editingTextBoxId);
      if (el) {
        this.annotationState.updateAnnotation(this.editingTextBoxId, { text: el.textContent || '' });
      }
      this.saveAnnotationsToDocument();
      this.editingTextBoxId = null;
      this.editingTextBoxInitial = '';
      this.cdRef.detectChanges();
    }
  }

  /**
   * Start dragging a text box to reposition it.
   */
  startTextBoxDrag(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument) return;
    // Don't start drag if we're editing this text box
    if (this.editingTextBoxId === annotation.annotationId) return;
    if ((event.target as HTMLElement).closest('.textbox-delete-btn') ||
        (event.target as HTMLElement).closest('.textbox-resize-handle')) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    this.draggingTextBoxId = annotation.annotationId;
    this.textBoxDragStartX = event.clientX;
    this.textBoxDragStartY = event.clientY;
    this.textBoxInitialNormX = annotation.normalizedX;
    this.textBoxInitialNormY = annotation.normalizedY;

    document.addEventListener('mousemove', this.moveTextBox);
    document.addEventListener('mouseup', this.endTextBoxDrag);
  }

  /**
   * Handle mousemove during text box drag.
   */
  moveTextBox = (event: MouseEvent): void => {
    if (!this.draggingTextBoxId) return;

    const pageWidth = 816;
    const pageHeight = 1056;
    const annotation = this.getAnnotationsForCurrentPage().find(a => a.annotationId === this.draggingTextBoxId);
    const maxNormX = Math.max(0, 1 - (annotation?.normalizedWidth ?? 0));
    const maxNormY = Math.max(0, 1 - (annotation?.normalizedHeight ?? 0));

    const deltaX = event.clientX - this.textBoxDragStartX;
    const deltaY = event.clientY - this.textBoxDragStartY;

    const newNormX = this.clamp(this.textBoxInitialNormX + (deltaX / pageWidth), 0, maxNormX);
    const newNormY = this.clamp(this.textBoxInitialNormY + (deltaY / pageHeight), 0, maxNormY);

    // Update annotation position in the state service (source of truth during editing).
    // We also update finalDocument.annotations inline so the DOM text boxes re-render
    // at the new position without a full saveAnnotationsToDocument() on every frame.
    this.annotationState.updateAnnotation(this.draggingTextBoxId, {
      normalizedX: newNormX,
      normalizedY: newNormY,
    });

    // Fast inline sync: update the matching entry in finalDocument.annotations directly
    const docAnnotations = this.pdfService.finalDocument?.annotations;
    if (docAnnotations) {
      const docAnn = docAnnotations.find((a: any) => a.annotationId === this.draggingTextBoxId);
      if (docAnn) {
        docAnn.normalizedX = newNormX;
        docAnn.normalizedY = newNormY;
      }
    }
    this.cdRef.detectChanges();
  };

  /**
   * End text box drag.
   */
  endTextBoxDrag = (event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.moveTextBox);
    document.removeEventListener('mouseup', this.endTextBoxDrag);

    // Full sync from state → document now that drag is complete
    if (this.draggingTextBoxId) {
      this.saveAnnotationsToDocument();
    }
    this.draggingTextBoxId = null;
  };

  startTextBoxResize(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument || this.editingTextBoxId === annotation.annotationId) return;

    this.clearActiveDrawingTool();
    event.stopPropagation();
    event.preventDefault();

    this.resizingTextBoxId = annotation.annotationId;
    this.textBoxResizeStartX = event.clientX;
    this.textBoxResizeStartY = event.clientY;
    this.textBoxInitialNormWidth = annotation.normalizedWidth;
    this.textBoxInitialNormHeight = annotation.normalizedHeight;
    this.selectAnnotation(annotation.annotationId);

    document.addEventListener('mousemove', this.resizeTextBox);
    document.addEventListener('mouseup', this.endTextBoxResize);
  }

  resizeTextBox = (event: MouseEvent): void => {
    if (!this.resizingTextBoxId) return;

    const annotation = this.getAnnotationById(this.resizingTextBoxId);
    if (!annotation) return;

    const minWidth = 40 / this.xboxPageWidth;
    const minHeight = 24 / this.xboxPageHeight;
    const maxWidth = Math.max(minWidth, 1 - annotation.normalizedX);
    const maxHeight = Math.max(minHeight, 1 - annotation.normalizedY);
    const deltaX = (event.clientX - this.textBoxResizeStartX) / this.xboxPageWidth;
    const deltaY = (event.clientY - this.textBoxResizeStartY) / this.xboxPageHeight;

    const normalizedWidth = this.clamp(this.textBoxInitialNormWidth + deltaX, minWidth, maxWidth);
    const normalizedHeight = this.clamp(this.textBoxInitialNormHeight + deltaY, minHeight, maxHeight);

    this.annotationState.updateAnnotation(this.resizingTextBoxId, {
      normalizedWidth,
      normalizedHeight,
    });

    annotation.normalizedWidth = normalizedWidth;
    annotation.normalizedHeight = normalizedHeight;
    this.cdRef.detectChanges();
  };

  endTextBoxResize = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.resizeTextBox);
    document.removeEventListener('mouseup', this.endTextBoxResize);
    if (this.resizingTextBoxId) {
      this.saveAnnotationsToDocument();
    }
    this.resizingTextBoxId = null;
  };

  /**
   * Delete a text box annotation.
   */
  deleteTextBox(event: MouseEvent, annotation: any): void {
    event.stopPropagation();
    event.preventDefault();

    // Remove from annotation state locally (deleteAnnotation rolls back on API failure,
    // so we use removeAnnotationLocally for a guaranteed local-only delete)
    this.annotationState.removeAnnotationLocally(annotation.annotationId);
    this.saveAnnotationsToDocument();
    this.cdRef.detectChanges();
  }

  /**
   * Reposition a highlight by dragging the DOM hit-area (same math as text boxes).
   */
  startHighlightDrag(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument) return;

    event.stopPropagation();
    event.preventDefault();

    this.draggingHighlightId = annotation.annotationId;
    this.highlightDragStartX = event.clientX;
    this.highlightDragStartY = event.clientY;
    this.highlightInitialNormX = annotation.normalizedX;
    this.highlightInitialNormY = annotation.normalizedY;

    document.addEventListener('mousemove', this.moveHighlight);
    document.addEventListener('mouseup', this.endHighlightDrag);
  }

  private moveHighlight = (event: MouseEvent): void => {
    if (!this.draggingHighlightId) return;

    const pageWidth = 816;
    const pageHeight = 1056;
    const annotation = this.getAnnotationsForCurrentPage().find(a => a.annotationId === this.draggingHighlightId);
    const maxNormX = Math.max(0, 1 - (annotation?.normalizedWidth ?? 0));
    const maxNormY = Math.max(0, 1 - (annotation?.normalizedHeight ?? 0));
    const deltaX = event.clientX - this.highlightDragStartX;
    const deltaY = event.clientY - this.highlightDragStartY;
    const newNormX = this.clamp(this.highlightInitialNormX + deltaX / pageWidth, 0, maxNormX);
    const newNormY = this.clamp(this.highlightInitialNormY + deltaY / pageHeight, 0, maxNormY);

    this.annotationState.updateAnnotation(this.draggingHighlightId, {
      normalizedX: newNormX,
      normalizedY: newNormY,
    });

    const docAnnotations = this.pdfService.finalDocument?.annotations;
    if (docAnnotations) {
      const docAnn = docAnnotations.find((a: any) => a.annotationId === this.draggingHighlightId);
      if (docAnn) {
        docAnn.normalizedX = newNormX;
        docAnn.normalizedY = newNormY;
      }
    }
    this.cdRef.detectChanges();
  };

  private endHighlightDrag = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.moveHighlight);
    document.removeEventListener('mouseup', this.endHighlightDrag);

    if (this.draggingHighlightId) {
      this.saveAnnotationsToDocument();
    }
    this.draggingHighlightId = null;
  };

  deleteHighlight(event: MouseEvent, annotation: any): void {
    event.stopPropagation();
    event.preventDefault();
    this.annotationState.removeAnnotationLocally(annotation.annotationId);
    this.saveAnnotationsToDocument();
    this.cdRef.detectChanges();
  }

  isArrowAnnotation(annotation: any): boolean {
    return annotation?.type === 'note' ||
      (annotation?.type === 'shape' && annotation?.style?.shapeType === 'arrow');
  }

  startArrowDrag(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument || !this.isArrowAnnotation(annotation)) return;
    if ((event.target as HTMLElement).closest('.arrow-delete-btn') ||
        (event.target as HTMLElement).closest('.arrow-rotate-btn') ||
        (event.target as HTMLElement).closest('.arrow-resize-handle')) {
      return;
    }

    this.clearActiveDrawingTool();
    event.stopPropagation();
    event.preventDefault();

    this.draggingArrowId = annotation.annotationId;
    this.arrowUndoSnapshot = this.cloneAnnotationsSnapshot();
    this.arrowDragStartX = event.clientX;
    this.arrowDragStartY = event.clientY;
    this.arrowInitialNormX = annotation.normalizedX;
    this.arrowInitialNormY = annotation.normalizedY;
    this.selectAnnotation(annotation.annotationId);

    document.addEventListener('mousemove', this.moveArrow);
    document.addEventListener('mouseup', this.endArrowDrag);
  }

  moveArrow = (event: MouseEvent): void => {
    if (!this.draggingArrowId) return;
    const annotation = this.getAnnotationById(this.draggingArrowId);
    if (!annotation) return;

    const deltaX = event.clientX - this.arrowDragStartX;
    const deltaY = event.clientY - this.arrowDragStartY;
    const maxNormX = Math.max(0, 1 - annotation.normalizedWidth);
    const maxNormY = Math.max(0, 1 - annotation.normalizedHeight);

    this.updateArrowAnnotation(this.draggingArrowId, {
      normalizedX: this.clamp(this.arrowInitialNormX + deltaX / this.xboxPageWidth, 0, maxNormX),
      normalizedY: this.clamp(this.arrowInitialNormY + deltaY / this.xboxPageHeight, 0, maxNormY),
    });
  };

  endArrowDrag = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.moveArrow);
    document.removeEventListener('mouseup', this.endArrowDrag);
    if (this.draggingArrowId) {
      this.recordAnnotationUndoIfChanged(this.arrowUndoSnapshot, 'Move arrow');
      this.saveAnnotationsToDocument();
    }
    this.arrowUndoSnapshot = [];
    this.draggingArrowId = null;
  };

  startArrowResize(event: MouseEvent, annotation: any, endpoint: 'start' | 'end'): void {
    if (!this.canEditDocument || !this.isArrowAnnotation(annotation)) return;
    this.clearActiveDrawingTool();
    event.stopPropagation();
    event.preventDefault();

    const pageElement = (event.target as HTMLElement).closest('.page') as HTMLElement | null;
    this.arrowResizePageRect = pageElement?.getBoundingClientRect() ?? null;
    if (!this.arrowResizePageRect) return;

    const endpoints = this.getArrowEndpointPixels(annotation);
    this.resizingArrowId = annotation.annotationId;
    this.arrowUndoSnapshot = this.cloneAnnotationsSnapshot();
    this.arrowResizeEndpoint = endpoint;
    this.arrowResizeFixedPoint = endpoint === 'start' ? endpoints.end : endpoints.start;
    this.selectAnnotation(annotation.annotationId);

    document.addEventListener('mousemove', this.resizeArrow);
    document.addEventListener('mouseup', this.endArrowResize);
  }

  resizeArrow = (event: MouseEvent): void => {
    if (!this.resizingArrowId || !this.arrowResizeEndpoint || !this.arrowResizeFixedPoint || !this.arrowResizePageRect) {
      return;
    }

    const movingPoint = {
      x: this.clamp(event.clientX - this.arrowResizePageRect.left, 0, this.xboxPageWidth),
      y: this.clamp(event.clientY - this.arrowResizePageRect.top, 0, this.xboxPageHeight),
    };

    const start = this.arrowResizeEndpoint === 'start' ? movingPoint : this.arrowResizeFixedPoint;
    const end = this.arrowResizeEndpoint === 'end' ? movingPoint : this.arrowResizeFixedPoint;

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.max(5, Math.abs(end.x - start.x));
    const height = Math.max(5, Math.abs(end.y - start.y));

    const annotation = this.getAnnotationById(this.resizingArrowId);
    if (!annotation) return;

    this.updateArrowAnnotation(this.resizingArrowId, {
      normalizedX: left / this.xboxPageWidth,
      normalizedY: top / this.xboxPageHeight,
      normalizedWidth: width / this.xboxPageWidth,
      normalizedHeight: height / this.xboxPageHeight,
      style: {
        ...annotation.style,
        arrowStartCorner: this.getArrowStartCornerFromPoints(start, end),
        arrowRotationDegrees: 0,
      },
    });
  };

  endArrowResize = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.resizeArrow);
    document.removeEventListener('mouseup', this.endArrowResize);
    if (this.resizingArrowId) {
      this.recordAnnotationUndoIfChanged(this.arrowUndoSnapshot, 'Resize arrow');
      this.saveAnnotationsToDocument();
    }
    this.arrowUndoSnapshot = [];
    this.resizingArrowId = null;
    this.arrowResizeEndpoint = null;
    this.arrowResizeFixedPoint = null;
    this.arrowResizePageRect = null;
  };

  deleteArrow(event: MouseEvent, annotation: any): void {
    event.stopPropagation();
    event.preventDefault();
    this.recordAnnotationUndo('Delete arrow');
    this.annotationState.removeAnnotationLocally(annotation.annotationId);
    this.removeAnnotationFromDocument(annotation.annotationId);
    if (this.selectedAnnotationId === annotation.annotationId) {
      this.selectedAnnotationId = null;
    }
    this.saveAnnotationsToDocument();
    this.cdRef.detectChanges();
  }

  startArrowRotate(event: MouseEvent, annotation: any): void {
    if (!this.canEditDocument || !this.isArrowAnnotation(annotation)) return;
    event.stopPropagation();
    event.preventDefault();

    const pageElement = (event.target as HTMLElement).closest('.page') as HTMLElement | null;
    this.arrowRotatePageRect = pageElement?.getBoundingClientRect() ?? null;
    if (!this.arrowRotatePageRect) return;

    this.clearActiveDrawingTool();
    this.rotatingArrowId = annotation.annotationId;
    this.arrowUndoSnapshot = this.cloneAnnotationsSnapshot();
    const center = this.getArrowCenterPixels(annotation);
    this.arrowRotateStartAngle = this.getPointerAngleFromCenter(event, this.arrowRotatePageRect, center);
    this.arrowInitialRotationDegrees = this.getArrowRotationDegrees(annotation);
    this.selectAnnotation(annotation.annotationId);

    document.addEventListener('mousemove', this.rotateArrow);
    document.addEventListener('mouseup', this.endArrowRotate);
  }

  rotateArrow = (event: MouseEvent): void => {
    if (!this.rotatingArrowId || !this.arrowRotatePageRect) return;
    const annotation = this.getAnnotationById(this.rotatingArrowId);
    if (!annotation) return;

    const center = this.getArrowCenterPixels(annotation);
    const pointerAngle = this.getPointerAngleFromCenter(event, this.arrowRotatePageRect, center);

    this.updateArrowAnnotation(this.rotatingArrowId, {
      style: {
        ...annotation.style,
        arrowRotationDegrees: this.normalizeDegrees(
          this.arrowInitialRotationDegrees + pointerAngle - this.arrowRotateStartAngle
        ),
      },
    });
  };

  endArrowRotate = (_event: MouseEvent): void => {
    document.removeEventListener('mousemove', this.rotateArrow);
    document.removeEventListener('mouseup', this.endArrowRotate);
    if (this.rotatingArrowId) {
      this.recordAnnotationUndoIfChanged(this.arrowUndoSnapshot, 'Rotate arrow');
      this.saveAnnotationsToDocument();
    }
    this.rotatingArrowId = null;
    this.arrowRotatePageRect = null;
    this.arrowRotateStartAngle = 0;
    this.arrowInitialRotationDegrees = 0;
    this.arrowUndoSnapshot = [];
  };

  // ============= ANNOTATION SELECTION & DELETION =============

  /**
   * Select an annotation (text box, arrow, shape, etc.) so it can be deleted with Delete key.
   * For text boxes: triggered by click on the text box DOM element.
   * For canvas annotations (arrows, shapes, highlights): bridged via toolState$ subscription.
   */
  selectAnnotation(annotationId: string): void {
    this.selectedAnnotationId = annotationId;
    this.selectedXboxIndex = null;
    // Also sync to the state service so the canvas knows
    this.annotationState.selectAnnotations([annotationId]);
  }

  /**
   * Deselect all annotations (triggered by clicking empty space).
   */
  deselectAllAnnotations(): void {
    this.selectedAnnotationId = null;
    this.selectedXboxIndex = null;
    this.annotationState.clearSelection();
  }

  /**
   * Delete whichever annotation is currently selected (any type).
   * Called when the user presses Delete or Backspace.
   */
  deleteSelectedAnnotation(): void {
    if (!this.selectedAnnotationId) return;

    const idToDelete = this.selectedAnnotationId;
    const annotationToDelete = this.getAnnotationById(idToDelete);
    if (this.isArrowAnnotation(annotationToDelete)) {
      this.recordAnnotationUndo('Delete arrow');
    }

    // Remove from annotation state and sync to document
    this.annotationState.removeAnnotationLocally(idToDelete);
    this.removeAnnotationFromDocument(idToDelete);
    this.saveAnnotationsToDocument();

    // Clear selection
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();

    this.cdRef.detectChanges();
    console.log('Deleted annotation:', idToDelete);
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.canEditDocument || this.isKeyboardEventFromEditableTarget(event)) {
      return;
    }

    if (event.key !== 'Delete' && event.key !== 'Backspace') {
      return;
    }

    if (this.selectedXboxIndex !== null) {
      this.deleteXbox(this.selectedXboxIndex, event);
      return;
    }

    if (this.selectedAnnotationId) {
      event.preventDefault();
      this.deleteSelectedAnnotation();
    }
  }

  private isKeyboardEventFromEditableTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }

    return target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }

  /**
   * Toggle the preset menu dropdown
   */
  togglePresetMenu(): void {
    this.showPresetMenu = !this.showPresetMenu;
  }

  /**
   * Insert a text box preset annotation
   */
  async insertPreset(presetId: string): Promise<void> {
    const preset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      console.error('Preset not found:', presetId);
      return;
    }

    // Close the preset menu
    this.showPresetMenu = false;

    // Create the annotation
    try {
      const annotationId = await this.annotationState.createAnnotation({
        type: 'textbox',
        pageIndex: this.currentPageIndex,
        normalizedX: preset.normalizedX,
        normalizedY: preset.normalizedY,
        normalizedWidth: preset.normalizedWidth || 0.3,
        normalizedHeight: preset.normalizedHeight || 0.05,
        text: preset.defaultText,
        style: preset.style
      });

      if (annotationId) {
        console.log('Preset inserted:', presetId, annotationId);
      }
    } catch (error) {
      console.error('Error inserting preset:', error);
    }
  }

  /**
   * Insert a scene marker with auto-incrementing number
   */
  async insertSceneMarker(): Promise<void> {
    const nextSceneNumber = this.getNextSceneNumber();
    const sceneText = `Scene ${nextSceneNumber}`;

    // Get the scene marker preset for styling
    const sceneMarkerPreset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.isSceneMarker);
    if (!sceneMarkerPreset) {
      console.error('Scene marker preset not found');
      return;
    }

    try {
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
      }
    } catch (error) {
      console.error('Error inserting scene marker:', error);
    }
  }

  /**
   * Get the next scene marker number
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
   * Insert disclaimer annotation on current page
   */
  private async insertDisclaimer(): Promise<void> {
    const preset = DEFAULT_TEXT_BOX_PRESETS.find(p => p.id === 'legal-disclaimer');
    if (!preset) {
      console.error('Legal disclaimer preset not found');
      return;
    }

    try {
      const annotationId = await this.annotationState.createAnnotation({
        type: 'textbox',
        pageIndex: this.currentPageIndex,
        normalizedX: preset.normalizedX,
        normalizedY: preset.normalizedY,
        normalizedWidth: preset.normalizedWidth || 0.8,
        normalizedHeight: preset.normalizedHeight || 0.04,
        text: 'Performers are not required to learn or memorize lines in advance of their interview.',
        style: preset.style
      });

      if (annotationId) {
        this.disclaimerActive = true;
        console.log('Disclaimer inserted:', annotationId);
      }
    } catch (error) {
      console.error('Error inserting disclaimer:', error);
    }
  }

  /**
   * Remove disclaimer annotation from current page
   */
  private async removeDisclaimer(): Promise<void> {
    const disclaimerText = 'Performers are not required to learn or memorize lines in advance of their interview.';
    const pageAnnotations = this.annotationState.getAnnotationsForPage(this.currentPageIndex);
    const disclaimerAnnotation = pageAnnotations.find(
      a => a.type === 'textbox' && a.text === disclaimerText
    );

    if (disclaimerAnnotation) {
      try {
        await this.annotationState.deleteAnnotation(disclaimerAnnotation.annotationId);
        this.disclaimerActive = false;
        console.log('Disclaimer removed');
      } catch (error) {
        console.error('Error removing disclaimer:', error);
      }
    }
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
    
    // Calculate delta from start
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    
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
        line.calculatedXpos = this.clamp(newX, 0, this.xboxPageWidth) + 'px';
        line.calculatedYpos = this.clamp(newY, 0, this.xboxPageHeight) + 'px';
        break;
      case 'end':
        line.calculatedEnd = this.clamp(newY, 0, this.xboxPageHeight) + 'px';
        break;
      case 'continue':
        line.calculatedBarY = this.clamp(newY, 0, this.xboxPageHeight) + 'px';
        break;
      case 'continue-top':
        line.calculatedBarY = this.clamp(newY, 0, this.xboxPageHeight) + 'px';
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

    // Calculate final position
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
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
        line.calculatedXpos = this.clamp(finalX, 0, this.xboxPageWidth) + 'px';
        line.calculatedYpos = this.clamp(finalY, 0, this.xboxPageHeight) + 'px';
        line.xPos = this.clamp(finalX, 0, this.xboxPageWidth);
        line.yPos = this.clamp(finalY, 0, this.xboxPageHeight);
        break;
      case 'end':
        line.calculatedEnd = this.clamp(finalY, 0, this.xboxPageHeight) + 'px';
        line.endY = this.clamp(finalY, 0, this.xboxPageHeight);
        break;
      case 'continue':
      case 'continue-top':
        line.calculatedBarY = this.clamp(finalY, 0, this.xboxPageHeight) + 'px';
        line.barY = this.clamp(finalY, 0, this.xboxPageHeight);
        break;
    }

    // Only emit events and update if position actually changed
    if (hasPositionChanged) {
      // Emit events and update PdfService
      this.positionChanged.emit({
        line,
        lineIndex,
        newPosition: {
          x: this.clamp(finalX, 0, this.xboxPageWidth) + 'px',
          y: this.clamp(finalY, 0, this.xboxPageHeight) + 'px'
        },
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
    
    const deltaX = event.clientX - this.barTextDragStartX;
    const newOffset = this.clamp(this.barTextInitialOffset + deltaX, 0, this.xboxPageWidth);
    
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
    let hasOffsetChanged = false;
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

      hasOffsetChanged = Math.abs(currentOffset - this.barTextInitialOffset) > 2;

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

    // Only emit page update if the drag actually moved the text.
    // Emitting on every mouseup causes Angular to re-render the DOM element,
    // which destroys the dblclick target and prevents double-click editing.
    if (hasOffsetChanged) {
      this.pageUpdate.emit([...this.page]);
    }

    this.barTextDragging = false;
    this.barTextDragLineId = null;
    this.barTextDragType = null;
  };

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
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + click for multi-selection
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

  openContextMenu(event: MouseEvent, line: any, lineIndex: number): void {
    console.log('🔴 openContextMenu called, selectedLineIds:', this.selectedLineIds, 'line:', line?.docPageLineIndex);
    event.preventDefault();

    // If no lines are selected, select the right-clicked line
    if (this.selectedLineIds.length === 0 && line) {
      console.log('🔴 No lines selected, auto-selecting right-clicked line');
      this.selectedLineIds = [line.docPageLineIndex];
      this.lastSelectedIndex = line.docPageLineIndex;
      this.emitSelectedLines();
    }

    console.log('🔴 Opening context menu');
    this.showContextMenu = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedLine = line;
    this.selectedLineIndex = lineIndex;
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

    // Handle Delete / Backspace to remove selected annotation
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedAnnotationId) {
      // Don't delete if user is typing in a text box or bar text input
      if (this.editingTextBoxId || this.barTextEditingId !== null) return;

      event.preventDefault();
      event.stopPropagation();
      this.deleteSelectedAnnotation();
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

  private cloneAnnotationsSnapshot(): any[] {
    return cloneDeep(this.pdfService.finalDocument?.annotations || []);
  }

  private hasNewArrowAnnotation(previousAnnotations: any[], nextAnnotations: any[]): boolean {
    const previousIds = new Set(previousAnnotations.map(annotation => annotation.annotationId));
    return nextAnnotations.some(annotation =>
      !previousIds.has(annotation.annotationId) && this.isArrowAnnotation(annotation)
    );
  }

  private recordAnnotationUndo(description: string): void {
    this.undoService.recordAnnotationChange(this.cloneAnnotationsSnapshot(), description);
  }

  private recordAnnotationUndoIfChanged(previousAnnotations: any[], description: string): void {
    const currentAnnotations = this.cloneAnnotationsSnapshot();
    if (JSON.stringify(previousAnnotations) !== JSON.stringify(currentAnnotations)) {
      this.undoService.recordAnnotationChange(previousAnnotations, description);
    }
  }

  private syncAnnotationStateFromDocument(): void {
    this.isRestoringAnnotations = true;
    if (this.documentId) {
      this.annotationState.initializeLocal(this.documentId);
      this.loadAnnotationsFromDocument();
    }
    this.saveAnnotationsToDocument();
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();
    this.isRestoringAnnotations = false;
    this.cdRef.detectChanges();
  }

  private getAnnotationById(annotationId: string): any | null {
    return this.pdfService.finalDocument?.annotations?.find((annotation: any) => annotation.annotationId === annotationId) || null;
  }

  private updateArrowAnnotation(annotationId: string, updates: any): void {
    this.annotationState.updateAnnotation(annotationId, updates);
    const annotation = this.getAnnotationById(annotationId);
    if (annotation) {
      Object.assign(annotation, updates);
    }
    this.cdRef.detectChanges();
  }

  private removeAnnotationFromDocument(annotationId: string): void {
    if (!this.pdfService.finalDocument?.annotations) return;
    this.pdfService.finalDocument.annotations = this.pdfService.finalDocument.annotations.filter(
      (annotation: any) => annotation.annotationId !== annotationId
    );
  }

  private getArrowEndpointPixels(annotation: any): { start: { x: number; y: number }; end: { x: number; y: number } } {
    const baseEndpoints = this.getArrowBaseEndpointPixels(annotation);
    const rotationDegrees = this.getArrowRotationDegrees(annotation);
    if (rotationDegrees === 0) {
      return baseEndpoints;
    }

    const center = this.getArrowCenterPixels(annotation);
    return {
      start: this.rotatePointAroundCenter(baseEndpoints.start, center, rotationDegrees),
      end: this.rotatePointAroundCenter(baseEndpoints.end, center, rotationDegrees),
    };
  }

  private getArrowBaseEndpointPixels(annotation: any): { start: { x: number; y: number }; end: { x: number; y: number } } {
    const left = annotation.normalizedX * this.xboxPageWidth;
    const top = annotation.normalizedY * this.xboxPageHeight;
    const width = annotation.normalizedWidth * this.xboxPageWidth;
    const height = annotation.normalizedHeight * this.xboxPageHeight;

    switch (annotation.style?.arrowStartCorner || 'tl') {
      case 'tr':
        return { start: { x: left + width, y: top }, end: { x: left, y: top + height } };
      case 'bl':
        return { start: { x: left, y: top + height }, end: { x: left + width, y: top } };
      case 'br':
        return { start: { x: left + width, y: top + height }, end: { x: left, y: top } };
      case 'tl':
      default:
        return { start: { x: left, y: top }, end: { x: left + width, y: top + height } };
    }
  }

  getArrowHandleStyle(annotation: any, endpoint: 'start' | 'end'): any {
    const endpoints = this.getArrowEndpointPixels(annotation);
    const point = endpoints[endpoint];
    const left = point.x - annotation.normalizedX * this.xboxPageWidth;
    const top = point.y - annotation.normalizedY * this.xboxPageHeight;
    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }

  getArrowSvgTransform(annotation: any): string | null {
    const rotationDegrees = this.getArrowRotationDegrees(annotation);
    if (rotationDegrees === 0) {
      return null;
    }

    const width = annotation.normalizedWidth * this.xboxPageWidth;
    const height = annotation.normalizedHeight * this.xboxPageHeight;
    return `rotate(${rotationDegrees} ${width / 2} ${height / 2})`;
  }

  private getArrowCenterPixels(annotation: any): { x: number; y: number } {
    const left = annotation.normalizedX * this.xboxPageWidth;
    const top = annotation.normalizedY * this.xboxPageHeight;
    const width = annotation.normalizedWidth * this.xboxPageWidth;
    const height = annotation.normalizedHeight * this.xboxPageHeight;
    return {
      x: left + width / 2,
      y: top + height / 2,
    };
  }

  private getArrowRotationDegrees(annotation: any): number {
    const rotation = Number(annotation.style?.arrowRotationDegrees || 0);
    return Number.isFinite(rotation) ? rotation : 0;
  }

  private getPointerAngleFromCenter(
    event: MouseEvent,
    pageRect: DOMRect,
    center: { x: number; y: number }
  ): number {
    const pointer = {
      x: this.clamp(event.clientX - pageRect.left, 0, this.xboxPageWidth),
      y: this.clamp(event.clientY - pageRect.top, 0, this.xboxPageHeight),
    };
    return Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180 / Math.PI;
  }

  private rotatePointAroundCenter(
    point: { x: number; y: number },
    center: { x: number; y: number },
    degrees: number
  ): { x: number; y: number } {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  private normalizeDegrees(degrees: number): number {
    const normalized = ((degrees % 360) + 360) % 360;
    return Math.round(normalized * 100) / 100;
  }

  private getArrowStartCornerFromPoints(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): 'tl' | 'tr' | 'bl' | 'br' {
    const drawnRight = end.x >= start.x;
    const drawnDown = end.y >= start.y;
    if (drawnRight && drawnDown) return 'tl';
    if (!drawnRight && drawnDown) return 'tr';
    if (drawnRight && !drawnDown) return 'bl';
    return 'br';
  }

  /**
   * Get annotations for the current page (for preview mode rendering)
   */
  trackAnnotationById(_index: number, annotation: any): string {
    return annotation.annotationId;
  }

  getAnnotationsForCurrentPage(): any[] {
    if (!this.pdfService.finalDocument?.annotations) {
      return [];
    }

    return this.pdfService.finalDocument.annotations.filter(
      annotation => annotation.pageIndex === this.currentPageIndex
    );
  }

  /**
   * Calculate pixel position from normalized coordinates
   */
  getAnnotationPixelStyle(annotation: any): any {
    const pageWidth = 816; // Standard page width
    const pageHeight = 1056; // Standard page height

    const left = annotation.normalizedX * pageWidth;
    const top = annotation.normalizedY * pageHeight; // normalizedY is from the top (matches canvas coordinate system)
    const width = annotation.normalizedWidth * pageWidth;
    const height = annotation.normalizedHeight * pageHeight;

    // Base styles for all annotation types
    const baseStyle: any = {
      position: 'absolute',
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      zIndex: 10,
      overflow: 'hidden'
    };

    // Type-specific styling
    switch (annotation.type) {
      case 'textbox':
        return {
          position: 'absolute',
          left: left + 'px',
          top: top + 'px',
          width: width + 'px',
          minHeight: height + 'px',
          boxSizing: 'border-box',
          zIndex: 10,
          overflow: 'visible',
        };

      case 'highlight':
        return {
          ...baseStyle,
          backgroundColor: annotation.style?.color || '#FFFF00',
          opacity: annotation.style?.opacity || 0.3,
        };

      case 'note': // Arrow annotation — rendered as SVG in the template
      case 'shape':
        return {
          ...baseStyle,
          overflow: 'visible', // SVG arrows/arrowheads extend past bounding box — must not clip
        };

      case 'redaction':
        return {
          ...baseStyle,
          backgroundColor: '#000000',
        };

      default:
        return {
          ...baseStyle,
          fontSize: (annotation.style?.fontSize || 14) + 'px',
          fontFamily: annotation.style?.fontFamily || 'Arial',
          color: annotation.style?.color || '#000000',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        };
    }
  }

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
   *
   * Coordinate system:
   *   - Lines are positioned with CSS `bottom: Npx` on a 1056px-tall page
   *   - SVG origin is top-left, so:  svgY = PAGE_HEIGHT - bottomPx
   *
   * Returns skipped-section boxes in SVG pixel space.
   */
  getSkippedSections(): Array<{ top: number; bottom: number; left: number; right: number; lineIds: number[]; stableKey: string }> {
    const PAGE_HEIGHT = 1056;
    const CONTENT_LEFT = 88;   // Slightly outside left content margin (96) for padding
    const CONTENT_RIGHT = 739; // Slightly outside right content edge (731) for padding
    const PAD_TOP = 20;        // Top padding — clears text above the first skipped line
    const PAD_BOTTOM = 4;      // Bottom padding — tight so box doesn't bleed onto next scene

    // Categories that are not "content" and should not affect X-box bounds
    const EXCLUDED_CATEGORIES = new Set([
      'page-number',
      'page-number-hidden',
      'injected-break',
      'callsheet',
    ]);

    const sections: Array<{ top: number; bottom: number; left: number; right: number; lineIds: number[]; stableKey: string }> = [];

    // Track the current group of skipped lines
    let groupMaxYPos: number | null = null; // highest bottom value → highest on page
    let groupMinYPos: number | null = null; // lowest bottom value → lowest on page
    let groupLineIds: number[] = [];

    const flushGroup = () => {
      if (groupMaxYPos !== null && groupMinYPos !== null) {
        // Convert CSS bottom coords to SVG top-down coords
        const svgTop = PAGE_HEIGHT - groupMaxYPos - PAD_TOP;
        const svgBottom = PAGE_HEIGHT - groupMinYPos + PAD_BOTTOM;

        // Only emit sections with meaningful height
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
      // Skip structural/non-content elements
      if (EXCLUDED_CATEGORIES.has(line.category)) {
        continue;
      }

      // Skip lines that are completely hidden from the DOM
      if (line.hidden === 'hidden') {
        continue;
      }

      const isSkipped = line.visible === 'false' || (line.visible as any) === false;

      if (isSkipped) {
        // Parse the CSS `bottom` value — always the scaled position (yPos * 1.3).
        // calculatedYpos is a string like "130px" → parse as number.
        // If calculatedYpos is absent, compute from raw yPos * 1.3 (same scale factor
        // used everywhere in the template).
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
        // Visible line — flush any open group
        flushGroup();
      }
    }

    // Flush final group
    flushGroup();

    return sections;
  }

  // ============= X-BOX EDITING METHODS =============

  /**
   * Toolbar action: hide the selected lines and create a saved X-box record covering them.
   * The saved record lives on `pdfService.finalDocument.xboxes` and is the source of
   * truth for that box's geometry through every subsequent drag/resize.
   */
  addXbox(): void {
    if (!this.canEditDocument || this.selectedLineIds.length === 0) return;

    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    if (selectedLines.length === 0) return;

    const allHidden = selectedLines.every(
      line => line.visible === 'false' || (line.visible as any) === false
    );
    if (allHidden) return;

    const lineIdsToHide = selectedLines
      .map(l => this.getXboxLineId(l))
      .filter((id): id is number => id !== null);
    if (lineIdsToHide.length === 0) return;

    const previousXboxes = this.cloneXboxesSnapshot();
    const lineChanges = this.setXboxLinesVisibleInPage(lineIdsToHide, false, 'Add X-box');

    const geometry = this.computeXboxGeometryForLineIds(lineIdsToHide);
    if (!geometry) {
      if (lineChanges.length > 0) {
        this.undoService.recordXboxChange(previousXboxes, lineChanges, 'Add X-box');
      }
      return;
    }

    const id = this.generateXboxId();
    const record = {
      id,
      pageIndex: this.currentPageIndex,
      lineIds: [...lineIdsToHide],
      top: geometry.top,
      bottom: geometry.bottom,
      left: geometry.left,
      right: geometry.right,
    };
    this.setSavedXboxesForPage([...this.getSavedXboxesForPage(), record]);

    this.selectedXboxIndex = id;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();

    this.undoService.recordXboxChange(previousXboxes, lineChanges, 'Add X-box');
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  /**
   * Returns the X-boxes to render on the current page. Saved records are the source
   * of truth; any contiguous-skipped-line group not yet covered by a saved record is
   * surfaced as a "stub" so legacy creation paths (X key, etc.) still display, and
   * promoted to a saved record on first interaction (click/drag/resize).
   */
  getDisplayedSkippedSections(): Array<{ top: number; bottom: number; left: number; right: number; originalIndex: string; lineIds: number[] }> {
    const savedSections = this.getSavedXboxesForPage().map((xbox: any) => ({
      top: xbox.top,
      bottom: xbox.bottom,
      left: xbox.left,
      right: xbox.right,
      originalIndex: xbox.id,
      lineIds: [...(xbox.lineIds || [])],
    }));

    const savedLineIds = new Set(savedSections.flatMap(section => section.lineIds));

    const stubSections = this.getSkippedSections()
      .filter(section => !section.lineIds.some(id => savedLineIds.has(id)))
      .map(section => ({
        top: section.top,
        bottom: section.bottom,
        left: section.left,
        right: section.right,
        originalIndex: section.stableKey,
        lineIds: [...section.lineIds],
      }));

    return [...savedSections, ...stubSections];
  }

  /**
   * Select an X-box for editing. Click on the X-box overlay div.
   */
  selectXbox(originalIndex: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const id = this.ensureXboxIsSaved(originalIndex);
    if (!id) return;
    this.selectedXboxIndex = id;
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();
    this.cdRef.detectChanges();
  }

  /**
   * Deselect X-box when clicking elsewhere.
   */
  deselectXbox(): void {
    this.selectedXboxIndex = null;
    this.cdRef.detectChanges();
  }

  /**
   * Delete (remove) a specific X-box overlay. Restores its lineIds to visible.
   */
  deleteXbox(originalIndex: string, event?: MouseEvent | KeyboardEvent): void {
    event?.stopPropagation();
    event?.preventDefault();

    const id = this.ensureXboxIsSaved(originalIndex);
    if (!id) return;
    const xbox = this.getXboxById(id);
    if (!xbox) return;

    const previousXboxes = this.cloneXboxesSnapshot();

    const ownedLineIds = [...((xbox.lineIds || []) as number[])];
    const lineChanges = ownedLineIds.length > 0
      ? this.setXboxLinesVisibleInPage(ownedLineIds, true, 'Delete X-box')
      : [];

    const ownedLineKey = ownedLineIds.length > 0
      ? this.getXboxStableKey(ownedLineIds)
      : null;
    const remaining = this.getSavedXboxesForPage().filter((x: any) => {
      if (x.id === id) {
        return false;
      }
      if (!ownedLineKey) {
        return true;
      }
      return this.getXboxStableKey(((x.lineIds || []) as number[])) !== ownedLineKey;
    });
    this.setSavedXboxesForPage(remaining);

    if (this.selectedXboxIndex === id) {
      this.selectedXboxIndex = null;
    }

    this.undoService.recordXboxChange(previousXboxes, lineChanges, 'Delete X-box');
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  }

  /**
   * Start dragging an X-box. Promotes a stub section to a saved record on first drag.
   */
  startXboxDrag(originalIndex: string, event: MouseEvent): void {
    if (!this.canEditDocument) return;
    if ((event.target as HTMLElement).closest('.xbox-delete-btn') ||
        (event.target as HTMLElement).closest('.xbox-resize-handle')) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const id = this.ensureXboxIsSaved(originalIndex);
    if (!id) return;
    const xbox = this.getXboxById(id);
    if (!xbox) return;

    this.selectedXboxIndex = id;
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

    const deltaX = event.clientX - this.xboxDragStartX;
    const deltaY = event.clientY - this.xboxDragStartY;
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
    this.pageUpdate.emit([...this.page]);
    this.cdRef.detectChanges();
  };

  /**
   * Start resizing an X-box from a corner handle.
   */
  startXboxResize(originalIndex: string, edge: string, event: MouseEvent): void {
    if (!this.canEditDocument) return;
    event.stopPropagation();
    event.preventDefault();

    const id = this.ensureXboxIsSaved(originalIndex);
    if (!id) return;
    const xbox = this.getXboxById(id);
    if (!xbox) return;

    this.selectedXboxIndex = id;
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

    const deltaX = event.clientX - this.xboxResizeStartX;
    const deltaY = event.clientY - this.xboxResizeStartY;
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
    this.pageUpdate.emit([...this.page]);
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

  private setSavedXboxesForPage(xboxes: any[]): void {
    if (!this.pdfService.finalDocument) return;
    const all = Array.isArray((this.pdfService.finalDocument as any).xboxes)
      ? (this.pdfService.finalDocument as any).xboxes
      : [];
    const otherPages = all.filter((xbox: any) => xbox && xbox.pageIndex !== this.currentPageIndex);
    (this.pdfService.finalDocument as any).xboxes = [...otherPages, ...xboxes];
  }

  private getXboxById(id: string): any | null {
    return this.getSavedXboxesForPage().find((xbox: any) => xbox.id === id) || null;
  }

  private cloneXboxesSnapshot(): any[] {
    const all = (this.pdfService.finalDocument as any)?.xboxes || [];
    return cloneDeep(all);
  }

  /**
   * Promote a "stub" auto-derived skipped-section into a saved X-box record so it
   * has a stable identity for drag/resize/delete. Returns the saved id (existing or new).
   */
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

  /**
   * After a drag/resize, recompute which lines fall inside the X-box geometry and
   * sync line.visible accordingly. Returns the line changes for undo.
   */
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

  /**
   * Compute a tight bounding box for the given line IDs using the same coordinate
   * conventions as `getSkippedSections()`. Returns null if no usable lines were found.
   */
  private computeXboxGeometryForLineIds(lineIds: number[]): { top: number; bottom: number; left: number; right: number } | null {
    if (lineIds.length === 0) return null;
    const PAGE_HEIGHT = this.xboxPageHeight;
    const CONTENT_LEFT = 88;
    const CONTENT_RIGHT = 739;
    const PAD_TOP = 20;
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

  /**
   * Set line visibility for a set of line IDs on the current page, returning the
   * undo entries (with previousLineState) for any lines that actually changed.
   *
   * IMPORTANT: passes `skipUndoRecording: true` to `pdfService.updateLine` because
   * these line changes are already captured atomically inside the X-box undo entry
   * via `recordXboxChange(previousXboxes, lineChanges, ...)`. Letting `updateLine`
   * record its own line-change items would push duplicate entries onto the undo
   * stack, interleaved with the xbox-change item, and desync undo on replay.
   */
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

  // Get SVG path for category icons
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'scene-header': 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
      'action': 'M4 6h16M4 12h16M4 18h16',
      'character': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'dialogue': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      'parenthetical': 'M9 5l7 7-7 7',
      'transition': 'M13 7l5 5m0 0l-5 5m5-5H6',
      'shot': 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      'general': 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
    };

    return icons[category] || icons['general'];
  }

  // ============= TOOLBAR HELPER METHODS =============

  // Check if any selected line has visibility toggled
  isVisibilityToggled(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.visible === 'false');
  }

  // Get tooltip text for visibility button
  getVisibilityTooltip(): string {
    if (this.selectedLineIds.length === 0) return 'Toggle Visibility';
    return this.isVisibilityToggled() ? 'Show Lines' : 'Hide Lines';
  }

  // Toggle visibility for all selected lines
  toggleSelectedVisibility(): void {
    if (this.selectedLineIds.length === 0) return;

    const selectedLines = this.selectedLineIds.map(lineId => {
      const line = this.page.find(l => l.docPageLineIndex === lineId);
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === lineId);
      return { line, lineIndex };
    }).filter(item => item.line);

    if (selectedLines.length === 0) return;

    // Determine new visibility state
    const firstLine = selectedLines[0].line;
    const newVisibility = firstLine.visible === 'true' ? 'false' : 'true';

    // Record undo for batch operation
    const batchChanges = selectedLines.map(({ line, lineIndex }) => ({
      pageIndex: this.currentPageIndex,
      lineIndex,
      currentLineState: { ...line },
      changeDescription: `Toggle visibility: ${line.visible} → ${newVisibility}`
    }));
    this.undoService.recordBatchChanges(batchChanges);

    // Update all selected lines
    selectedLines.forEach(({ line, lineIndex }) => {
      this.pdfService.updateLine(
        this.currentPageIndex,
        line.docPageLineIndex,
        { ...line, visible: newVisibility }
      );
    });

    this.cdRef.detectChanges();
  }

  // Check if any selected line has start bar
  hasStartBar(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.bar === 'bar');
  }

  // Toggle start bar for selected lines
  toggleStartBarForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (firstLine) {
      // Use existing context menu logic with the first selected line
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);

      // Record undo
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        firstLine,
        `Toggle start bar`
      );

      // Toggle the bar
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
  }

  // Check if any selected line has end bar
  hasEndBar(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.end === 'END');
  }

  // Toggle end bar for selected lines
  toggleEndBarForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (firstLine) {
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);

      // Record undo
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        firstLine,
        `Toggle end bar`
      );

      // Toggle the bar
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
  }

  // Check if any selected line has continue top
  hasContinueTop(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.cont === 'CONTINUE-TOP');
  }

  // Toggle continue top for selected lines
  toggleContinueTopForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (firstLine) {
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);

      // Record undo
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        firstLine,
        `Toggle continue top bar`
      );

      // Toggle the bar
      if (firstLine.cont === 'CONTINUE-TOP') {
        firstLine.cont = 'hideCont';
        firstLine.calculatedBarY = undefined;
        firstLine.continueTopTextOffset = undefined;
      } else {
        if (firstLine.cont === 'CONTINUE') {
          firstLine.cont = 'hideCont';
        }
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
  }

  // Check if any selected line has continue
  hasContinue(): boolean {
    if (this.selectedLineIds.length === 0) return false;
    const selectedLines = this.page.filter(line => this.selectedLineIds.includes(line.docPageLineIndex));
    return selectedLines.some(line => line.cont === 'CONTINUE');
  }

  // Toggle continue for selected lines
  toggleContinueForSelected(): void {
    if (this.selectedLineIds.length === 0) return;
    const firstLine = this.page.find(l => l.docPageLineIndex === this.selectedLineIds[0]);
    if (firstLine) {
      const lineIndex = this.page.findIndex(l => l.docPageLineIndex === firstLine.docPageLineIndex);

      // Record undo
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        firstLine,
        `Toggle continue bar`
      );

      // Toggle the bar
      if (firstLine.cont === 'CONTINUE') {
        firstLine.cont = 'hideCont';
        firstLine.calculatedBarY = undefined;
        firstLine.continueTextOffset = undefined;
      } else {
        if (firstLine.cont === 'CONTINUE-TOP') {
          firstLine.cont = 'hideCont';
        }
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
  }

  /**
   * Combine/condense pages by removing hidden (false) lines and repaginating.
   * This helps casting directors meet the SAG-AFTRA 8-page limit for audition sides.
   */
  combinePages(): void {
    const totalPages = this.pdfService.finalDocument?.data?.length || 0;

    if (totalPages === 0) {
      alert('No pages to condense.');
      return;
    }

    const confirmMsg = totalPages <= 8
      ? `Current document has ${totalPages} pages (within 8-page limit).\nCondensing will remove all crossed-out lines and repack pages.\n\nThis cannot be undone. Continue?`
      : `Current document has ${totalPages} pages (exceeds 8-page SAG-AFTRA limit).\nCondensing will remove all crossed-out lines and try to fit within 8 pages.\n\nThis cannot be undone. Continue?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // Record undo state before combining
    this.undoService.recordDocumentReorderChange(
      cloneDeep(this.pdfService.finalDocument.data),
      'Combine/condense pages'
    );

    // Run the combine operation
    const result = this.pdfService.combinePages(8);

    if (!result.condensed) {
      alert('No hidden lines found to remove. Document is already condensed.');
      return;
    }

    // Update local state to reflect the new document
    const newPages = this.pdfService.finalDocument.data;
    const newCurrentPageIndex = Math.min(this.currentPageIndex, newPages.length - 1);

    // Emit page change to parent
    this.currentPageIndex = newCurrentPageIndex;
    this.page = newPages[newCurrentPageIndex] || [];
    this.pageUpdate.emit([...this.page]);
    this.pageChange.emit(newCurrentPageIndex);

    // Save the document state
    this.pdfService.saveDocumentState();

    // Force change detection
    this.cdRef.detectChanges();

    const pageReduction = (this.pdfService.finalDocument.data.length <= 8)
      ? `Now ${newPages.length} pages — within SAG-AFTRA limit! ✅`
      : `Now ${newPages.length} pages — still exceeds 8-page limit. Consider removing more material.`;

    alert(`Condensed: removed ${result.removedLines} hidden lines.\n${pageReduction}`);
  }

  // Reset to initial state
  resetToInitialState(): void {
    if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
      // Clear undo/redo history
      this.undoService.reset();

      // Reset page to initial state
      if (this.initialPageState && this.initialPageState.length > 0) {
        this.page = JSON.parse(JSON.stringify(this.initialPageState));
      }

      // Clear selections
      this.selectedLineIds = [];
      this.lastSelectedIndex = null;
      this.selectedLine = null;

      // Reset X-box state for current page
      if (this.pdfService.finalDocument) {
        const all = Array.isArray((this.pdfService.finalDocument as any).xboxes)
          ? (this.pdfService.finalDocument as any).xboxes
          : [];
        (this.pdfService.finalDocument as any).xboxes = all.filter(
          (xbox: any) => xbox && xbox.pageIndex !== this.currentPageIndex
        );
      }
      this.selectedXboxIndex = null;

      // Reset annotations to initial state
      this.annotationState.clear();

      // Restore initial annotations if they exist
      if (this.initialAnnotations && this.initialAnnotations.length > 0) {
        this.pdfService.finalDocument.annotations = JSON.parse(JSON.stringify(this.initialAnnotations));
        this.loadAnnotationsFromDocument();
      } else {
        // No initial annotations, just clear document annotations
        if (this.pdfService.finalDocument) {
          this.pdfService.finalDocument.annotations = [];
          this.pdfService.finalDocument.pageAnnotations = {};
        }
      }

      // Emit the reset page
      this.pageUpdate.emit([...this.page]);

      // Force change detection
      this.cdRef.detectChanges();

      console.log('Reset complete - page and annotations restored to initial state');
    }
  }

  // Save changes
  /**
   * Save annotations from state to document (called internally)
   */
  private saveAnnotationsToDocument(): void {
    console.log('💾 saveAnnotationsToDocument() called');

    if (!this.pdfService.finalDocument) {
      console.error('❌ No finalDocument exists!');
      return;
    }

    // Get all annotations from state
    const allAnnotations = Array.from(this.annotationState.annotations.values());
    console.log('📊 Retrieved', allAnnotations.length, 'annotations from state');

    // Save to document — even if empty (user may have deleted all annotations)
    this.pdfService.finalDocument.annotations = allAnnotations;

    // Also save to a per-page structure for easier backend processing
    this.pdfService.finalDocument.pageAnnotations = {};

    // Group annotations by page
    allAnnotations.forEach(annotation => {
      const pageKey = `page_${annotation.pageIndex}`;
      if (!this.pdfService.finalDocument.pageAnnotations[pageKey]) {
        this.pdfService.finalDocument.pageAnnotations[pageKey] = [];
      }
      this.pdfService.finalDocument.pageAnnotations[pageKey].push(annotation);
    });

    console.log('✅ Annotations saved to document:', {
      totalAnnotations: allAnnotations.length,
      annotationsByPage: Object.keys(this.pdfService.finalDocument.pageAnnotations).length,
      annotationDetails: allAnnotations.map(a => ({ type: a.type, text: a.text, page: a.pageIndex }))
    });
  }

  saveChanges(): void {
    if (this.pdfService.finalDocument?.data) {
      // Step 1: Sync current page to pdfService BEFORE saving
      console.log('saveChanges: Syncing page', this.currentPageIndex, 'to pdfService');
      this.pdfService.finalDocument.data[this.currentPageIndex] = [...this.page];

      // Step 2: Save annotations to document
      this.saveAnnotationsToDocument();

      // Step 3: Create persistent save point (deep copy)
      this.pdfService.saveDocumentState();

      console.log('Document saved with annotations:', {
        totalAnnotations: this.pdfService.finalDocument.annotations?.length || 0,
        annotationsByPage: this.pdfService.finalDocument.pageAnnotations
      });

      // Step 4: Emit page update so parent re-syncs its local state with saved data
      this.pageUpdate.emit([...this.page]);
    }

    // Show confirmation
    console.log('Changes saved successfully');
    alert('Changes saved successfully!');

    // Force change detection
    this.cdRef.detectChanges();
  }

}
