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

// Union type for all possible undo items
export type AnyUndoItem = UndoStackItem | SceneOrderUndoItem;

@Injectable({
  providedIn: 'root',
})
export class UndoService {
  private undoStack: AnyUndoItem[] = [];
  private redoStack: AnyUndoItem[] = [];
  private resetSubject = new Subject<void>();
  
  // Observable for reset events only
  reset$ = this.resetSubject.asObservable();

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
    
    console.log(`[UNDO] Recorded line change: Page ${pageIndex}, Line ${lineIndex} - ${changeDescription || 'No description'}`);
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
    
    console.log(`[UNDO] Recorded scene order change: ${changeDescription || 'Scene reordering'}`);
  }

  /**
   * Undo the last change by restoring the previous state
   * Handles both line changes and scene order changes
   * 
   * @returns The undo item that was processed, or null if nothing to undo
   */
  undo(): AnyUndoItem | null {
    if (this.undoStack.length === 0) {
      console.log('[UNDO] Nothing to undo');
      return null;
    }
    
    const undoItem = this.undoStack.pop()!;
    
    if (this.isSceneOrderUndoItem(undoItem)) {
      // Handle scene order undo
      this.handleSceneOrderUndo(undoItem);
    } else {
      // Handle line change undo
      this.handleLineChangeUndo(undoItem);
    }
    
    console.log(`[UNDO] Restored: ${undoItem.changeDescription || 'No description'}`);
    
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
      console.log('[UNDO] Nothing to redo');
      return null;
    }
    
    const redoItem = this.redoStack.pop()!;
    
    if (this.isSceneOrderUndoItem(redoItem)) {
      // Handle scene order redo
      this.handleSceneOrderRedo(redoItem);
    } else {
      // Handle line change redo
      this.handleLineChangeRedo(redoItem);
    }
    
    console.log(`[UNDO] Redid: ${redoItem.changeDescription || 'No description'}`);
    
    return redoItem;
  }

  /**
   * Type guard to check if an undo item is a scene order change
   */
  private isSceneOrderUndoItem(item: AnyUndoItem): item is SceneOrderUndoItem {
    return (item as SceneOrderUndoItem).type === 'scene-order';
  }

  /**
   * Handle undoing a scene order change
   */
  private handleSceneOrderUndo(undoItem: SceneOrderUndoItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
      return;
    }

    // Get current scene order before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    
    // Create redo item with current state
    const redoItem: SceneOrderUndoItem = {
      type: 'scene-order',
      previousSceneOrder: currentSceneOrder,
      timestamp: Date.now(),
      changeDescription: undoItem.changeDescription
    };
    this.redoStack.push(redoItem);
    
    // Restore previous scene order
    this.pdfService.setSelectedScenes(undoItem.previousSceneOrder);
    
    console.log(`[UNDO] Scene order restored`);
  }

  /**
   * Handle redoing a scene order change
   */
  private handleSceneOrderRedo(redoItem: SceneOrderUndoItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
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
    
    // Restore redo scene order
    this.pdfService.setSelectedScenes(redoItem.previousSceneOrder);
    
    console.log(`[UNDO] Scene order redone`);
  }

  /**
   * Handle undoing a line change
   */
  private handleLineChangeUndo(undoItem: UndoStackItem): void {
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
    this.pdfService.resetToInitialState(); // Direct call
    // Notify components that reset has occurred
    console.log('[UNDO] History reset');
  }
    
    
    
    

  /**
   * Clear undo/redo stacks without resetting document
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    console.log('[UNDO] History cleared');
  }

  /**
   * Restore a line to its previous state in the PdfService
   * This will trigger the observable and update all components
   */
  private restoreLineState(undoItem: UndoStackItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
      return;
    }

    // Update the line directly in PdfService's finalDocument.data
    if (this.pdfService.finalDocument?.data) {
      const page = this.pdfService.finalDocument.data[undoItem.pageIndex];
      if (page && page[undoItem.lineIndex]) {
        // Replace the entire line with the previous state
        this.pdfService.finalDocument.data[undoItem.pageIndex][undoItem.lineIndex] = cloneDeep(undoItem.previousLineState);
        
        // Trigger the observable to notify all components
        this.pdfService._finalDocumentData$.next(this.pdfService.finalDocument.data);
        
        console.log(`[UNDO] Line state restored in PdfService`);
      } else {
        console.warn(`[UNDO] Could not find line at page ${undoItem.pageIndex}, line ${undoItem.lineIndex}`);
      }
    } else {
      console.warn('[UNDO] No finalDocument.data available in PdfService');
    }
  }

  /**
   * Record multiple line changes at once (for batch operations)
   */
  recordBatchChanges(changes: {
    pageIndex: number;
    lineIndex: number;
    currentLineState: Line;
    changeDescription?: string;
  }[]): void {
    changes.forEach(change => {
      this.recordLineChange(
        change.pageIndex,
        change.lineIndex,
        change.currentLineState,
        change.changeDescription
      );
    });
    
    console.log(`[UNDO] Recorded batch of ${changes.length} changes`);
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
      console.log(`[UNDO] Trimmed undo stack to ${this.maxStackSize} items`);
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
    } else {
      return lastUndo.changeDescription || `Undo line change (Page ${lastUndo.pageIndex}, Line ${lastUndo.lineIndex})`;
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
    } else {
      return lastRedo.changeDescription || `Redo line change (Page ${lastRedo.pageIndex}, Line ${lastRedo.lineIndex})`;
    }
  }
}