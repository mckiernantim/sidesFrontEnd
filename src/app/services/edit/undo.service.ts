import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Line } from 'src/app/types/Line';
import { cloneDeep } from 'lodash';

// Enhanced interface to support different types of changes
export interface UndoStackItem {
  pageIndex: number;
  line: Line;
  type: 'position' | 'category' | 'text' | 'visibility' | 'general';
  originalPosition?: { x: string; y: string };
  originalCategory?: string;
  originalText?: string;
  originalVisibility?: string;
  // Add any other properties you might need to restore
}

@Injectable({
  providedIn: 'root',
})
export class UndoService {
  private undoStack: UndoStackItem[] = [];
  private initialDocState: Line[][] = []; // Store initial document state
  private undoStackSource = new BehaviorSubject<UndoStackItem | null>(null);
  private changeSubject = new Subject<UndoStackItem>();
  private resetSubject = new Subject<void>();
  
  // This is set in our last-looks-component
  public currentPageIndex: number; 
  
  // Observables
  undoStack$ = this.undoStackSource.asObservable();
  change$ = this.changeSubject.asObservable();
  reset$ = this.resetSubject.asObservable();

  /**
   * Store the initial state of the document
   * @param docState The initial document state
   */
  setInitialState(docState: Line[][]) {
    // Deep clone to avoid reference issues
    this.initialDocState = cloneDeep(docState);
    console.log('Initial document state stored', this.initialDocState.length);
  }

  /**
   * Get the initial document state
   * @returns The initial document state
   */
  getInitialState(): Line[][] {
    return cloneDeep(this.initialDocState);
  }

  /**
   * Push a change to the undo stack
   * @param item The change to record
   */
  push(item: UndoStackItem) {
    // Create a deep copy to avoid reference issues
    const changeToRecord = {
      ...item,
      line: cloneDeep(item.line)
    };
    
    this.undoStack.push(changeToRecord);
    console.log('Added to undo stack:', changeToRecord);
  }

  /**
   * Record a visibility change
   * @param pageIndex The page index
   * @param line The line being changed
   * @param originalVisibility The original visibility value
   */
  recordVisibilityChange(pageIndex: number, line: Line, originalVisibility: string) {
    this.push({
      pageIndex,
      line,
      type: 'visibility',
      originalVisibility
    });
  }

  /**
   * Pop the last change from the stack and apply it
   * @returns The item that was undone, or null if stack is empty
   */
  pop(): UndoStackItem | null {
    if (this.undoStack.length === 0) return null;
    
    const lastChange = this.undoStack.pop();
    if (!lastChange) return null;
    
    console.log('Undoing change:', lastChange);
    
    // Notify subscribers about the change
    this.notifyUndoStackChange(lastChange);
    this.changeSubject.next(lastChange);
    
    return lastChange;
  }

  /**
   * Trigger a document reset
   */
  resetDocument() {
    this.resetSubject.next();
  }

  /**
   * Get the current size of the undo stack
   */
  get stackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Check if the undo stack has items
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Reset the undo stack
   */
  reset() {
    this.undoStack = [];
    this.notifyUndoStackChange(null);
  }

  /**
   * Notify subscribers about changes to the undo stack
   */
  private notifyUndoStackChange(val: UndoStackItem | null) {
    this.undoStackSource.next(val);
  }
}

