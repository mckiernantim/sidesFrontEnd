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
  draggingTextBoxId: string | null = null; // Currently dragging text box annotation ID
  textBoxDragStartX: number = 0;
  textBoxDragStartY: number = 0;
  textBoxInitialNormX: number = 0;
  textBoxInitialNormY: number = 0;

  // Unified annotation selection (works for text boxes, arrows, shapes, highlights)
  selectedAnnotationId: string | null = null;
  private toolStateSubscription: Subscription | null = null;
  private annotationsSyncSubscription: Subscription | null = null;

  @ViewChild('pdfViewer') pdfViewer: any;

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
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);

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
          this.saveAnnotationsToDocument();
          this.cdRef.detectChanges();
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
    }
  }

  /**
   * Finish editing a text box (on blur or Enter).
   */
  finishTextBoxEdit(): void {
    if (this.editingTextBoxId) {
      this.saveAnnotationsToDocument();
      this.editingTextBoxId = null;
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

    const deltaX = event.clientX - this.textBoxDragStartX;
    const deltaY = event.clientY - this.textBoxDragStartY;

    const newNormX = Math.max(0, Math.min(1, this.textBoxInitialNormX + (deltaX / pageWidth)));
    const newNormY = Math.max(0, Math.min(1, this.textBoxInitialNormY + (deltaY / pageHeight)));

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

  // ============= ANNOTATION SELECTION & DELETION =============

  /**
   * Select an annotation (text box, arrow, shape, etc.) so it can be deleted with Delete key.
   * For text boxes: triggered by click on the text box DOM element.
   * For canvas annotations (arrows, shapes, highlights): bridged via toolState$ subscription.
   */
  selectAnnotation(annotationId: string): void {
    this.selectedAnnotationId = annotationId;
    // Also sync to the state service so the canvas knows
    this.annotationState.selectAnnotations([annotationId]);
  }

  /**
   * Deselect all annotations (triggered by clicking empty space).
   */
  deselectAllAnnotations(): void {
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();
  }

  /**
   * Delete whichever annotation is currently selected (any type).
   * Called when the user presses Delete or Backspace.
   */
  deleteSelectedAnnotation(): void {
    if (!this.selectedAnnotationId) return;

    const idToDelete = this.selectedAnnotationId;

    // Remove from annotation state and sync to document
    this.annotationState.removeAnnotationLocally(idToDelete);
    this.saveAnnotationsToDocument();

    // Clear selection
    this.selectedAnnotationId = null;
    this.annotationState.clearSelection();

    this.cdRef.detectChanges();
    console.log('Deleted annotation:', idToDelete);
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
    
    const deltaX = event.clientX - this.barTextDragStartX;
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

  /**
   * Get annotations for the current page (for preview mode rendering)
   */
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
