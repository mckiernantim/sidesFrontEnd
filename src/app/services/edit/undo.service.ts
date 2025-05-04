import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Line } from 'src/app/types/Line';
import { cloneDeep } from 'lodash';

// Enhanced interface to support different types of changes
export interface UndoStackItem {
  pageIndex: number;
  line: Line;
  type: 'position' | 'category' | 'text' | 'visibility' | 'general' | 'scene-number' | 'bar';
  originalPosition?: { x: string; y: string };
  originalCategory?: string;
  originalText?: string;
  originalVisibility?: string;
  isEndSpan?: boolean;
  isContinueSpan?: boolean;
  isStartSpan?: boolean;
  originalSceneNumber?: string;
  newSceneNumber?: string;
  affectedLines?: Line[];
  originalBarState?: {
    bar?: string;
    end?: string;
    cont?: string;
    calculatedBarY?: string | number;
    calculatedEnd?: string | number;
    startTextOffset?: number;
    endTextOffset?: number;
    continueTextOffset?: number;
    continueTopTextOffset?: number;
  };
  barType?: 'start' | 'end' | 'continue' | 'continue-top';
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

  // Add the redoStack property declaration to the UndoService class
  private redoStack: any[] = [];

  // Change the getter to a private property with a public getter/setter
  private _canUndo: boolean = false;
  private _canRedo: boolean = false;

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
    return this._canUndo;
  }

  /**
   * Check if the redo stack has items
   */
  get canRedo(): boolean {
    return this._canRedo;
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

  // Add this method to your UndoService class
  recordTextChange(pageIndex: number, line: any, originalText: string): void {
    this.undoStack.push({
      type: 'text',
      pageIndex: pageIndex,
      line: line,
      originalText: originalText
    });
  }

  /**
   * Record a position change
   * @param pageIndex The page index
   * @param line The line being changed
   * @param originalPosition The original position
   * @param isEndSpan Whether this is an end span position change
   * @param isContinueSpan Whether this is a continue span position change
   * @param isStartSpan Whether this is a start span position change
   */
  recordPositionChange(
    pageIndex: number, 
    line: Line, 
    originalPosition: any, 
    isEndSpan: boolean = false,
    isContinueSpan: boolean = false,
    isStartSpan: boolean = false
  ) {
    this.push({
      pageIndex,
      line,
      type: 'position',
      originalPosition,
      isEndSpan,
      isContinueSpan,
      isStartSpan
    });
  }

  // Fix the recordChange method
  recordChange(change: any): void {
    // Store the change in the undo stack
    this.undoStack.push(change);
    
    // Reset the redo stack when a new change is made
    this.redoStack = [];
    
    // Update the canUndo property
    this._canUndo = this.undoStack.length > 0;
    
    // Update the canRedo property
    this._canRedo = this.redoStack.length > 0;
  }

  // Make sure any methods using redoStack have proper access to it
  // For example, if there's a method like:
  clearRedoStack() {
    this.redoStack = [];
  }

  /**
   * Record a scene number change that affects multiple lines
   * @param pageIndex The page index
   * @param lines The affected lines
   * @param originalSceneNumber The original scene number
   * @param newSceneNumber The new scene number
   */
  recordSceneNumberChange(
    pageIndex: number,
    lines: any[],
    originalSceneNumber: string,
    newSceneNumber: string
  ): void {
    // Create a deep copy of the affected lines
    const affectedLines = cloneDeep(lines);
    
    this.push({
      pageIndex,
      line: affectedLines[0], // We'll use the first line as a reference
      type: 'scene-number',
      originalSceneNumber,
      newSceneNumber,
      affectedLines
    });
    
    // Update undo/redo state
    this._canUndo = this.undoStack.length > 0;
    this.redoStack = [];
    this._canRedo = false;
  }

  /**
   * Record a bar change (START, END, CONTINUE, or CONTINUE-TOP)
   * @param pageIndex The page index
   * @param line The line being changed
   * @param originalState The original bar state
   * @param barType The type of bar being changed
   */
  recordBarChange(
    pageIndex: number,
    line: Line,
    originalState: any,
    barType: 'start' | 'end' | 'continue' | 'continue-top'
  ) {
    this.push({
      pageIndex,
      line,
      type: 'bar',
      originalBarState: originalState,
      barType
    });
  }
}

