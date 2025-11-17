import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Line } from 'src/app/types/Line';
import { cloneDeep } from 'lodash';

export interface UndoStackItem {
  pageIndex: number;
  lineIndex: number;
  previousLineState: Line;  // Complete line state before change
  timestamp: number;
  changeDescription?: string; // Optional for debugging
}

export interface SceneOrderUndoItem {
  type: 'scene-order';
  previousSceneOrder: any[]; // Complete previous scene order
  timestamp: number;
  changeDescription?: string;
}

export interface DocumentReorderUndoItem {
  type: 'document-reorder';
  previousDocumentState: any; // Complete previous document state
  timestamp: number;
  changeDescription?: string;
}

export interface SceneReorderUndoItem {
  type: 'scene-reorder';
  previousSceneOrder: any[]; // Complete previous scene order
  previousDocumentState: any; // Complete previous document state
  timestamp: number;
  changeDescription?: string;
}

export interface BatchLineChangeUndoItem {
  type: 'batch-line-changes';
  changes: {
    pageIndex: number;
    lineIndex: number;
    previousLineState: Line;
    changeDescription?: string;
  }[];
  timestamp: number;
  changeDescription?: string;
}

export interface LinePositionChangeUndoItem {
  type: 'line-position-change';
  pageIndex: number;
  lineIndex: number;
  previousPosition: {
    calculatedXpos: string;
    calculatedYpos: string;
    xPos: number;
    yPos: number;
    barY: number | string;
    endY: number | string;
  };
  timestamp: number;
  changeDescription?: string;
}

// Union type for all possible undo items
export type AnyUndoItem = UndoStackItem | SceneOrderUndoItem | DocumentReorderUndoItem | SceneReorderUndoItem | BatchLineChangeUndoItem | LinePositionChangeUndoItem;

@Injectable({
  providedIn: 'root',
})
export class UndoService {
  private undoStack: AnyUndoItem[] = [];
  private redoStack: AnyUndoItem[] = [];
  private resetSubject = new Subject<void>();
  private undoRedoSubject = new Subject<{ type: 'undo' | 'redo', item: AnyUndoItem }>();
  
  // Observable for reset events only
  reset$ = this.resetSubject.asObservable();
  
  // Observable for all undo/redo operations
  undoRedo$ = this.undoRedoSubject.asObservable();

  // We'll inject PdfService to update it directly
  private pdfService: any; // Will be injected

  constructor() {}

  /**
   * Set the PDF service reference (called from PdfService constructor)
   * This avoids circular dependency issues
   */
  setPdfService(pdfService: any): void {
    this.pdfService = pdfService;
  }

  /**
   * Record a line change - saves the PREVIOUS state of the line
   * Call this BEFORE making any changes to a line
   *
   * @param pageIndex - Index of the page in the document
   * @param lineIndex - Index of the line within the page
   * @param currentLineState - Current state of the line (before changes)
   * @param changeDescription - Optional description for debugging
   */
  recordLineChange(
    pageIndex: number,
    lineIndex: number,
    currentLineState: Line,
    changeDescription?: string
  ): void {
    const undoItem: UndoStackItem = {
      pageIndex,
      lineIndex,
      previousLineState: cloneDeep(currentLineState), // Deep clone to avoid reference issues
      timestamp: Date.now(),
      changeDescription
    };

    // Add to undo stack
    this.undoStack.push(undoItem);

    // Clear redo stack when new change is made
    this.redoStack = [];

    // Trim stack if needed
    this.trimStackIfNeeded();

  }

  /**
   * Record a line position change - saves the PREVIOUS position of the line
   * Call this BEFORE making position changes to a line
   *
   * @param pageIndex - Index of the page in the document
   * @param lineIndex - Index of the line within the page
   * @param currentPosition - Current position of the line (before changes)
   * @param changeDescription - Optional description for debugging
   */
  recordLinePositionChange(
    pageIndex: number,
    lineIndex: number,
    currentPosition: {
      calculatedXpos: string;
      calculatedYpos: string;
      xPos: number;
      yPos: number;
      barY: number | string;
      endY: number | string;
    },
    changeDescription?: string
  ): void {
    const undoItem: LinePositionChangeUndoItem = {
      type: 'line-position-change',
      pageIndex,
      lineIndex,
      previousPosition: cloneDeep(currentPosition),
      timestamp: Date.now(),
      changeDescription
    };

    // Add to undo stack
    this.undoStack.push(undoItem);

    // Clear redo stack when new change is made
    this.redoStack = [];

    // Trim stack if needed
    this.trimStackIfNeeded();

  }

