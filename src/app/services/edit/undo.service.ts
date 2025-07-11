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

// Union type for all possible undo items
export type AnyUndoItem = UndoStackItem | SceneOrderUndoItem | DocumentReorderUndoItem | SceneReorderUndoItem;

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
    
    console.log(`[UNDO] Recorded document reorder change: ${changeDescription || 'Document reordering'}`);
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
    
    console.log(`[UNDO] Recorded scene reorder change: ${changeDescription || 'Scene reordering with document update'}`);
  }

  /**
   * Undo the last change by restoring the previous state
   * Handles both line changes and scene order changes
   * 
   * @returns The undo item that was processed, or null if nothing to undo
   */
  undo(): AnyUndoItem | null {
    console.log('🔄 UNDO Service: undo() method called');
    console.log('🔄 UNDO Service: Undo stack size:', this.undoStack.length);
    
    if (this.undoStack.length === 0) {
      console.log('🔄 UNDO Service: No undo items available');
      return null;
    }

    const undoItem = this.undoStack.pop()!;
    console.log('🔄 UNDO Service: Processing undo item:', undoItem);
    console.log('🔄 UNDO Service: Undo item type:', this.getUndoItemType(undoItem));
    
    // Add to redo stack
    this.redoStack.push(undoItem);

    // Handle different types of undo items
    if (this.isSceneReorderUndoItem(undoItem)) {
      console.log('🔄 UNDO Service: Processing as scene reorder undo item');
      this.handleSceneReorderUndo(undoItem as SceneReorderUndoItem);
    } else if (this.isSceneOrderUndoItem(undoItem)) {
      console.log('🔄 UNDO Service: Processing as scene order undo item');
      this.handleSceneOrderUndo(undoItem as SceneOrderUndoItem);
    } else if (this.isDocumentReorderUndoItem(undoItem)) {
      console.log('🔄 UNDO Service: Processing as document reorder undo item');
      this.handleDocumentReorderUndo(undoItem as DocumentReorderUndoItem);
    } else {
      console.log('🔄 UNDO Service: Processing as line change undo item');
      this.handleLineChangeUndo(undoItem as UndoStackItem);
    }

    // Notify components about the undo operation
    this.undoRedoSubject.next({ type: 'undo', item: undoItem });
    console.log('🔄 UNDO Service: Undo operation completed');

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
    
    if (this.isSceneReorderUndoItem(redoItem)) {
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
   * Type guard to check if an undo item is a document reorder change
   */
  private isDocumentReorderUndoItem(item: AnyUndoItem): item is DocumentReorderUndoItem {
    return (item as DocumentReorderUndoItem).type === 'document-reorder';
  }

  /**
   * Type guard to check if an undo item is a scene reorder change (combined)
   */
  private isSceneReorderUndoItem(item: AnyUndoItem): item is SceneReorderUndoItem {
    return (item as SceneReorderUndoItem).type === 'scene-reorder';
  }

  /**
   * Handle undoing a scene order change
   */
  private handleSceneOrderUndo(undoItem: SceneOrderUndoItem): void {
    console.log('🔄 UNDO Service: handleSceneOrderUndo called');
    console.log('🔄 UNDO Service: Previous scene order:', undoItem.previousSceneOrder?.map(s => s.sceneNumberText));
    
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
      return;
    }

    // Get current scene order before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    console.log('🔄 UNDO Service: Current scene order before restore:', currentSceneOrder?.map(s => s.sceneNumberText));
    
    // Create redo item with current state (don't add to stack here, it's already done in undo())
    
    console.log('🔄 UNDO Service: About to call setSelectedScenes with:', undoItem.previousSceneOrder?.map(s => s.sceneNumberText));
    
    // IMPORTANT: Set the selected scenes first
    this.pdfService.setSelectedScenes(undoItem.previousSceneOrder);
    console.log('🔄 UNDO Service: setSelectedScenes called successfully');
    
    // CRITICAL: Ensure the scene order update is emitted
    // The setSelectedScenes method should emit to _sceneOrderUpdated$, but let's make sure
    if (this.pdfService._sceneOrderUpdated$) {
      this.pdfService._sceneOrderUpdated$.next([...undoItem.previousSceneOrder]);
      console.log('🔄 UNDO Service: Manually emitted scene order update');
    }
    
    // Then reorder the document
    console.log('🔄 UNDO Service: About to call reorderScenes with:', undoItem.previousSceneOrder?.map(s => s.sceneNumberText));
    this.pdfService.reorderScenes(undoItem.previousSceneOrder);
    console.log('🔄 UNDO Service: reorderScenes called successfully');
    
    console.log(`[UNDO] Scene order restored`);
  }

  /**
   * Handle undoing a document reorder change
   */
  private handleDocumentReorderUndo(undoItem: DocumentReorderUndoItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
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
    
    console.log(`[UNDO] Document reorder restored`);
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
    
    // Restore redo scene order and regenerate document
    this.pdfService.setSelectedScenes(redoItem.previousSceneOrder);
    this.pdfService.reorderScenes(redoItem.previousSceneOrder);
    
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
    this.resetSubject.next();
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
        
        // Trigger the observable to notify all components with the specific line update
        this.pdfService._finalDocumentData$.next({
          docPageIndex: undoItem.pageIndex,
          docPageLineIndex: undoItem.lineIndex,
          line: cloneDeep(undoItem.previousLineState)
        });
        
        console.log(`[UNDO] Line state restored in PdfService: Page ${undoItem.pageIndex}, Line ${undoItem.lineIndex}`);
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
    console.log('🔄 UNDO Service: handleSceneReorderUndo called');
    console.log('🔄 UNDO Service: Previous scene order:', undoItem.previousSceneOrder?.map(s => s.sceneNumberText));
    
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
      return;
    }

    // Get current scene order and document state before restoring
    const currentSceneOrder = cloneDeep(this.pdfService.getSelectedScenes());
    const currentDocumentState = cloneDeep(this.pdfService.finalDocument);
    
    console.log('🔄 UNDO Service: Current scene order before restore:', currentSceneOrder?.map(s => s.sceneNumberText));
    
    // Create redo item with current state (don't add to stack here, it's already done in undo())
    
    console.log('🔄 UNDO Service: About to call setSelectedScenes with:', undoItem.previousSceneOrder?.map(s => s.sceneNumberText));
    
    // IMPORTANT: Set the selected scenes first
    this.pdfService.setSelectedScenes(undoItem.previousSceneOrder);
    console.log('🔄 UNDO Service: setSelectedScenes called successfully');
    
    // CRITICAL: Ensure the scene order update is emitted
    if (this.pdfService._sceneOrderUpdated$) {
      this.pdfService._sceneOrderUpdated$.next([...undoItem.previousSceneOrder]);
      console.log('🔄 UNDO Service: Manually emitted scene order update');
    }
    
    // Restore the previous document state
    this.pdfService.finalDocument = cloneDeep(undoItem.previousDocumentState);
    
    // Trigger document regeneration to update all components
    this.pdfService._documentRegenerated$.next(true);
    
    console.log(`[UNDO] Scene reorder restored (scene order + document state)`);
  }

  /**
   * Handle redoing a scene reorder change
   */
  private handleSceneReorderRedo(redoItem: SceneReorderUndoItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
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
    
    console.log(`[UNDO] Scene reorder redone`);
  }

  /**
   * Handle redoing a document reorder change
   */
  private handleDocumentReorderRedo(redoItem: DocumentReorderUndoItem): void {
    if (!this.pdfService) {
      console.error('[UNDO] PdfService not available');
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
    
    console.log(`[UNDO] Document reorder redone`);
  }
}