import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { PdfService } from 'src/app/services/pdf/pdf.service';
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

  private subscription: Subscription;
  private sceneHeaderTextUpdateSubscription: Subscription;

  

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
    private pdfService: PdfService
  ) {
    // Subscribe to line updates from the service
    this.subscription = this.pdfService.finalDocumentData$.subscribe(update => {
      if (update) {
        // If the update is for our current page
        if (update.docPageIndex === this.currentPageIndex) {
          // Find the line in our page array
          const lineIndex = this.page.findIndex(l => l.docPageLineIndex === update.docPageLineIndex);
          if (lineIndex !== -1) {
            // Update only the specific line that changed
            this.page[lineIndex] = { ...update.line };
            this.cdRef.detectChanges();
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
      
      // Store initial state when page changes
      this.callsheetLoadError = null;
      this.initialPageState = [...this.page];
      
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
      
      // Force change detection
      this.cdRef.detectChanges();
    }
  
    // Handle other changes as before...
    if (changes['editMode']) {
      this.canEditDocument = changes['editMode'].currentValue;
      console.log('LastLooks editState changed to:', this.canEditDocument);
    }
  
    if (changes['resetDocState'] && changes['resetDocState'].currentValue) {
      this.page = JSON.parse(JSON.stringify(this.initialPageState));
      this.selectedLineIds = [];
      this.lastSelectedIndex = null;
      this.selectedLine = null;
      this.pageUpdate.emit(this.page);
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

  startLineDrag(event: MouseEvent, line: Line, type: 'line' | 'end' | 'continue' | 'continue-top'): void {
    // Don't start drag if we're in a double-click situation
    if (event.detail > 1) {
        return;
    }

    // Only check line selection for the main line drag, not for bars
    if (type === 'line' && !this.isLineSelected(line)) {
        return;
    }

    if (!this.canEditDocument) return;
    
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
    
    this.pageUpdate.emit([...this.page]);
    
    // Clear dragging state
    this.mouseDragging = false;
    this.dragLineId = null;
    
    this.cdRef.detectChanges();
  };

  // ============= BAR TEXT DRAGGING METHODS =============
  
  startBarTextDrag(event: MouseEvent, line: Line, type: 'start' | 'end' | 'continue' | 'continue-top'): void {
    if (!this.canEditDocument || this.barTextEditingId !== null) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === line.docPageLineIndex);
    if (lineIndex === -1) return;

    // Record undo state before dragging bar text
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
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
    
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
    document.body.classList.remove('ew-resize-cursor');
    
    this.pageUpdate.emit([...this.page]);
    
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
    if (!this.canEditDocument) return;
    
    const lineId = line.docPageLineIndex;
    
    if (event.shiftKey && this.lastSelectedIndex !== null) {
      // Shift + click for range selection
      this.selectedLineIds = [];
      const startIndex = Math.min(this.lastSelectedIndex, lineId);
      const endIndex = Math.max(this.lastSelectedIndex, lineId);
      
      for (let i = startIndex; i <= endIndex; i++) {
        if (this.page[i] && this.page[i].docPageLineIndex !== undefined) {
          this.selectedLineIds.push(this.page[i].docPageLineIndex);
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

  clearSelection(): void {
    // Clear selection state
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.lineSelected.emit(null);

    // Clear editing state if not currently editing
    if (this.editingLine === null) {
      this.editingText = '';
    }

    // Update selection state for all lines
    this.page.forEach(l => {
      l.multipleSelected = false;
    });

    this.cdRef.detectChanges();
  }

  // ============= CONTEXT MENU METHODS =============

  openContextMenu(event: MouseEvent, line: any, lineIndex: number): void {
    event.preventDefault();
    
    // Only show context menu if we have selected lines
    if (this.selectedLineIds.length === 0) {
      this.clearSelection();
      return;
    }

    this.showContextMenu = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedLine = line;
    this.selectedLineIndex = lineIndex;
  }

  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  changeLineCategory(event: Event, category: string, xPos: string, line: any, lineIndex: number): void {
    event.stopPropagation();
    this.showContextMenu = false;
    
    // Get all selected lines
    const selectedLines = this.selectedLineIds.map(lineId => {
      const line = this.page[lineId];
      return { line, lineIndex: lineId };
    });

    // Record undo state for each selected line
    selectedLines.forEach(({ line, lineIndex }) => {
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        line,
        `Change category: ${line.category} → ${category}`
      );
    });
    
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
    // Check if click is on a line element
    const clickedLine = (event.target as HTMLElement).closest('li');
    if (!clickedLine) {
      this.showContextMenu = false;
      return;
    }

    // Get the line index from the clicked element
    const lineId = parseInt(clickedLine.id);
    const line = this.page[lineId];
    
    if (line) {
      this.openContextMenu(event, line, lineId);
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

  onDoubleClick(index: number, text: string): void {
    // Find the line using docPageLineIndex
    const line = this.page[index];
    if (!line || !this.isLineSelected(line)) return;
    
    // Record undo state before editing
    this.undoService.recordLineChange(
      this.currentPageIndex,
      index,
      line,
      `Edit line text: "${text}"`
    );
    
    this.editingLine = index;
    this.editingText = text;
    
    // Force immediate UI update
    this.pageUpdate.emit([...this.page]);
    
    // Focus the line element after the UI has updated
    setTimeout(() => {
      const lineElement = document.getElementById(line.docPageLineIndex.toString());
      if (lineElement) {
        lineElement.focus();
        // Place cursor at the end of the text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(lineElement);
        range.collapse(false); // false means collapse to end
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
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
      const line = this.page[this.editingLine];
      if (!line) return;

      // Record undo state
      this.undoService.recordLineChange(
        this.currentPageIndex,
        this.editingLine,
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
        this.pdfService.updateLine(this.currentPageIndex, this.editingLine, {
          ...line,
          text: this.editingText
        });
        
        // Clean up editing state
        this.editingLine = null;
        this.editingText = '';
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
      
      // Record undo for each line BEFORE making changes
      selectedLines.forEach(({ line, lineIndex }) => {
        this.undoService.recordLineChange(
          this.currentPageIndex,
          lineIndex,
          line,
          `Toggle visibility: ${line.visible} (batch operation)`
        );
      });
      
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
    this.undoService.undo();
    // That's it! PdfService will update and trigger component refresh automatically
    console.log('[UNDO] Undo performed');
  }
  
  performRedo(): void {
    this.undoService.redo();
    // That's it! PdfService will update and trigger component refresh automatically
    console.log('[UNDO] Redo performed');
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
      this.pdfService.updateSceneNumber(line, newSceneNumber).subscribe(
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

 
  
}