  /**
   * Record a scene order change - saves the PREVIOUS scene order
   * Call this BEFORE making any changes to scene order
   * 
   * @param currentSceneOrder - Current scene order (before changes)
   * @param changeDescription - Optional description for debugging
   */
  recordSceneOrderChange(
    currentSceneOrder: any[],
    changeDescription?: string
  ): void {
    const undoItem: SceneOrderUndoItem = {
      type: 'scene-order',
      previousSceneOrder: cloneDeep(currentSceneOrder), // Deep clone to avoid reference issues
      timestamp: Date.now(),
      changeDescription
    };
    
    // Add to undo stack
    this.undoStack.push(undoItem);
    
    // Clear redo stack when new change is made
    this.redoStack = [];
    
    // Trim stack if needed
    this.trimStackIfNeeded();
    
  }

  /**
   * Record a document reorder change - saves the PREVIOUS document state
   * Call this BEFORE making any changes to document order
   * 
   * @param currentDocumentState - Current document state (before changes)
   * @param changeDescription - Optional description for debugging
   */
  recordDocumentReorderChange(
    currentDocumentState: any,
    changeDescription?: string
  ): void {
    const undoItem: DocumentReorderUndoItem = {
      type: 'document-reorder',
      previousDocumentState: cloneDeep(currentDocumentState), // Deep clone to avoid reference issues
      timestamp: Date.now(),
      changeDescription
    };
    
    // Add to undo stack
    this.undoStack.push(undoItem);
    
    // Clear redo stack when new change is made
    this.redoStack = [];
    
    // Trim stack if needed
    this.trimStackIfNeeded();
    
  }

  /**
   * Record a scene reorder change - saves both the PREVIOUS scene order AND document state
   * Call this BEFORE making any changes to scene order and document
   * 
   * @param currentSceneOrder - Current scene order (before changes)
   * @param currentDocumentState - Current document state (before changes)
   * @param changeDescription - Optional description for debugging
   */
  recordSceneReorderChange(
    currentSceneOrder: any[],
    currentDocumentState: any,
    changeDescription?: string
  ): void {
    const undoItem: SceneReorderUndoItem = {
      type: 'scene-reorder',
      previousSceneOrder: cloneDeep(currentSceneOrder), // Deep clone to avoid reference issues
      previousDocumentState: cloneDeep(currentDocumentState), // Deep clone to avoid reference issues
      timestamp: Date.now(),
      changeDescription
    };
    
    // Add to undo stack
    this.undoStack.push(undoItem);
    
    // Clear redo stack when new change is made
    this.redoStack = [];
    
    // Trim stack if needed
    this.trimStackIfNeeded();
    
  }

  /**
   * Undo the last change by restoring the previous state
   * Handles both line changes and scene order changes
   * 
   * @returns The undo item that was processed, or null if nothing to undo
   */
  undo(): AnyUndoItem | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const undoItem = this.undoStack.pop()!;

    // Add to redo stack
    this.redoStack.push(undoItem);

    // Handle different types of undo items
    if (this.isLinePositionChangeUndoItem(undoItem)) {
      this.handleLinePositionChangeUndo(undoItem as LinePositionChangeUndoItem);
    } else if (this.isBatchLineChangeUndoItem(undoItem)) {
      this.handleBatchLineChangeUndo(undoItem as BatchLineChangeUndoItem);
    } else if (this.isSceneReorderUndoItem(undoItem)) {
      this.handleSceneReorderUndo(undoItem as SceneReorderUndoItem);
    } else if (this.isSceneOrderUndoItem(undoItem)) {
      this.handleSceneOrderUndo(undoItem as SceneOrderUndoItem);
    } else if (this.isDocumentReorderUndoItem(undoItem)) {
      this.handleDocumentReorderUndo(undoItem as DocumentReorderUndoItem);
    } else {
      this.handleLineChangeUndo(undoItem as UndoStackItem);
    }

    // Notify components about the undo operation
    this.undoRedoSubject.next({ type: 'undo', item: undoItem });

