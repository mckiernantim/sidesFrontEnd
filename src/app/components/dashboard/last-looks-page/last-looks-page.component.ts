import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CdkDragStart, CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { UndoStackItem } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { PdfService } from 'src/app/services/pdf/pdf.service';

// Add interface for drag reference
interface DragReference {
  x: number;
  y: number;
}

// Add interface for initial positions
interface InitialPositions {
  barY: number;
  mouseY: number;
}

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
  mouseEvent: any;
  classificationChoices: string[] = [
    'scene-header',
    'action',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'general'
  ];
  
  // Predefined category presets with positions
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
  changesMade:boolean = false;
  // Replace the drag selection properties with shift-click properties
  lastSelectedIndex: number | null = null;

  // Add a property to track the line being edited
  editingLineId: number | null = null;
  editingText: string = '';

  editingLine: number | null = null;

  // Add properties for debounced updates
  private dragUpdateSubject = new Subject<{line: Line, newPosition: {x: string, y: string}}>();
  private dragUpdateSubscription: Subscription;
  private finalDocumentDataSubscription: Subscription;

  // Add these methods to handle end span dragging
  originalPosition: { x: string; y: string } | null = null;

  // Add these properties to track text editing for bars
  barTextEditingId: number | null = null;
  barTextEditingType: 'start' | 'end' | 'continue' | 'continue-top' | null = null;
  barTextEditingContent: string = '';

  // Add methods to handle text editing for bar spans
  onBarTextDoubleClick(event: MouseEvent, line: Line, type: 'start' | 'end' | 'continue' | 'continue-top'): void {
    // Only allow editing in edit mode
    if (!this.canEditDocument) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    // Set editing state
    this.barTextEditingId = line.index;
    this.barTextEditingType = type;
    
    // Set initial content based on type
    switch (type) {
      case 'start':
        this.barTextEditingContent = `START ${line.sceneNumberText || ''}`;
        break;
      case 'end':
        this.barTextEditingContent = `END ${line.sceneNumberText || ''}`;
        break;
      case 'continue':
        this.barTextEditingContent = `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`;
        break;
      case 'continue-top':
        this.barTextEditingContent = `↓↓↓ ${line.sceneNumberText || ''} CONTINUED ↓↓↓`;
        break;
    }
    
    // Force update
    this.cdRef.detectChanges();
    
    // Focus the editable element
    setTimeout(() => {
      const editableElement = document.getElementById(`bar-text-edit-${line.index}-${type}`);
      if (editableElement) {
        editableElement.focus();
        // Select all text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableElement);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }

  // Handle bar text changes
  onBarTextChange(event: Event, line: Line): void {
    const target = event.target as HTMLElement;
    this.barTextEditingContent = target.textContent || '';
  }

  // Save bar text edits
  saveBarTextEdit(): void {
    if (this.barTextEditingId === null || this.barTextEditingType === null) return;
    
    // Find the line
    const lineIndex = this.page.findIndex(line => line.index === this.barTextEditingId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    // Extract scene number from the edited text
    let sceneNumber = '';
    const text = this.barTextEditingContent;
    
    // Try to extract scene number based on the bar type
    if (this.barTextEditingType === 'start' || this.barTextEditingType === 'end') {
      // For START and END bars, the format is typically "START/END X" where X is the scene number
      const parts = text.split(' ');
      if (parts.length > 1) {
        sceneNumber = parts.slice(1).join(' ').trim();
      }
    } else if (this.barTextEditingType === 'continue' || this.barTextEditingType === 'continue-top') {
      // For CONTINUE bars, the format might be "↓↓↓ X CONTINUED ↓↓↓" where X is the scene number
      const match = text.match(/↓↓↓\s+(.*?)\s+CONTINUED\s+↓↓↓/);
      if (match && match[1]) {
        sceneNumber = match[1].trim();
      }
    }
    
    // Store the custom text based on type
    switch (this.barTextEditingType) {
      case 'start':
        line.customStartText = text;
        break;
      case 'end':
        line.customEndText = text;
        break;
      case 'continue':
        line.customContinueText = text;
        break;
      case 'continue-top':
        line.customContinueTopText = text;
        break;
    }
    
    // If we extracted a scene number and it's different from the current one, update it
    if (sceneNumber && sceneNumber !== line.sceneNumberText) {
      const oldSceneNumber = line.sceneNumberText;
      // Update the scene number for this line
      line.sceneNumberText = sceneNumber;
      
      // Find and update all related scene headers with the same scene number
      this.updateRelatedSceneNumbers(line, sceneNumber);
      
      // Emit the change to update the document
      this.lineChanged.emit({
        line: line,
        property: 'sceneNumberText',
        value: sceneNumber,
        oldValue: oldSceneNumber // Add old value for updating CONTINUE bars
      });
    }
    
    // Reset editing state
    this.barTextEditingId = null;
    this.barTextEditingType = null;
    this.barTextEditingContent = '';
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Add a new method to update related scene numbers
  updateRelatedSceneNumbers(line: Line, newSceneNumber: string): void {
    // Find the scene header for this line
    const sceneHeader = this.findSceneHeaderForLine(line);
    
    if (sceneHeader) {
      // Update the scene header's scene number
      sceneHeader.sceneNumberText = newSceneNumber;
      
      // Update all bars in the same scene
      this.page.forEach(l => {
        if (l.sceneNumberText === line.sceneNumberText) {
          l.sceneNumberText = newSceneNumber;
        }
      });
      
      // Emit the change for the scene header
      this.lineChanged.emit({
        line: sceneHeader,
        property: 'sceneNumberText',
        value: newSceneNumber
      });
    }
  }

  // Add a helper method to find the scene header for a line
  findSceneHeaderForLine(line: Line): Line | null {
    // If this is already a scene header, return it
    if (line.category === 'scene-header') {
      return line;
    }
    
    // Find the closest scene header above this line
    let sceneHeader = null;
    for (let i = 0; i < this.page.length; i++) {
      const currentLine = this.page[i];
      if (currentLine.category === 'scene-header') {
        sceneHeader = currentLine;
      }
      
      if (currentLine === line) {
        break;
      }
    }
    
    return sceneHeader;
  }

  // Cancel bar text edits
  cancelBarTextEdit(): void {
    this.barTextEditingId = null;
    this.barTextEditingType = null;
    this.barTextEditingContent = '';
    
    // Force update
    this.cdRef.detectChanges();
  }

  // Handle key events for bar text editing
  handleBarTextKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveBarTextEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelBarTextEdit();
    }
  }

  // Add these properties for horizontal dragging
  barTextDragging: boolean = false;
  barTextDragStartX: number = 0;
  barTextDragLineId: number | null = null;
  barTextDragType: 'start' | 'end' | 'continue' | 'continue-top' | null = null;
  barTextInitialOffset: number = 0;

  // Start horizontal dragging of bar text
  startBarTextDrag(event: MouseEvent, line: Line, type: 'start' | 'end' | 'continue' | 'continue-top'): void {
    // Only allow dragging in edit mode
    if (!this.canEditDocument || this.barTextEditingId !== null) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    this.barTextDragging = true;
    this.barTextDragStartX = event.clientX;
    this.barTextDragLineId = line.index;
    this.barTextDragType = type;
    
    // Get initial offset
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
    
    // Add event listeners
    document.addEventListener('mousemove', this.moveBarText);
    document.addEventListener('mouseup', this.endBarTextDrag);
    
    // Add dragging cursor
    document.body.classList.add('ew-resize-cursor');
  }

  // Move bar text horizontally
  moveBarText = (event: MouseEvent): void => {
    if (!this.barTextDragging) return;
    
    const deltaX = event.clientX - this.barTextDragStartX;
    const newOffset = this.barTextInitialOffset + deltaX;
    
    // Find the line
    const lineIndex = this.page.findIndex(line => line.index === this.barTextDragLineId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    console.log('Drag state:', {
      dragging: this.barTextDragging,
      type: this.barTextDragType,
      startX: this.barTextDragStartX,
      currentX: event.clientX,
      deltaX,
      initialOffset: this.barTextInitialOffset,
      newOffset
    });
    
    // Update offset based on type
    switch (this.barTextDragType) {
      case 'start':
        line.startTextOffset = newOffset;
        break;
      case 'end':
        line.endTextOffset = newOffset;
        console.log('Updated END text offset:', line.endTextOffset);
        break;
      case 'continue':
        line.continueTextOffset = newOffset;
        break;
      case 'continue-top':
        line.continueTopTextOffset = newOffset;
        break;
    }
    
    // Force update
    this.cdRef.detectChanges();
    
    // Emit page update to ensure changes are persisted
    this.pageUpdate.emit([...this.page]);
  };

  // End bar text dragging
  endBarTextDrag = (event: MouseEvent): void => {
    if (!this.barTextDragging) return;
    
    // Remove event listeners
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
    
    // Remove dragging cursor
    document.body.classList.remove('ew-resize-cursor');
    
    // Find the line
    const lineIndex = this.page.findIndex(line => line.index === this.barTextDragLineId);
    if (lineIndex === -1) return;
    
    const line = this.page[lineIndex];
    
    // Emit the update
    this.pageUpdate.emit([...this.page]);
    
    // Clear dragging state
    this.barTextDragging = false;
    this.barTextDragLineId = null;
    this.barTextDragType = null;
  };

  constructor(
    private undoService: UndoService,
    private cdRef: ChangeDetectorRef,
    private pdfService: PdfService
  ) {
    // Subscribe to undo changes
    this.undoService.change$.subscribe(change => {
      if (change && change.pageIndex === this.currentPageIndex) {
        this.handleUndoChange(change);
      }
    });
    
    // Set up debounced drag updates
    this.setupDragUpdateDebounce();
  }

  ngOnInit(): void {
    if (this.editMode) {
      this.canEditDocument = true;
      this.makeEndSceneLinesEditable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editMode']) {
      this.canEditDocument = changes['editMode'].currentValue;
      if (this.canEditDocument) {
        this.makeEndSceneLinesEditable();
      }
    }

    // Handle page changes
    if (changes['page']) {
      this.processPageUpdates(changes['page'].currentValue);
    }
  }

  private processPageUpdates(newPage: any[]): void {
    if (!newPage) return;

    // Update any scene headers in the page
    newPage.forEach(line => {
      if (line.category === 'scene-header') {
        // Find the corresponding line in the current page
        const currentLine = this.page.find(l => l.index === line.index);
        if (currentLine) {
          // Update scene number and text if they've changed
          if (currentLine.sceneNumberText !== line.sceneNumberText) {
            currentLine.sceneNumberText = line.sceneNumberText;
          }
          if (currentLine.text !== line.text) {
            currentLine.text = line.text;
          }
        }
      }
    });

    // Force change detection
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.dragUpdateSubscription) {
      this.dragUpdateSubscription.unsubscribe();
    }
    
    // Clean up event listeners
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
  }

  isSelectedLine(line: any, index: number): boolean {
    if (!this.selectedLine) return false;
    return this.selectedLine.index === line.index;
  }

  onLineChange(line: any, lineIndex: number, newText: string, property: string): void {
    this.lineChanged.emit({
      line,
      lineIndex,
      newText,
      property
    });
  }

  // Handle drag start
  onDragStarted(event: CdkDragStart, line: Line): void {
    // Store current position for undo functionality and for drag calculations
    line._originalPosition = {
      x: line.calculatedXpos,
      y: line.end === 'END' ? line.calculatedEnd : line.calculatedYpos
    };
    
    // Select the line if not already selected
    if (!this.selectedLineIds.includes(line.index)) {
      this.selectedLineIds = [line.index];
      this.lastSelectedIndex = this.page.findIndex(l => l.index === line.index);
      this.emitSelectedLines();
    }
    
    // Emit the line for drag operations
    this.lineSelected.emit(line);
    
    // Clear any existing drag updates
    this.dragUpdateSubject.next(null);
  }

  // Handle drag end
  onDragEnded(event: CdkDragEnd, line: Line, lineIndex: number): void {
    // Get the drag distance
    const dragX = event.distance.x;
    const dragY = -event.distance.y; // Invert Y since your coordinate system is bottom-based
    
    // Parse current positions (removing 'px')
    const currentX = parseFloat(line._originalPosition.x);
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new positions
    const newX = Math.max(0, currentX + dragX); // Ensure we don't go below 0
    const newY = Math.max(0, currentY + dragY); // Ensure we don't go below 0
    
    // Format as pixel values
    const newXPx = newX + 'px';
    const newYPx = newY + 'px';
    
    // Record the change for undo
    this.undoService.push({
        pageIndex: this.currentPageIndex,
        line: line,
        type: 'position',
        originalPosition: {
            x: line._originalPosition.x,
            y: line._originalPosition.y
        }
    });
    
    // Update line positions (final update)
    if (line.end === 'END') {
      line.calculatedEnd = newYPx;
      line.endY = parseFloat(newYPx);
    } else {
      line.calculatedXpos = newXPx;
      line.calculatedYpos = newYPx;
    }
    
    // Emit position change event with the final position
    this.positionChanged.emit({
        line,
        lineIndex,
        newPosition: { x: newXPx, y: newYPx },
        originalPosition: line._originalPosition,
        isEndSpan: line.end === 'END'
    });
    
    // Emit page update to ensure changes are persisted
    this.pageUpdate.emit([...this.page]);
    
    // Clean up temporary property
    delete line._originalPosition;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Open context menu
  openContextMenu(event: MouseEvent, line: any, lineIndex: number): void {
    event.preventDefault();
    this.showContextMenu = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedLine = line;
    this.selectedLineIndex = lineIndex;
    this.lineSelected.emit(line);
  }

  // Close context menu
  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  // Change line category with optional position update
  changeLineCategory(event: Event, category: string, xPos: string, line: any, lineIndex: number): void {
    event.stopPropagation();
    this.showContextMenu = false;
    
    // Store original values for undo
    const originalCategory = line.category;
    const originalXPos = line.calculatedXpos;
    
    // Record the change for undo
    this.undoService.push({
      pageIndex: this.currentPageIndex,
      line: line,
      type: 'category',
      originalCategory: originalCategory,
      originalPosition: {
        x: originalXPos,
        y: line.calculatedYpos
      }
    });
    
    // Update category
    line.category = category;
    
    // Update position if provided and not deleting
    if (xPos && category !== 'hidden') {
      line.calculatedXpos = xPos;
    }
    
    // Emit category change event
    this.categoryChanged.emit({
      line,
      lineIndex,
      category
    });
  }

  onProceedToCheckout(): void {
    this.proceedToCheckout.emit();
  }

  // Update the selectLine method to properly handle shift selection
  selectLine(line: Line, event: MouseEvent): void {
    // Only allow selection in edit mode
    if (!this.canEditDocument) {
      return;
    }
    
    const lineId = line.index;
    const currentIndex = this.page.findIndex(l => l.index === lineId);
    
    // Handle shift key for range selection
    if (event.shiftKey && this.lastSelectedIndex !== null) {
      // Clear previous selection
      this.selectedLineIds = [];
      
      // Determine the range boundaries
      const startIndex = Math.min(this.lastSelectedIndex, currentIndex);
      const endIndex = Math.max(this.lastSelectedIndex, currentIndex);
      
      // Select all lines in the range
      for (let i = startIndex; i <= endIndex; i++) {
        if (this.page[i] && this.page[i].index !== undefined) {
          this.selectedLineIds.push(this.page[i].index);
        }
      }
      
      console.log(`Shift-selected ${this.selectedLineIds.length} lines from index ${startIndex} to ${endIndex}`);
    } 
    // Handle ctrl/cmd key for multi-selection
    else if (event.ctrlKey || event.metaKey) {
      const index = this.selectedLineIds.indexOf(lineId);
      if (index === -1) {
        // Add to selection
        this.selectedLineIds.push(lineId);
      } else {
        // Remove from selection
        this.selectedLineIds.splice(index, 1);
      }
      this.lastSelectedIndex = currentIndex;
    } 
    // Regular single selection
    else {
      this.selectedLineIds = [lineId];
      this.lastSelectedIndex = currentIndex;
    }
    
    // Mark the line as selected for the parent component
    line.multipleSelected = this.selectedLineIds.length > 1;
    
    // Emit the selected line(s)
    this.emitSelectedLines();
  }

  // Improve the emitSelectedLines method
  private emitSelectedLines() {
    // If no lines are selected, emit null
    if (this.selectedLineIds.length === 0) {
      this.lineSelected.emit(null);
      return;
    }
    
    // If only one line is selected, emit that line
    if (this.selectedLineIds.length === 1) {
      const selectedLine = this.page.find(line => line.index === this.selectedLineIds[0]);
      this.lineSelected.emit(selectedLine);
      return;
    }
    
    // If multiple lines are selected, emit the first line with a flag
    const primaryLine = this.page.find(line => line.index === this.selectedLineIds[0]);
    if (primaryLine) {
      primaryLine.multipleSelected = true;
      primaryLine.selectedCount = this.selectedLineIds.length;
      this.lineSelected.emit(primaryLine);
    }
  }

  // Update the isLineSelected method to check for edit mode
  isLineSelected(line: Line): boolean {
    // Only show selection in edit mode
    if (!this.canEditDocument) {
      return false;
    }
    
    return this.selectedLineIds.includes(line.index);
  }

  // Update the handleUndoChange method to handle all types of changes including scene number changes
  private handleUndoChange(change: UndoStackItem): void {
    const { line, type } = change;
    
    // Handle batch crossOut changes
    if ((type as string) === 'batchCrossOut') {
      const originalStates = (change as any).originalStates || [];
      
      // Restore original crossed out state for each line
      originalStates.forEach(state => {
        const lineIndex = this.page.findIndex(l => l.index === state.line.index);
        if (lineIndex !== -1) {
          (this.page[lineIndex] as any).crossedOut = state.originalCrossedOut;
        }
      });
      
      // Emit the updated page
      this.pageUpdate.emit(this.page);
      return;
    }
    
    // Handle scene number changes
    if ((type as string) === 'scene-number') {
      if (change.originalSceneNumber && change.affectedLines) {
        // Restore the original scene number to all affected lines
        const originalSceneNumber = change.originalSceneNumber;
        const newSceneNumber = change.newSceneNumber;
        
        this.page.forEach(line => {
          // Check if this line was affected by the scene number change
          const wasAffected = change.affectedLines?.some(
            affectedLine => affectedLine.index === line.index
          );
          
          if (wasAffected) {
            // Restore the main scene number
            if (line.sceneNumberText === newSceneNumber) {
              line.sceneNumberText = originalSceneNumber;
            }
            
            // Restore any custom bar texts that were updated
            if (line.customStartText && line.customStartText.includes(newSceneNumber)) {
              line.customStartText = line.customStartText.replace(newSceneNumber, originalSceneNumber);
            }
            
            if (line.customEndText && line.customEndText.includes(newSceneNumber)) {
              line.customEndText = line.customEndText.replace(newSceneNumber, originalSceneNumber);
            }
            
            if (line.customContinueText && line.customContinueText.includes(newSceneNumber)) {
              line.customContinueText = line.customContinueText.replace(newSceneNumber, originalSceneNumber);
            }
            
            if (line.customContinueTopText && line.customContinueTopText.includes(newSceneNumber)) {
              line.customContinueTopText = line.customContinueTopText.replace(newSceneNumber, originalSceneNumber);
            }
          }
        });
        
        // Emit the updated page
        this.pageUpdate.emit(this.page);
        return;
      }
    }
    
    // Find the line in the current page
    const lineIndex = this.page.findIndex(l => l.index === line.index);
    if (lineIndex === -1) return;
    
    // Apply the appropriate undo action based on change type
    switch (type as string) { // Cast to string to avoid type errors
      case 'visibility':
        if (change.originalVisibility) {
          this.page[lineIndex].visible = change.originalVisibility;
        }
        break;
        
      case 'position':
        if (change.originalPosition) {
          this.page[lineIndex].calculatedXpos = change.originalPosition.x;
          this.page[lineIndex].calculatedYpos = change.originalPosition.y;
        }
        break;
        
      case 'category':
        if (change.originalCategory) {
          this.page[lineIndex].category = change.originalCategory;
        }
        break;
        
      case 'text':
        if (change.originalText) {
          this.page[lineIndex].text = change.originalText;
        }
        break;
        
      case 'crossOut':
        if ((change as any).originalCrossedOut !== undefined) {
          (this.page[lineIndex] as any).crossedOut = (change as any).originalCrossedOut;
        }
        break;
    }
    
    // Emit the updated page
    this.pageUpdate.emit(this.page);
  }

  // Update the resetPage method
  resetPage(newPage: Line[]) {
    console.log('Resetting page with new data:', newPage.length);
    this.page = [...newPage];
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.selectedLine = null;
    
    // Force change detection
    setTimeout(() => {
      // This will trigger change detection
    }, 0);
  }

  // Update the onDoubleClick method to use the new indexing
  onDoubleClick(index: number, text: string): void {
    // Find the line using the new indexing properties
    const line = this.page.find(l => l.docPageLineIndex === index);
    if (!line) return;
    
    this.editingLine = index;
    this.editingText = text;
    
    // Force immediate UI update
    this.pageUpdate.emit([...this.page]);
    
    // Focus the line element after the UI has updated
    setTimeout(() => {
      const lineElement = document.getElementById(line.index.toString());
      if (lineElement) {
        lineElement.focus();
        // Place cursor at the end of the text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(lineElement);
        range.collapse(false); // false means collapse to end
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }

  // Update the onEditTextChange method to use the new indexing
  onEditTextChange(newText: string): void {
    if (this.editingLine !== null) {
      // Find the line using the new indexing properties
      const line = this.page.find(l => l.docPageLineIndex === this.editingLine);
      if (!line) return;
      
      // Update the editingText state
      this.editingText = newText;
      
      // Create a copy of the page
      const updatedPage = [...this.page];
      
      // Temporarily update the text for preview
      const originalText = line.text;
      line.text = newText;
      
      // Store the original text for restoration when saving/canceling
      if (!line._originalText) {
        line._originalText = originalText;
      }
    }
  }

  // Update the saveEdit method to use the new indexing
  saveEdit(): void {
    if (this.editingLine !== null) {
      // Find the line using the new indexing properties
      const line = this.page.find(l => l.docPageLineIndex === this.editingLine);
      if (!line) return;
      
      const originalText = line._originalText || line.text;
      
      // Only record undo if text actually changed from original
      if (originalText !== this.editingText) {
        // Record the change for undo
        this.undoService.push({
          pageIndex: this.currentPageIndex,
          line: line,
          type: 'text',
          originalText: originalText
        });
        
        // Emit change
        this.lineChanged.emit({
          line,
          lineIndex: this.editingLine,
          newText: this.editingText,
          property: 'text'
        });
      }
      
      // Update the text (already updated in view)
      line.text = this.editingText;
      
      // Clean up temporary property
      delete line._originalText;
      
      // Clear editing state
      this.editingLine = null;
      this.editingText = '';
      
      // Force final update
      this.pageUpdate.emit([...this.page]);
    }
  }
  
  // Update the cancelEdit method to use the new indexing
  cancelEdit(): void {
    if (this.editingLine !== null) {
      // Find the line using the new indexing properties
      const line = this.page.find(l => l.docPageLineIndex === this.editingLine);
      if (!line) return;
      
      // Restore original text if we have it
      if (line._originalText) {
        line.text = line._originalText;
        delete line._originalText;
      }
      
      // Clear editing state
      this.editingLine = null;
      this.editingText = '';
      
      // Force update
      this.pageUpdate.emit([...this.page]);
    }
  }

  // Update the handleEditKeyDown method to use the new indexing
  handleEditKeyDown(event: KeyboardEvent, line: Line): void {
    if (event.key === 'Enter') {
      // Save on Enter
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape') {
      // Cancel on Escape
      event.preventDefault();
      this.cancelEdit();
    }
  }

  // Improved drag move handler with boundary constraints
  onDragMoved(event: CdkDragMove, line: Line): void {
    // Get page container dimensions and position
    const pageElement = document.querySelector('.page') as HTMLElement;
    if (!pageElement) return;
    
    const pageRect = pageElement.getBoundingClientRect();
    const pageLeft = pageRect.left;
    const pageRight = pageRect.right;
    const pageTop = pageRect.top;
    const pageBottom = pageRect.bottom;
    
    // Calculate the new position based on the drag delta
    const dragX = event.distance.x;
    const dragY = -event.distance.y; // Invert Y since your coordinate system is bottom-based
    
    // Parse original positions (removing 'px')
    const currentX = parseFloat(line._originalPosition.x);
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new positions
    let newX = currentX + dragX;
    let newY = currentY + dragY;
    
    // Get the line element to determine its dimensions
    const lineElement = document.getElementById(line.index.toString()) as HTMLElement;
    if (lineElement) {
        const lineRect = lineElement.getBoundingClientRect();
        const lineWidth = lineRect.width;
        const lineHeight = lineRect.height;
        
        // Calculate the absolute position of the line in the page
        const absoluteX = pageLeft + newX;
        const absoluteY = pageBottom - newY; // Convert from bottom-based to top-based
        
        // Constrain X position to keep the line within the page
        if (absoluteX < pageLeft) {
            newX = 0; // Left edge of page
        } else if (absoluteX + lineWidth > pageRight) {
            newX = pageRect.width - lineWidth; // Right edge of page
        }
        
        // Constrain Y position to keep the line within the page
        if (absoluteY < pageTop) {
            newY = pageRect.height; // Top edge of page (remember Y is bottom-based)
        } else if (absoluteY + lineHeight > pageBottom) {
            newY = lineHeight; // Bottom edge of page
        }
    }
    
    // Format as pixel values
    const newXPx = newX + 'px';
    const newYPx = newY + 'px';
    
    // Update the position directly for immediate visual feedback only
    if (line.end === 'END') {
      line.calculatedEnd = newYPx;
    } else {
      line.calculatedXpos = newXPx;
      line.calculatedYpos = newYPx;
    }
    
    // Force change detection for this line only
    this.cdRef.detectChanges();
  }

  // Add a method to handle END scene lines
  makeEndSceneLinesEditable(): void {
    // Find all end scene spans and make them draggable
    setTimeout(() => {
      const endSceneSpans = document.querySelectorAll('.end-span');
      
      endSceneSpans.forEach(span => {
        // Add necessary classes and attributes
        span.classList.add('draggable-end');
      });
    }, 100);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Remove the custom drag handler event listener
    // const span = event.target as HTMLElement;
    // if (span.classList.contains('END')) {
    //   span.addEventListener('mousedown', this.startEndSpanDrag.bind(this));
    // }
  }

  // Fix the crossOutLine method to use type assertions
  crossOutLine(line: Line, lineIndex: number): void {
    // Store original state for undo
    const originalCrossedOut = (line as any).crossedOut || false;
    
    // Record the change for undo
    this.undoService.push({
      pageIndex: this.currentPageIndex,
      line: line,
      type: 'crossOut' as any, // Type assertion to avoid type error
      originalCrossedOut: originalCrossedOut
    } as any); // Type assertion for the whole object
    
    // Toggle the crossed out state
    (line as any).crossedOut = !originalCrossedOut;
    
    // Emit the change
    this.lineChanged.emit({
      line,
      lineIndex,
      newValue: (line as any).crossedOut,
      property: 'crossedOut'
    });
    
    // Force update
    this.pageUpdate.emit([...this.page]);
  }

  // Update the handleKeyDown method to better handle X key
  handleKeyDown(event: KeyboardEvent, line: Line, lineIndex: number): void {
    // If we're editing, use the edit-specific handler
    if (this.editingLine === lineIndex) {
      this.handleEditKeyDown(event, line);
      return;
    }
    
    // Handle X key to cross out the line(s)
    if (event.key === 'x' || event.key === 'X') {
      console.log('X key pressed for line:', line.index);
      event.preventDefault();
      event.stopPropagation();
      
      // If this line is part of a multi-selection, cross out all selected lines
      if (this.selectedLineIds.length > 1 && this.selectedLineIds.includes(line.index)) {
        console.log('Crossing out multiple lines:', this.selectedLineIds);
        // Cross out all selected lines
        this.crossOutSelectedLines();
      } else {
        console.log('Crossing out single line:', line.index);
        // Cross out just this line
        this.crossOutLine(line, lineIndex);
      }
    }
  }

  // Add a method to cross out all selected lines
  crossOutSelectedLines(): void {
    // Get all selected lines
    const selectedLines = this.page.filter(line => 
      this.selectedLineIds.includes(line.index)
    );
    
    // Store original states for undo as a batch
    const originalStates = selectedLines.map(line => ({
      line: line,
      originalCrossedOut: (line as any).crossedOut || false
    }));
    
    // Record the change for undo (as a batch operation)
    this.undoService.push({
      pageIndex: this.currentPageIndex,
      type: 'batchCrossOut' as any,
      originalStates: originalStates
    } as any);
    
    // Toggle the crossed out state for each line
    selectedLines.forEach(line => {
      const lineIndex = this.page.findIndex(l => l.index === line.index);
      const originalCrossedOut = (line as any).crossedOut || false;
      
      // Toggle the crossed out state
      (line as any).crossedOut = !originalCrossedOut;
      
      // Emit the change for each line
      this.lineChanged.emit({
        line,
        lineIndex,
        newValue: (line as any).crossedOut,
        property: 'crossedOut'
      });
    });
    
    // Force update
    this.pageUpdate.emit([...this.page]);
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    // Only process if we're in edit mode and not currently editing text
    if (!this.canEditDocument || this.editingLine !== null) {
      return;
    }
    
    // Handle X key to toggle visibility of selected lines
    if (event.key === 'x' || event.key === 'X') {
      console.log('Global X key pressed');
      event.preventDefault();
      
      // Check if we have any selected lines
      if (this.selectedLineIds.length > 0) {
        console.log('Processing selected lines:', this.selectedLineIds);
        
        // Select the first line to trigger the parent's toggleVisibility method
        const lineIndex = this.page.findIndex(line => line.index === this.selectedLineIds[0]);
        if (lineIndex !== -1) {
          const line = this.page[lineIndex];
          
          // Set the line as selected
          this.selectedLine = line;
          
          // Emit the selected line to the parent
          this.lineSelected.emit(line);
          
          // Emit a specific event to trigger visibility toggle
          this.toggleVisibilityRequest.emit();
          
          // Force update the view
          this.pageUpdate.emit([...this.page]);
        }
      }
    }
  }

  // Handle continue span dragging
  onContinueSpanDragStarted(event: CdkDragStart, line: Line): void {
    // Store original position for undo
    line._originalPosition = {
      x: line.calculatedXpos,
      y: '900px' // Hardcode initial position
    };
    
    // Select the line
    this.lineSelected.emit(line);
    
    // Add cursor class
    document.body.classList.add('grab-cursor');
  }

  onContinueSpanDragMoved(event: CdkDragMove, line: Line): void {
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position
    const newY = Math.max(0, currentY - dragY) + 'px';
    
    // Update line position during drag
    line.calculatedBarY = newY;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  onContinueSpanDragEnded(event: CdkDragEnd, line: Line, lineIndex: number): void {
    // Remove cursor class
    document.body.classList.remove('grab-cursor');
    
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position with bounds checking
    const newY = Math.max(0, currentY - dragY) + 'px';
    
    // Record the change for undo
    this.undoService.push({
      pageIndex: this.currentPageIndex,
      line: line,
      type: 'position',
      originalPosition: {
        x: line._originalPosition.x,
        y: line._originalPosition.y
      }
    });
    
    // Update the line position
    line.calculatedBarY = newY;
    line.barY = parseFloat(newY); // Store the raw value for persistence
    
    // Emit position change event with the final position
    this.positionChanged.emit({
      line,
      lineIndex,
      newPosition: { x: line.calculatedXpos, y: newY },
      originalPosition: line._originalPosition,
      isContinueSpan: true
    });
    
    // Reset drag transform
    event.source.reset();
    
    // Clean up temporary property
    delete line._originalPosition;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Handle start span dragging
  onStartSpanDragStarted(event: CdkDragStart, line: Line): void {
    // Store original position for undo
    line._originalPosition = {
      x: line.calculatedXpos,
      y: typeof line.calculatedYpos === 'string' ? line.calculatedYpos : line.calculatedYpos + 'px'
    };
    
    // Select the line
    this.lineSelected.emit(line);
    
    // Add cursor class
    document.body.classList.add('grab-cursor');
  }

  onStartSpanDragMoved(event: CdkDragMove, line: Line): void {
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position
    const newY = Math.max(0, currentY - dragY) + 'px';
    
    // Update line position during drag
    line.calculatedYpos = newY;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  onStartSpanDragEnded(event: CdkDragEnd, line: Line, lineIndex: number): void {
    // Remove cursor class
    document.body.classList.remove('grab-cursor');
    
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position with bounds checking
    const newY = Math.max(0, currentY - dragY) + 'px';
    
    // Record the change for undo
    this.undoService.push({
      pageIndex: this.currentPageIndex,
      line: line,
      type: 'position',
      originalPosition: {
        x: line._originalPosition.x,
        y: line._originalPosition.y
      }
    });
    
    // Update the line position
    line.calculatedYpos = newY;
    line.yPos = parseFloat(newY); // Store the raw value for persistence
    
    // Emit position change event with the final position
    this.positionChanged.emit({
      line,
      lineIndex,
      newPosition: { x: line.calculatedXpos, y: newY },
      originalPosition: line._originalPosition,
      isStartSpan: true
    });
    
    // Reset drag transform
    event.source.reset();
    
    // Clean up temporary property
    delete line._originalPosition;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Handle end span dragging
  onEndSpanDragStarted(event: CdkDragStart, line: Line): void {
    // Store current position for undo functionality and for drag calculations
    line._originalPosition = {
        x: line.calculatedXpos,
        y: String(line.calculatedEnd)  // Convert to string to match type
    };
    
    // Select the line if not already selected
    if (!this.selectedLineIds.includes(line.index)) {
        this.selectedLineIds = [line.index];
        this.lastSelectedIndex = this.page.findIndex(l => l.index === line.index);
        this.emitSelectedLines();
    }
    
    // Emit the line for drag operations
    this.lineSelected.emit(line);
    
    // Clear any existing drag updates
    this.dragUpdateSubject.next(null);
  }

  onEndSpanDragMoved(event: CdkDragMove, line: Line): void {
    // Get the delta since last move (not cumulative)
    const deltaY = event.delta.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position using delta
    const newY = Math.max(0, currentY + deltaY);
    
    // Format as pixel value
    const newYPx = newY + 'px';
    
    // Update the position directly
    line.calculatedEnd = newYPx;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  onEndSpanDragEnded(event: CdkDragEnd, line: Line, lineIndex: number): void {
    // Get the drag distance
    const dragY = -event.distance.y; // Invert Y since coordinate system is bottom-based
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position with bounds checking
    const newY = Math.max(0, currentY + dragY) + 'px';
    
    // Record the change for undo
    this.undoService.push({
        pageIndex: this.currentPageIndex,
        line: line,
        type: 'position',
        originalPosition: {
            x: line._originalPosition.x,
            y: line._originalPosition.y
        }
    });
    
    // Update the line position
    line.calculatedEnd = newY;
    line.endY = parseFloat(newY); // Store the raw value for persistence
    
    // Emit position change event with the final position
    this.positionChanged.emit({
        line,
        lineIndex,
        newPosition: { x: line.calculatedXpos, y: newY },
        originalPosition: line._originalPosition,
        isEndSpan: true
    });
    
    // Clean up temporary property
    delete line._originalPosition;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  onContinueTopSpanDragStarted(event: CdkDragStart, line: Line): void {
    if (!this.canEditDocument) return;
    
    // Store original position for undo
    line._originalPosition = {
        x: line.calculatedXpos,
        y: typeof line.calculatedBarY === 'string' ? line.calculatedBarY : line.calculatedBarY + 'px'
    };
    
    // Select the line
    this.lineSelected.emit(line);
    
    // Add cursor class
    document.body.classList.add('grab-cursor');
  }

  onContinueTopSpanDragMoved(event: CdkDragMove, line: Line): void {
    if (!this.canEditDocument) return;
    
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position with bounds checking
    const newY = Math.max(0, currentY - dragY);
    
    // Update visual position only - don't trigger full document update
    line.calculatedBarY = newY + 'px';
    line.barY = newY;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  onContinueTopSpanDragEnded(event: CdkDragEnd, line: Line, lineIndex: number): void {
    if (!this.canEditDocument) return;
    
    // Remove cursor class
    document.body.classList.remove('grab-cursor');
    
    // Get the drag distance
    const dragY = event.distance.y;
    
    // Parse current position (removing 'px')
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new position with bounds checking
    const newY = Math.max(0, currentY - dragY);
    
    // Record the change for undo
    this.undoService.push({
        pageIndex: this.currentPageIndex,
        line: line,
        type: 'position',
        originalPosition: {
            x: line._originalPosition.x,
            y: line._originalPosition.y
        }
    });
    
    // Update the line position using updateLine - only at the end of drag
    this.pdfService.updateLine(line, {
        calculatedBarY: newY + 'px',
        barY: newY
    });
    
    // Emit position change event with the final position
    this.positionChanged.emit({
        line,
        lineIndex,
        newPosition: { x: line.calculatedXpos, y: newY + 'px' },
        originalPosition: line._originalPosition,
        isContinueTopSpan: true
    });
    
    // Reset drag transform
    event.source.reset();
    
    // Clean up temporary property
    delete line._originalPosition;
    
    // Force change detection
    this.cdRef.detectChanges();
  }

  // Add a method to clear selection
  clearSelection(): void {
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.lineSelected.emit(null);
  }

  // Add a debounce mechanism for drag operations
  private setupDragUpdateDebounce() {
    this.dragUpdateSubscription = this.dragUpdateSubject
      .pipe(debounceTime(16)) // ~60fps
      .subscribe(update => {
        // Process the update
        const { line, newPosition } = update;
        
        // Update the line position
        if (line && newPosition) {
          line.calculatedXpos = newPosition.x;
          line.calculatedYpos = newPosition.y;
          
          // Force change detection
          this.cdRef.detectChanges();
        }
      });
  }

  // Add these methods
  toggleInstructions(): void {
    this.showInstructions = !this.showInstructions;
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.pageChange.emit(this.currentPageIndex - 1);
    }
  }

  nextPage(): void {
    if (this.currentPageIndex < this.totalPages - 1) {
      this.pageChange.emit(this.currentPageIndex + 1);
    }
  }

  toggleBar(line: Line, barType: string): void {
    // Emit an event to the parent component to handle the bar toggle
    this.lineChanged.emit({
      line: line,
      property: 'toggleBar',
      value: barType
    });
  }

  // Make sure this property is declared
  showInstructions: boolean = false;

  // Add these properties to your component class
  editingSceneNumber: string | null = null;
  originalSceneNumber: string | null = null;

  /**
   * Start editing a scene number
   */
  startEditingSceneNumber(line: any): void {
    if (!this.canEditDocument) return;
    
    this.editingSceneNumber = line.sceneNumberText;
    this.originalSceneNumber = line.sceneNumberText;
    
    // Focus and select all text after a short delay to ensure contenteditable is active
    setTimeout(() => {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Find all elements with this scene number text
      const elements = document.querySelectorAll('.scene-number-left, .scene-number-right');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.textContent?.trim() === this.editingSceneNumber) {
          range.selectNodeContents(el);
          selection?.removeAllRanges();
          selection?.addRange(range);
          break; // Only need to select one of them
        }
      }
    }, 10);
  }

  /**
   * Handle keydown events in scene number editing
   */
  handleSceneNumberKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSceneNumberEdit();
    }
  }

  /**
   * Cancel scene number editing
   */
  cancelSceneNumberEdit(): void {
    // Reset all elements with this scene number back to original
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

  /**
   * Save scene number edit and update all related elements
   */
  saveSceneNumberEdit(triggerLine: any): void {
    if (!this.editingSceneNumber) return;
    
    // Get the new scene number from one of the edited elements
    const elements = document.querySelectorAll('.scene-number-left, .scene-number-right');
    let newSceneNumber = '';
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (el.textContent?.trim() === this.editingSceneNumber) {
        newSceneNumber = el.textContent?.trim() || '';
        break;
      }
    }
    
    if (newSceneNumber && newSceneNumber !== this.originalSceneNumber) {
      // Update all lines in the current page that have this scene number
      const sceneNumberToUpdate = this.originalSceneNumber;
      
      // First, record this change for undo functionality
      const affectedLines = this.page.filter(line => 
        line.sceneNumberText === sceneNumberToUpdate || 
        (line.customStartText && line.customStartText.includes(sceneNumberToUpdate)) ||
        (line.customEndText && line.customEndText.includes(sceneNumberToUpdate)) ||
        (line.customContinueText && line.customContinueText.includes(sceneNumberToUpdate)) ||
        (line.customContinueTopText && line.customContinueTopText.includes(sceneNumberToUpdate))
      );
      
      // Record the change for undo
      this.undoService.recordSceneNumberChange(
        this.currentPageIndex,
        affectedLines,
        sceneNumberToUpdate,
        newSceneNumber
      );
      
      // Update all matching lines in the page
      this.page.forEach(line => {
        // Update the main scene number
        if (line.sceneNumberText === sceneNumberToUpdate) {
          line.sceneNumberText = newSceneNumber;
        }
        
        // Update any custom bar texts that contain the scene number
        if (line.customStartText && line.customStartText.includes(sceneNumberToUpdate)) {
          line.customStartText = line.customStartText.replace(sceneNumberToUpdate, newSceneNumber);
        }
        
        if (line.customEndText && line.customEndText.includes(sceneNumberToUpdate)) {
          line.customEndText = line.customEndText.replace(sceneNumberToUpdate, newSceneNumber);
        }
        
        if (line.customContinueText && line.customContinueText.includes(sceneNumberToUpdate)) {
          line.customContinueText = line.customContinueText.replace(sceneNumberToUpdate, newSceneNumber);
        }
        
        if (line.customContinueTopText && line.customContinueTopText.includes(sceneNumberToUpdate)) {
          line.customContinueTopText = line.customContinueTopText.replace(sceneNumberToUpdate, newSceneNumber);
        }
      });
      
      // Emit the change to the parent component
      this.lineChanged.emit({
        line: triggerLine,
        property: 'sceneNumberText',
        value: newSceneNumber,
        oldValue: sceneNumberToUpdate,
        affectedLines: affectedLines
      });
      
      // Emit page update to parent components
      this.pageUpdate.emit([...this.page]);
      
      this.changesMade = true;
      
      // Force change detection
      this.cdRef.detectChanges();
    }
    
    // Reset editing state
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
  }

  // Update the handleUndo method to handle scene number changes
  handleUndo(): void {
    const lastChange = this.undoService.pop();
    if (!lastChange) return;
    
    // Handle the different types of changes
    switch (lastChange.type) {
      // ... existing cases
      
      case 'scene-number':
        if (lastChange.originalSceneNumber && lastChange.affectedLines) {
          // Restore the original scene number to all affected lines
          const originalSceneNumber = lastChange.originalSceneNumber;
          const newSceneNumber = lastChange.newSceneNumber;
          
          this.page.forEach(line => {
            // Check if this line was affected by the scene number change
            const wasAffected = lastChange.affectedLines?.some(
              affectedLine => affectedLine.index === line.index
            );
            
            if (wasAffected) {
              // Restore the main scene number
              if (line.sceneNumberText === newSceneNumber) {
                line.sceneNumberText = originalSceneNumber;
              }
              
              // Restore any custom bar texts that were updated
              if (line.customStartText && line.customStartText.includes(newSceneNumber)) {
                line.customStartText = line.customStartText.replace(newSceneNumber, originalSceneNumber);
              }
              
              if (line.customEndText && line.customEndText.includes(newSceneNumber)) {
                line.customEndText = line.customEndText.replace(newSceneNumber, originalSceneNumber);
              }
              
              if (line.customContinueText && line.customContinueText.includes(newSceneNumber)) {
                line.customContinueText = line.customContinueText.replace(newSceneNumber, originalSceneNumber);
              }
              
              if (line.customContinueTopText && line.customContinueTopText.includes(newSceneNumber)) {
                line.customContinueTopText = line.customContinueTopText.replace(newSceneNumber, originalSceneNumber);
              }
            }
          });
        }
        break;
    }
  }
}
