import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy } from '@angular/core';
import { CdkDragStart, CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { UndoStackItem } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
  @Output() lineChanged = new EventEmitter<any>();
  @Output() lineSelected = new EventEmitter<Line>();
  @Output() categoryChanged = new EventEmitter<any>();
  @Output() positionChanged = new EventEmitter<any>();
  @Output() pageUpdate = new EventEmitter<any[]>();
  @Output() proceedToCheckout = new EventEmitter<void>();
  @Output() toggleVisibilityRequest = new EventEmitter<void>();

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

  // Replace the drag selection properties with shift-click properties
  lastSelectedIndex: number | null = null;

  // Add a property to track the line being edited
  editingLineId: number | null = null;
  editingText: string = '';

  editingLine: number | null = null;

  // Add properties for debounced updates
  private dragUpdateSubject = new Subject<{line: Line, newPosition: {x: string, y: string}}>();
  private dragUpdateSubscription: Subscription;

  constructor(private undoService: UndoService) {
    // Subscribe to undo changes
    this.undoService.change$.subscribe(change => {
      if (change && change.pageIndex === this.currentPageIndex) {
        this.handleUndoChange(change);
      }
    });
    
    // Set up debounced drag updates
    this.dragUpdateSubscription = this.dragUpdateSubject.pipe(
      debounceTime(16) // ~60fps for smooth updates
    ).subscribe(update => {
      // Update the line position in the UI
      update.line.calculatedXpos = update.newPosition.x;
      update.line.calculatedYpos = update.newPosition.y;
      
      // Emit position change for parent components
      const lineIndex = this.page.findIndex(l => l.index === update.line.index);
      if (lineIndex !== -1) {
        this.positionChanged.emit({
          line: update.line,
          lineIndex,
          newPosition: update.newPosition
        });
      }
    });
  }

  ngOnInit(): void {
    // Make END scene lines draggable
    if (this.canEditDocument) {
      this.makeEndSceneLinesEditable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If canEditDocument changes to true, make END scene lines draggable
    if (changes.canEditDocument && changes.canEditDocument.currentValue === true) {
      this.makeEndSceneLinesEditable();
    }
    
    // If page changes, make END scene lines draggable again
    if (changes.page && this.canEditDocument) {
      this.makeEndSceneLinesEditable();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.dragUpdateSubscription) {
      this.dragUpdateSubscription.unsubscribe();
    }
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
  onDragStarted(event: CdkDragStart, line: any): void {
    // Store current position for undo functionality and for drag calculations
    line._originalPosition = {
      x: line.calculatedXpos,
      y: line.calculatedYpos
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
  onDragEnded(event: CdkDragEnd, line: any, lineIndex: number): void {
    // Get the drag distance
    const dragX = event.distance.x;
    const dragY = -event.distance.y; // Invert Y since your coordinate system is bottom-based
    
    // Parse current positions (removing 'px')
    const currentX = parseFloat(line._originalPosition.x);
    const currentY = parseFloat(line._originalPosition.y);
    
    // Calculate new positions
    const newX = (currentX + dragX) + 'px';
    const newY = (currentY + dragY) + 'px';
    
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
    line.calculatedXpos = newX;
    line.calculatedYpos = newY;
    
    // Emit position change event
    this.positionChanged.emit({
      line: line,
      lineIndex,
      newPosition: { x: newX, y: newY }
    });
    
    // Clean up temporary property
    delete line._originalPosition;
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

  // Update the selectLine method to ensure dragging works with selection
  selectLine(line: any, event: MouseEvent): void {
    // Only check if editing is allowed
    if (!this.canEditDocument) {
      return;
    }
    
    // If this is a drag handle click, don't change selection
    const target = event.target as HTMLElement;
    if (target.classList.contains('drag-handle') || target.closest('.drag-handle')) {
      // Just emit the current line for drag operations
      this.lineSelected.emit(line);
      return;
    }
    
    const lineIndex = this.page.findIndex(l => l.index === line.index);
    
    // Handle Ctrl+Click for multiple selection
    if (event.ctrlKey || event.metaKey) {
      // Toggle the selected state of this line
      if (this.selectedLineIds.includes(line.index)) {
        // Remove from selection
        this.selectedLineIds = this.selectedLineIds.filter(id => id !== line.index);
      } else {
        // Add to selection
        this.selectedLineIds.push(line.index);
        this.lastSelectedIndex = lineIndex;
      }
    }
    // Handle Shift+Click for range selection
    else if (event.shiftKey && this.lastSelectedIndex !== null) {
      // Clear current selection
      this.selectedLineIds = [];
      
      // Determine the range to select
      const startIndex = Math.min(this.lastSelectedIndex, lineIndex);
      const endIndex = Math.max(this.lastSelectedIndex, lineIndex);
      
      // Select all lines in the range
      for (let i = startIndex; i <= endIndex; i++) {
        if (i >= 0 && i < this.page.length) {
          this.selectedLineIds.push(this.page[i].index);
        }
      }
    }
    // Regular click (no modifier keys)
    else {
      // Clear selection and select only this line
      this.selectedLineIds = [line.index];
      this.lastSelectedIndex = lineIndex;
    }
    
    // Emit the selected lines
    this.emitSelectedLines();
    
    // Also emit the current line for drag operations
    this.lineSelected.emit(line);
  }

  // Add a method to clear selection
  clearSelection(): void {
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.lineSelected.emit(null);
  }

  // Update the isLineSelected method
  isLineSelected(line: Line): boolean {
    return this.selectedLineIds.includes(line.index);
  }

  // Update the handleUndoChange method to handle batch crossOut changes
  private handleUndoChange(change: UndoStackItem): void {
    const { line, type } = change;
    
    // Handle batch operations
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

  // Update the emitSelectedLines method to use type assertion
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
    
    // If multiple lines are selected, emit an array of lines
    const selectedLines = this.page.filter(line => 
      this.selectedLineIds.includes(line.index)
    );
    
    // Emit the first line with a special property indicating multiple selection
    const primaryLine = selectedLines[0];
    (primaryLine as any).multipleSelected = true;
    (primaryLine as any).selectedCount = selectedLines.length;
    this.lineSelected.emit(primaryLine);
  }

  // Update the onDoubleClick method to make the line itself editable
  onDoubleClick(index: number, text: string): void {
    // Store the current line for reference
    const line = this.page[index];
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

  // Update the onEditTextChange method to work with contenteditable
  onEditTextChange(newText: string): void {
    if (this.editingLine !== null) {
      // Update the editingText state
      this.editingText = newText;
      
      // Create a copy of the page
      const updatedPage = [...this.page];
      
      // Temporarily update the text for preview
      const originalText = updatedPage[this.editingLine].text;
      updatedPage[this.editingLine].text = newText;
      
      // Store the original text for restoration when saving/canceling
      if (!updatedPage[this.editingLine]._originalText) {
        updatedPage[this.editingLine]._originalText = originalText;
      }
    }
  }

  // Update the handleEditKeyDown method to handle Enter key
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

  // Improve the document click handler to better detect clicks outside
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (this.editingLine !== null) {
      const clickedElement = event.target as HTMLElement;
      const isClickOnInput = clickedElement.classList.contains('edit-line-input');
      const isClickOnContainer = clickedElement.classList.contains('edit-input-container') || 
                                clickedElement.closest('.edit-input-container');
      
      // If the click is outside the input and its container, save and exit edit mode
      if (!isClickOnInput && !isClickOnContainer) {
        this.saveEdit();
      }
    }
  }

  // Update the saveEdit method to handle the temporary text changes
  saveEdit(): void {
    if (this.editingLine !== null && this.page && this.page.length > this.editingLine) {
      const line = this.page[this.editingLine];
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
  
  // Update the cancelEdit method to restore original text
  cancelEdit(): void {
    if (this.editingLine !== null) {
      const line = this.page[this.editingLine];
      
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

  // Improved drag move handler with boundary constraints
  onDragMoved(event: CdkDragMove, line: any): void {
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
    
    // Update the position directly for immediate visual feedback
    line.calculatedXpos = newXPx;
    line.calculatedYpos = newYPx;
    
    // Force change detection by emitting a page update
    this.pageUpdate.emit([...this.page]);
    
    // Also queue the update through the debounced subject for parent components
    this.dragUpdateSubject.next({
      line,
      newPosition: { x: newXPx, y: newYPx }
    });
  }

  // Add a method to handle END scene lines
  makeEndSceneLinesEditable(): void {
    // Find all end scene spans and make them draggable
    setTimeout(() => {
      const endSceneSpans = document.querySelectorAll('.end-span');
      
      endSceneSpans.forEach(span => {
        // Add necessary classes and attributes
        span.classList.add('draggable-end');
        
        // Add event listeners for dragging
        span.addEventListener('mousedown', this.startEndSpanDrag.bind(this));
      });
    }, 100);
  }

  // Update the startEndSpanDrag method to work regardless of selectedEditFunction
  startEndSpanDrag(event: MouseEvent): void {
    if (!this.canEditDocument) return;
    
    const span = event.target as HTMLElement;
    const lineId = span.closest('.bar-span')?.getAttribute('data-line-id');
    
    if (!lineId) return;
    
    // Find the corresponding line
    const line = this.page.find(l => l.id === lineId);
    if (!line) return;
    
    // Store original position
    const originalY = line.calculatedEnd || '0px';
    const originalX = '60px'; // Default X position
    
    // Set up drag tracking
    const startX = event.clientX;
    const startY = event.clientY;
    
    // Create move and up handlers
    const moveHandler = (moveEvent: MouseEvent) => {
      // Calculate the new position
      const deltaX = moveEvent.clientX - startX;
      const deltaY = -(moveEvent.clientY - startY); // Invert Y
      
      // Parse original positions
      const currentY = parseFloat(originalY);
      
      // Calculate new position
      const newY = (currentY + deltaY) + 'px';
      
      // Update the position
      line.calculatedEnd = newY;
      
      // Force update
      this.pageUpdate.emit([...this.page]);
    };
    
    const upHandler = () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      
      // Record the change for undo
      this.undoService.push({
        pageIndex: this.currentPageIndex,
        line: line,
        type: 'position',
        originalPosition: {
          x: originalX,
          y: originalY
        }
      });
      
      // Emit position change
      this.positionChanged.emit({
        line,
        property: 'endPosition',
        newPosition: { y: line.calculatedEnd }
      });
    };
    
    // Add event listeners
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    
    // Prevent default behavior
    event.preventDefault();
  }

  // Remove the dependency on selectedEditFunction in other methods
  // For example, update the onMouseDown method
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Just check if editing is allowed, but don't change modes
    if (!this.canEditDocument) return;
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

  // Update the handleGlobalKeyDown method to emit the specific event
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
}