    return undoItem;
  }

  /**
   * Redo the last undone change
   * Handles both line changes and scene order changes
   * 
   * @returns The redo item that was processed, or null if nothing to redo
   */
  redo(): AnyUndoItem | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    
    const redoItem = this.redoStack.pop()!;

    if (this.isLinePositionChangeUndoItem(redoItem)) {
      // Handle line position change redo
      this.handleLinePositionChangeRedo(redoItem as LinePositionChangeUndoItem);
    } else if (this.isBatchLineChangeUndoItem(redoItem)) {
      // Handle batch line changes redo
      this.handleBatchLineChangeRedo(redoItem as BatchLineChangeUndoItem);
    } else if (this.isSceneReorderUndoItem(redoItem)) {
      // Handle scene reorder redo
      this.handleSceneReorderRedo(redoItem as SceneReorderUndoItem);
    } else if (this.isSceneOrderUndoItem(redoItem)) {
      // Handle scene order redo
      this.handleSceneOrderRedo(redoItem as SceneOrderUndoItem);
    } else if (this.isDocumentReorderUndoItem(redoItem)) {
      // Handle document reorder redo
      this.handleDocumentReorderRedo(redoItem as DocumentReorderUndoItem);
    } else {
      // Handle line change redo
      this.handleLineChangeRedo(redoItem as UndoStackItem);
    }
    
    // Emit redo event for components to listen to
    this.undoRedoSubject.next({ type: 'redo', item: redoItem });
    
    
    return redoItem;
  }

  /**
   * Type guard to check if an undo item is a scene order change
   */
  private isSceneOrderUndoItem(item: AnyUndoItem): item is SceneOrderUndoItem {
    return (item as SceneOrderUndoItem).type === 'scene-order';
  }

  /**
   * Type guard to check if an undo item is a document reorder change
   */
  private isDocumentReorderUndoItem(item: AnyUndoItem): item is DocumentReorderUndoItem {
    return (item as DocumentReorderUndoItem).type === 'document-reorder';
  }

  /**
   * Type guard to check if an undo item is a scene reorder change (combined)
   */
  private isBatchLineChangeUndoItem(item: AnyUndoItem): item is BatchLineChangeUndoItem {
    return (item as BatchLineChangeUndoItem).type === 'batch-line-changes';
  }

  private isSceneReorderUndoItem(item: AnyUndoItem): item is SceneReorderUndoItem {
    return (item as SceneReorderUndoItem).type === 'scene-reorder';
  }

  private isLinePositionChangeUndoItem(item: AnyUndoItem): item is LinePositionChangeUndoItem {
    return (item as LinePositionChangeUndoItem).type === 'line-position-change';
  }

  /**
   * Handle undoing a scene order change
   */
  private handleSceneOrderUndo(undoItem: SceneOrderUndoItem): void {
    
    if (!this.pdfService) {
      return;
    }

    // Get current scene order before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    
    // Create redo item with current state (don't add to stack here, it's already done in undo())
    
    
    // IMPORTANT: Set the selected scenes first
    this.pdfService.setSelectedScenes(undoItem.previousSceneOrder);
    
    // CRITICAL: Ensure the scene order update is emitted
    // The setSelectedScenes method should emit to _sceneOrderUpdated$, but let's make sure
    if (this.pdfService._sceneOrderUpdated$) {
      this.pdfService._sceneOrderUpdated$.next([...undoItem.previousSceneOrder]);
    }
    
    // Then reorder the document
    this.pdfService.reorderScenes(undoItem.previousSceneOrder);
    
  }

  /**
   * Handle undoing a document reorder change
   */
  private handleDocumentReorderUndo(undoItem: DocumentReorderUndoItem): void {
    if (!this.pdfService) {
      return;
    }

    // Get current document state before restoring
    const currentDocumentState = cloneDeep(this.pdfService.finalDocument);
    
    // Create redo item with current state
    const redoItem: DocumentReorderUndoItem = {
      type: 'document-reorder',
      previousDocumentState: currentDocumentState,
      timestamp: Date.now(),
      changeDescription: undoItem.changeDescription
    };
    this.redoStack.push(redoItem);
    
    // Restore previous document state
    this.pdfService.finalDocument = cloneDeep(undoItem.previousDocumentState);
    
    // Trigger document regeneration to update all components
    this.pdfService._documentRegenerated$.next(true);
    
  }

  /**
   * Handle redoing a scene order change
   */
  private handleSceneOrderRedo(redoItem: SceneOrderUndoItem): void {
    if (!this.pdfService) {
      return;
    }

    // Get current scene order before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    
    // Create undo item with current state
    const undoItem: SceneOrderUndoItem = {
      type: 'scene-order',
      previousSceneOrder: currentSceneOrder,
      timestamp: Date.now(),
      changeDescription: redoItem.changeDescription
    };
    this.undoStack.push(undoItem);
    
    // Restore redo scene order and regenerate document
    this.pdfService.setSelectedScenes(redoItem.previousSceneOrder);
    this.pdfService.reorderScenes(redoItem.previousSceneOrder);
    
  }

  /**
   * Handle undoing a line position change
   */
  private handleLinePositionChangeUndo(undoItem: LinePositionChangeUndoItem): void {

    if (!this.pdfService) {
      return;
    }

    // Update the line directly in PdfService's finalDocument.data
    if (this.pdfService.finalDocument?.data) {
      const page = this.pdfService.finalDocument.data[undoItem.pageIndex];
      if (page && page[undoItem.lineIndex]) {
        const line = page[undoItem.lineIndex];

        // Save current position for redo
        const currentPosition = {
          calculatedXpos: line.calculatedXpos,
          calculatedYpos: line.calculatedYpos,
          xPos: line.xPos || 0,
          yPos: line.yPos || 0,
          barY: Number(line.barY) || 0,
          endY: Number(line.endY) || 0
        };

        // Create redo item with current position
        const redoItem: LinePositionChangeUndoItem = {
          type: 'line-position-change',
          pageIndex: undoItem.pageIndex,
          lineIndex: undoItem.lineIndex,
          previousPosition: currentPosition,
          timestamp: Date.now(),
          changeDescription: undoItem.changeDescription
        };
        this.redoStack.push(redoItem);

        // Restore the previous position
        line.calculatedXpos = undoItem.previousPosition.calculatedXpos;
        line.calculatedYpos = undoItem.previousPosition.calculatedYpos;
        line.xPos = undoItem.previousPosition.xPos;
        line.yPos = undoItem.previousPosition.yPos;
        line.barY = Number(undoItem.previousPosition.barY) || 0;
        line.endY = Number(undoItem.previousPosition.endY) || 0;


        // Trigger the observable to notify all components
        this.pdfService._finalDocumentData$.next({
          docPageIndex: undoItem.pageIndex,
          docPageLineIndex: undoItem.lineIndex,
          line: cloneDeep(line)
        });

      } else {
      }
    } else {
    }
  }

  /**
   * Handle undoing a batch of line changes
   */
  private handleBatchLineChangeUndo(undoItem: BatchLineChangeUndoItem): void {

    // Save current states for redo
    const redoChanges = undoItem.changes.map(change => {
      if (this.pdfService && this.pdfService.finalDocument?.data) {
        const currentPage = this.pdfService.finalDocument.data[change.pageIndex];
        if (currentPage && currentPage[change.lineIndex]) {
          return {
            ...change,
            previousLineState: cloneDeep(currentPage[change.lineIndex])
          };
        }
      }
      return change;
    });

    // Create redo item for the batch
    const redoItem: BatchLineChangeUndoItem = {
      type: 'batch-line-changes',
      changes: redoChanges,
      timestamp: Date.now(),
      changeDescription: undoItem.changeDescription
    };
    this.redoStack.push(redoItem);

    // Restore all previous states
    undoItem.changes.forEach(change => {
      this.restoreLineState({
        pageIndex: change.pageIndex,
        lineIndex: change.lineIndex,
        previousLineState: change.previousLineState,
        timestamp: undoItem.timestamp,
        changeDescription: change.changeDescription
      } as UndoStackItem);
    });

  }

  /**
   * Handle undoing a line change
   */
  private handleLineChangeUndo(undoItem: UndoStackItem): void {
debugger
    // Before restoring, save the current state for redo
    if (this.pdfService && this.pdfService.finalDocument?.data) {
      const currentPage = this.pdfService.finalDocument.data[undoItem.pageIndex];
      if (currentPage && currentPage[undoItem.lineIndex]) {
        const currentLineState = cloneDeep(currentPage[undoItem.lineIndex]);

        // Add current state to redo stack
        const redoItem: UndoStackItem = {
          ...undoItem,
          previousLineState: currentLineState,
          timestamp: Date.now()
        };
        this.redoStack.push(redoItem);
      }
    }

    // Restore the previous state directly in PdfService
    this.restoreLineState(undoItem);
  }

  /**
   * Handle redoing a line position change
   */
  private handleLinePositionChangeRedo(redoItem: LinePositionChangeUndoItem): void {

    if (!this.pdfService) {
      return;
    }

    // For redo, we need to restore the position that was current when the undo happened
    // Since we popped this from redo stack, we need to find what the "new" position should be
    // The redo item contains the previous position that was saved. For redo, we want to go back to the position that was undone.

    // Actually, since the redo stack contains the same items that were undone, and we want to redo the action,
    // we need to restore the state that existed before the undo happened.

    // But wait, the redo logic is a bit confusing. When we undo, we save the current state to redo stack.
    // So for redo, we want to restore what was saved in the redo item.

    // Actually, let me check how the other redo methods work. They seem to save the current state to undo stack and then restore the redo item state.

    // For position changes, since we only save the previous position, for redo we need to get the current position and save it as undo, then restore the redo item's previous position.

    if (this.pdfService.finalDocument?.data) {
      const page = this.pdfService.finalDocument.data[redoItem.pageIndex];
      if (page && page[redoItem.lineIndex]) {
        const currentLine = page[redoItem.lineIndex];

        // Save current position for undo
        const currentPosition = {
          calculatedXpos: currentLine.calculatedXpos,
          calculatedYpos: currentLine.calculatedYpos,
          xPos: currentLine.xPos || 0,
          yPos: currentLine.yPos || 0,
          barY: Number(currentLine.barY) || 0,
          endY: Number(currentLine.endY) || 0
        };

        // Create undo item with current state
        const undoItem: LinePositionChangeUndoItem = {
          type: 'line-position-change',
          pageIndex: redoItem.pageIndex,
          lineIndex: redoItem.lineIndex,
          previousPosition: currentPosition,
          timestamp: Date.now(),
          changeDescription: redoItem.changeDescription
        };
        this.undoStack.push(undoItem);

        // Restore the position from the redo item
        currentLine.calculatedXpos = redoItem.previousPosition.calculatedXpos;
        currentLine.calculatedYpos = redoItem.previousPosition.calculatedYpos;
        currentLine.xPos = redoItem.previousPosition.xPos;
        currentLine.yPos = redoItem.previousPosition.yPos;
        currentLine.barY = Number(redoItem.previousPosition.barY) || 0;
        currentLine.endY = Number(redoItem.previousPosition.endY) || 0;


        // Trigger the observable to notify all components
        this.pdfService._finalDocumentData$.next({
          docPageIndex: redoItem.pageIndex,
          docPageLineIndex: redoItem.lineIndex,
          line: cloneDeep(currentLine)
        });

      } else {
      }
    } else {
    }
  }

  /**
   * Handle redoing a batch of line changes
   */
  private handleBatchLineChangeRedo(redoItem: BatchLineChangeUndoItem): void {

    // Save current states for undo
    const undoChanges = redoItem.changes.map(change => {
      if (this.pdfService && this.pdfService.finalDocument?.data) {
        const currentPage = this.pdfService.finalDocument.data[change.pageIndex];
        if (currentPage && currentPage[change.lineIndex]) {
          return {
            ...change,
            previousLineState: cloneDeep(currentPage[change.lineIndex])
          };
        }
      }
      return change;
    });

    // Create undo item for the batch
    const undoItem: BatchLineChangeUndoItem = {
      type: 'batch-line-changes',
      changes: undoChanges,
      timestamp: Date.now(),
      changeDescription: redoItem.changeDescription
    };
    this.undoStack.push(undoItem);

    // Restore all redo states
    redoItem.changes.forEach(change => {
      this.restoreLineState({
        pageIndex: change.pageIndex,
        lineIndex: change.lineIndex,
        previousLineState: change.previousLineState,
        timestamp: redoItem.timestamp,
        changeDescription: change.changeDescription
      } as UndoStackItem);
    });

  }

  /**
   * Handle redoing a line change
   */
  private handleLineChangeRedo(redoItem: UndoStackItem): void {
    // Before redoing, save the current state for undo
    if (this.pdfService && this.pdfService.finalDocument?.data) {
      const currentPage = this.pdfService.finalDocument.data[redoItem.pageIndex];
      if (currentPage && currentPage[redoItem.lineIndex]) {
        const currentLineState = cloneDeep(currentPage[redoItem.lineIndex]);
        
        // Add current state back to undo stack
        const undoItem: UndoStackItem = {
          ...redoItem,
          previousLineState: currentLineState,
          timestamp: Date.now()
        };
        this.undoStack.push(undoItem);
      }
    }
    
    // Restore the redo state directly in PdfService
    this.restoreLineState(redoItem);
  }

  /**
   * Clear all undo/redo history and reset document to initial state
   */
  reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    // Notify components that reset has occurred
    this.resetSubject.next();
  }
    
    
    
    

  /**
   * Clear undo/redo stacks without resetting document
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Restore a line to its previous state in the PdfService
   * This will trigger the observable and update all components
   */
  private restoreLineState(undoItem: UndoStackItem): void {
    if (!this.pdfService) {
      return;
    }

    // Update the line directly in PdfService's finalDocument.data
    if (this.pdfService.finalDocument?.data) {
      const page = this.pdfService.finalDocument.data[undoItem.pageIndex];
      if (page && page[undoItem.lineIndex]) {
        // Replace the entire line with the previous state
        this.pdfService.finalDocument.data[undoItem.pageIndex][undoItem.lineIndex] = cloneDeep(undoItem.previousLineState);


        // Trigger the observable to notify all components with the specific line update
        this.pdfService._finalDocumentData$.next({
          docPageIndex: undoItem.pageIndex,
          docPageLineIndex: undoItem.lineIndex,
          line: cloneDeep(undoItem.previousLineState)
        });

      } else {
      }
    } else {
    }
  }

  /**
   * Record multiple line changes at once (for batch operations) as a single undo item
   */
  recordBatchChanges(changes: {
    pageIndex: number;
    lineIndex: number;
    currentLineState: Line;
    changeDescription?: string;
  }[]): void {
    const batchUndoItem: BatchLineChangeUndoItem = {
      type: 'batch-line-changes',
      changes: changes.map(change => ({
        pageIndex: change.pageIndex,
        lineIndex: change.lineIndex,
        previousLineState: cloneDeep(change.currentLineState),
        changeDescription: change.changeDescription
      })),
      timestamp: Date.now(),
      changeDescription: `Batch operation: ${changes.length} line changes`
    };

    // Add to undo stack
    this.undoStack.push(batchUndoItem);

    // Clear redo stack when new change is made
    this.redoStack = [];

    // Trim stack if needed
    this.trimStackIfNeeded();

  }

  // ============= GETTERS AND UTILITY METHODS =============

  /**
   * Check if undo is available
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the size of the undo stack
   */
  get undoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the size of the redo stack
   */
  get redoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Peek at the last undo item without removing it
   */
  peekLastUndo(): AnyUndoItem | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  /**
   * Peek at the last redo item without removing it
   */
  peekLastRedo(): AnyUndoItem | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1] : null;
  }

  /**
   * Get a summary of recent changes for debugging
   */
  getRecentChanges(count: number = 5): AnyUndoItem[] {
    return this.undoStack.slice(-count);
  }

  /**
   * Get debug information about the current state
   */
  getDebugInfo(): {
    undoStackSize: number;
    redoStackSize: number;
    canUndo: boolean;
    canRedo: boolean;
    lastUndo?: AnyUndoItem;
    lastRedo?: AnyUndoItem;
  } {
    return {
      undoStackSize: this.undoStackSize,
      redoStackSize: this.redoStackSize,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      lastUndo: this.peekLastUndo() || undefined,
      lastRedo: this.peekLastRedo() || undefined
    };
  }

  /**
   * Set maximum stack size to prevent memory issues
   */
  private maxStackSize = 50;

  private trimStackIfNeeded(): void {
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack = this.undoStack.slice(-this.maxStackSize);
    }
  }

  /**
   * Set the maximum number of undo operations to keep in memory
   */
  setMaxStackSize(size: number): void {
    this.maxStackSize = size;
    this.trimStackIfNeeded();
  }

  /**
   * Get a description of what the next undo operation would do
   */
  getNextUndoDescription(): string | null {
    const lastUndo = this.peekLastUndo();
    if (!lastUndo) return null;
    
    if (this.isSceneOrderUndoItem(lastUndo)) {
      return lastUndo.changeDescription || 'Undo scene reordering';
    } else if (this.isDocumentReorderUndoItem(lastUndo)) {
      return lastUndo.changeDescription || 'Undo document reordering';
    } else {
      return lastUndo.changeDescription || `Undo line change ()`;
    }
  }

  /**
   * Get a description of what the next redo operation would do
   */
  getNextRedoDescription(): string | null {
    const lastRedo = this.peekLastRedo();
    if (!lastRedo) return null;
    
    if (this.isSceneOrderUndoItem(lastRedo)) {
      return lastRedo.changeDescription || 'Redo scene reordering';
    } else if (this.isDocumentReorderUndoItem(lastRedo)) {
      return lastRedo.changeDescription || 'Redo document reordering';
    } else {
      return lastRedo.changeDescription || `Redo line change (Page )`;
    }
  }

  private getUndoItemType(item: AnyUndoItem): string {
    if (this.isSceneReorderUndoItem(item)) {
      return 'scene-reorder';
    } else if (this.isSceneOrderUndoItem(item)) {
      return 'scene-order';
    } else if (this.isDocumentReorderUndoItem(item)) {
      return 'document-reorder';
    } else {
      return 'line-change';
    }
  }

  /**
   * Handle undoing a scene reorder change (combined scene order + document state)
   */
  private handleSceneReorderUndo(undoItem: SceneReorderUndoItem): void {
    
    if (!this.pdfService) {
      return;
    }

    // Get current scene order and document state before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    const currentDocumentState = cloneDeep(this.pdfService.finalDocument);
    
    
    // Create redo item with current state (don't add to stack here, it's already done in undo())
    
    
    // IMPORTANT: Set the selected scenes first
    this.pdfService.setSelectedScenes(undoItem.previousSceneOrder);
    
    // CRITICAL: Ensure the scene order update is emitted
    if (this.pdfService._sceneOrderUpdated$) {
      this.pdfService._sceneOrderUpdated$.next([...undoItem.previousSceneOrder]);
    }
    
    // Restore the previous document state
    this.pdfService.finalDocument = cloneDeep(undoItem.previousDocumentState);
    
    // Trigger document regeneration to update all components
    this.pdfService._documentRegenerated$.next(true);
    
  }

  /**
   * Handle redoing a scene reorder change
   */
  private handleSceneReorderRedo(redoItem: SceneReorderUndoItem): void {
    if (!this.pdfService) {
      return;
    }

    // Get current scene order and document state before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    const currentDocumentState = cloneDeep(this.pdfService.finalDocument);
    
    // Create undo item with current state
    const undoItem: SceneReorderUndoItem = {
      type: 'scene-reorder',
      previousSceneOrder: currentSceneOrder,
      previousDocumentState: currentDocumentState,
      timestamp: Date.now(),
      changeDescription: redoItem.changeDescription
    };
    this.undoStack.push(undoItem);
    
    // Restore redo scene order and document state
    this.pdfService.setSelectedScenes(redoItem.previousSceneOrder);
    this.pdfService.finalDocument = cloneDeep(redoItem.previousDocumentState);
    
    // Trigger document regeneration to update all components
    this.pdfService._documentRegenerated$.next(true);
    
  }

  /**
   * Handle redoing a document reorder change
   */
  private handleDocumentReorderRedo(redoItem: DocumentReorderUndoItem): void {
    if (!this.pdfService) {
      return;
    }

    // Get current document state before restoring
    const currentDocumentState = cloneDeep(this.pdfService.finalDocument);
    
    // Create undo item with current state
    const undoItem: DocumentReorderUndoItem = {
      type: 'document-reorder',
      previousDocumentState: currentDocumentState,
      timestamp: Date.now(),
      changeDescription: redoItem.changeDescription
    };
    this.undoStack.push(undoItem);
    
    // Restore redo document state
    this.pdfService.finalDocument = cloneDeep(redoItem.previousDocumentState);
    
    // Trigger document regeneration to update all components
    this.pdfService._documentRegenerated$.next(true);
    
  }
}