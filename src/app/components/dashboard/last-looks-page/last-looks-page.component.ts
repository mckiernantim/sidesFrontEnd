import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Line } from 'src/app/types/Line';
import { UndoService } from 'src/app/services/edit/undo.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
  private mouseDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragLineId: number | null = null;
  private dragType: 'line' | 'end' | 'continue' | 'continue-top' = 'line';
  private initialPosition: { x: number; y: number } = { x: 0, y: 0 };

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

  // Add initialPageState property
  private initialPageState: any[] = [];

  constructor(
    private undoService: UndoService,
    private cdRef: ChangeDetectorRef,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    if (this.editMode) {
      this.canEditDocument = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editMode']) {
      this.canEditDocument = changes['editMode'].currentValue;
    }

    // Handle page changes
    if (changes['page']) {
      this.processPageUpdates(changes['page'].currentValue);
      // Save initial state when page is first loaded
      if (!this.initialPageState.length) {
        this.initialPageState = JSON.parse(JSON.stringify(changes['page'].currentValue));
      }
    }

    // Handle reset state
    if (changes['resetDocState'] && changes['resetDocState'].currentValue) {
      // Reset the page to its initial state
      this.page = JSON.parse(JSON.stringify(this.initialPageState));
      this.selectedLineIds = [];
      this.lastSelectedIndex = null;
      this.selectedLine = null;
      this.pageUpdate.emit(this.page);
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

      // Initialize CONTINUE bars at 90px from bottom if not already set
      if (line.cont === 'CONTINUE' && !line.calculatedBarY) {
        line.calculatedBarY = '90px';
        line.barY = 90;
      }

      // Initialize START bars with calculatedBarY if not already set
      if (line.bar === 'START' && !line.calculatedBarY) {
        line.calculatedBarY = '40px';
        line.barY = 40;
      }
    });

    // Force change detection
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.moveBarText);
    document.removeEventListener('mouseup', this.endBarTextDrag);
  }

  // ============= MOUSE DRAG METHODS =============

  startLineDrag(event: MouseEvent, line: Line, type: 'line' | 'end' | 'continue' | 'continue-top'): void {
    if (!this.canEditDocument) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const lineIndex = this.page.findIndex(l => l.index === line.index);
    if (lineIndex === -1) return;

    // 1. RECORD UNDO STATE BEFORE DRAGGING
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Move ${type}: from (${line.calculatedXpos || '0'}, ${line.calculatedYpos || '0'})`
    );
    
    this.mouseDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragLineId = line.index;
    this.dragType = type;
    
    // Store INITIAL position based on type
    switch (type) {
      case 'line':
        this.initialPosition = {
          x: parseFloat(String(line.calculatedXpos || '0')),
          y: parseFloat(String(line.calculatedYpos || '0'))
        };
        break;
      case 'end':
        this.initialPosition = {
          x: parseFloat(String(line.calculatedXpos || '0')),
          y: parseFloat(String(line.calculatedEnd || '0'))
        };
        break;
      case 'continue':
        this.initialPosition = {
          x: parseFloat(String(line.calculatedXpos || '0')),
          y: parseFloat(String(line.calculatedBarY || '90'))
        };
        break;
      case 'continue-top':
        this.initialPosition = {
          x: parseFloat(String(line.calculatedXpos || '0')),
          y: parseFloat(String(line.calculatedBarY || '40'))
        };
        break;
    }
    
    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    // Add cursor class
    document.body.classList.add('grab-cursor');
    
    // Select the line
    this.selectLine(line, event);
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
    const lineIndex = this.page.findIndex(line => line.index === this.dragLineId);
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
    
    // Remove cursor class
    document.body.classList.remove('grab-cursor');
    
    // Calculate final position
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    const finalX = this.initialPosition.x + deltaX;
    const finalY = this.initialPosition.y - deltaY;
    
    // Find the line
    const lineIndex = this.page.findIndex(line => line.index === this.dragLineId);
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
    
    const lineIndex = this.page.findIndex(l => l.index === line.index);
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
    this.barTextDragLineId = line.index;
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
    
    const lineIndex = this.page.findIndex(line => line.index === this.barTextDragLineId);
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
    
    const lineIndex = this.page.findIndex(l => l.index === line.index);
    if (lineIndex === -1) return;

    // Record undo state before editing bar text
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit ${type} bar text`
    );
    
    this.barTextEditingId = line.index;
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
      const editableElement = document.getElementById(`bar-text-edit-${line.index}-${type}`);
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
    
    const lineIndex = this.page.findIndex(line => line.index === this.barTextEditingId);
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
    
    const lineId = line.index;
    const currentIndex = this.page.findIndex(l => l.index === lineId);
    
    if (event.shiftKey && this.lastSelectedIndex !== null) {
      this.selectedLineIds = [];
      const startIndex = Math.min(this.lastSelectedIndex, currentIndex);
      const endIndex = Math.max(this.lastSelectedIndex, currentIndex);
      
      for (let i = startIndex; i <= endIndex; i++) {
        if (this.page[i] && this.page[i].index !== undefined) {
          this.selectedLineIds.push(this.page[i].index);
        }
      }
    } else if (event.ctrlKey || event.metaKey) {
      const index = this.selectedLineIds.indexOf(lineId);
      if (index === -1) {
        this.selectedLineIds.push(lineId);
      } else {
        this.selectedLineIds.splice(index, 1);
      }
      this.lastSelectedIndex = currentIndex;
    } else {
      this.selectedLineIds = [lineId];
      this.lastSelectedIndex = currentIndex;
    }
    
    line.multipleSelected = this.selectedLineIds.length > 1;
    this.emitSelectedLines();
  }

  private emitSelectedLines() {
    if (this.selectedLineIds.length === 0) {
      this.lineSelected.emit(null);
      return;
    }
    
    if (this.selectedLineIds.length === 1) {
      const selectedLine = this.page.find(line => line.index === this.selectedLineIds[0]);
      this.lineSelected.emit(selectedLine);
      return;
    }
    
    const primaryLine = this.page.find(line => line.index === this.selectedLineIds[0]);
    if (primaryLine) {
      primaryLine.multipleSelected = true;
      primaryLine.selectedCount = this.selectedLineIds.length;
      this.lineSelected.emit(primaryLine);
    }
  }

  isLineSelected(line: Line): boolean {
    if (!this.canEditDocument) return false;
    return this.selectedLineIds.includes(line.index);
  }

  isSelectedLine(line: any, index: number): boolean {
    if (!this.selectedLine) return false;
    return this.selectedLine.index === line.index;
  }

  clearSelection(): void {
    this.selectedLineIds = [];
    this.lastSelectedIndex = null;
    this.lineSelected.emit(null);
  }

  // ============= CONTEXT MENU METHODS =============

  openContextMenu(event: MouseEvent, line: any, lineIndex: number): void {
    event.preventDefault();
    this.showContextMenu = true;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.selectedLine = line;
    this.selectedLineIndex = lineIndex;
    this.lineSelected.emit(line);
  }

  closeContextMenu(): void {
    this.showContextMenu = false;
  }

  changeLineCategory(event: Event, category: string, xPos: string, line: any, lineIndex: number): void {
    event.stopPropagation();
    this.showContextMenu = false;
    
    // Record undo state before changing category
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Change category: ${line.category} → ${category}`
    );
    
    line.category = category;
    
    if (xPos && category !== 'hidden') {
      line.calculatedXpos = xPos;
    }
    
    this.categoryChanged.emit({
      line,
      lineIndex,
      category
    });
    
    this.pageUpdate.emit([...this.page]);
  }

  // ============= TEXT EDITING METHODS =============

  onDoubleClick(index: number, text: string): void {
    // Find the line using the new indexing properties
    const line = this.page.find(l => l.docPageLineIndex === index);
    if (!line) return;
    
    const lineIndex = this.page.findIndex(l => l.docPageLineIndex === index);
    
    // Record undo state before editing
    this.undoService.recordLineChange(
      this.currentPageIndex,
      lineIndex,
      line,
      `Edit line text: "${text}"`
    );
    
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
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }

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

  saveEdit(): void {
    if (this.editingLine !== null) {
      // Find the line using the new indexing properties
      const line = this.page.find(l => l.docPageLineIndex === this.editingLine);
      if (!line) return;
      
      const originalText = line._originalText || line.text;
      
      // Only emit change if text actually changed from original (undo already recorded in onDoubleClick)
      if (originalText !== this.editingText) {
        // Emit change
        this.lineChanged.emit({
          line: this.page[this.editingLine],
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
        const lineIndex = this.page.findIndex(line => line.index === lineId);
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
          line.visible = newVisibility;
          this.lineChanged.emit({ 
            line: this.page[lineIndex], 
            lineIndex, 
            property: 'visible', 
            value: line.visible 
          });
        });
      } else {
        // Mixed visibility, make ALL match the first line
        selectedLines.forEach(({ line, lineIndex }) => {
          if (line.visible !== referenceVisibility) {
            line.visible = referenceVisibility;
            this.lineChanged.emit({ 
              line: this.page[lineIndex], 
              lineIndex, 
              property: 'visible', 
              value: line.visible 
            });
          }
        });
      }
      
      this.pageUpdate.emit([...this.page]);
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
    // If we're editing, use the edit-specific handler
    if (this.editingLine === lineIndex) {
      this.handleEditKeyDown(event, line);
      return;
    }
    
    // Handle X key to cross out the line(s)
    if (event.key === 'x' || event.key === 'X') {
      event.preventDefault();
      event.stopPropagation();
      
      // Record original state for undo
      this.undoService.recordLineChange(
        this.currentPageIndex,
        lineIndex,
        line,
        `Toggle visibility: ${line.visible}`
      );
      
      // Toggle visibility
      line.visible = line.visible === 'true' ? 'false' : 'true';
      
      // Emit the change
      this.lineChanged.emit({
        line: this.page[lineIndex],
        lineIndex,
        property: 'visible',
        value: line.visible
      });
      
      // Update the page
      this.pageUpdate.emit([...this.page]);
    }
  }

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

  // ============= SCENE NUMBER EDITING METHODS =============

  startEditingSceneNumber(line: any): void {
    if (!this.canEditDocument) return;
    
    const lineIndex = this.page.findIndex(l => l.index === line.index);
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

  saveSceneNumberEdit(triggerLine: any): void {
    if (!this.editingSceneNumber) return;
    
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
      const sceneNumberToUpdate = this.originalSceneNumber;
      
      // Update all matching lines in the page
      this.page.forEach((line, index) => {
        if (line.sceneNumberText === sceneNumberToUpdate) {
          // Record undo for each affected line
          this.undoService.recordLineChange(
            this.currentPageIndex,
            index,
            line,
            `Scene number update: ${sceneNumberToUpdate} → ${newSceneNumber}`
          );

          line.sceneNumberText = newSceneNumber;
        }
        
        // Update custom bar texts
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
      
      this.pageUpdate.emit([...this.page]);
    }
    
    this.editingSceneNumber = null;
    this.originalSceneNumber = null;
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