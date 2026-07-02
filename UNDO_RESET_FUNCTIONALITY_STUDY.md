# Undo/Redo and Document Reset Functionality Study

## Overview
This document provides a comprehensive analysis of the undo/redo and document reset functionality in the Sides-Ways application. The system provides users with the ability to undo any changes made to documents, including text edits, scene reordering, category changes, and position adjustments, as well as reset the entire document to its initial state.

## Table of Contents
1. [Undo Service Architecture](#undo-service-architecture)
2. [Undo Item Types](#undo-item-types)
3. [Recording Changes](#recording-changes)
4. [Undo/Redo Operations](#undo-redo-operations)
5. [Document Reset Functionality](#document-reset-functionality)
6. [PDF Service Integration](#pdf-service-integration)
7. [Component Integration](#component-integration)
8. [User Interface](#user-interface)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)

## Undo Service Architecture

### Core Structure
```typescript
@Injectable({
  providedIn: 'root'
})
export class UndoService {
  private undoStack: AnyUndoItem[] = [];
  private redoStack: AnyUndoItem[] = [];
  private resetSubject = new Subject<void>();
  private undoRedoSubject = new Subject<{ type: 'undo' | 'redo', item: AnyUndoItem }>();

  // Observable for reset events
  reset$ = this.resetSubject.asObservable();

  // Observable for undo/redo operations
  undoRedo$ = this.undoRedoSubject.asObservable();

  // PDF Service reference (injected)
  private pdfService: any;
}
```

### Key Properties
- **`undoStack[]`**: Array of undoable operations (newest at end)
- **`redoStack[]`**: Array of redoable operations (newest at end)
- **`maxStackSize`**: Maximum number of operations to keep (default: 50)
- **`pdfService`**: Reference to PDF service for state restoration

### Observable Pattern
```typescript
// Notify components when reset occurs
reset$.subscribe(() => {
  // Handle document reset
});

// Notify components of undo/redo operations
undoRedo$.subscribe(({ type, item }) => {
  // Handle undo/redo UI updates
});
```

## Undo Item Types

### 1. Line Change Items
**Purpose**: Records changes to individual lines (text, category, position)
```typescript
interface UndoStackItem {
  pageIndex: number;           // Document page index
  lineIndex: number;           // Line index within page
  previousLineState: Line;      // Complete line state before change
  timestamp: number;
  changeDescription?: string;
}
```

### 2. Scene Order Items
**Purpose**: Records scene reordering operations
```typescript
interface SceneOrderUndoItem {
  type: 'scene-order';
  previousSceneOrder: any[];    // Complete scene order before change
  timestamp: number;
  changeDescription?: string;
}
```

### 3. Document Reorder Items
**Purpose**: Records document-wide reordering (page movement)
```typescript
interface DocumentReorderUndoItem {
  type: 'document-reorder';
  previousDocumentState: any;   // Complete document state before change
  timestamp: number;
  changeDescription?: string;
}
```

### 4. Scene Reorder Items (Combined)
**Purpose**: Records scene reordering that also affects document structure
```typescript
interface SceneReorderUndoItem {
  type: 'scene-reorder';
  previousSceneOrder: any[];     // Scene order before change
  previousDocumentState: any;    // Document state before change
  timestamp: number;
  changeDescription?: string;
}
```

## Recording Changes

### Line Changes
**Method: `recordLineChange()`**
```typescript
recordLineChange(
  pageIndex: number,
  lineIndex: number,
  currentLineState: Line,
  changeDescription?: string
): void {
  const undoItem: UndoStackItem = {
    pageIndex,
    lineIndex,
    previousLineState: cloneDeep(currentLineState), // Deep clone
    timestamp: Date.now(),
    changeDescription
  };

  this.undoStack.push(undoItem);
  this.redoStack = []; // Clear redo stack on new change
  this.trimStackIfNeeded();
}
```

**When Called**:
- Before text editing (`startEditingLine()`)
- Before category changes (`changeLineCategory()`)
- Before position changes (drag operations)
- Before any line modification

### Scene Operations
**Method: `recordSceneOrderChange()`**
```typescript
recordSceneOrderChange(
  currentSceneOrder: any[],
  changeDescription?: string
): void {
  const undoItem: SceneOrderUndoItem = {
    type: 'scene-order',
    previousSceneOrder: cloneDeep(currentSceneOrder),
    timestamp: Date.now(),
    changeDescription
  };

  this.undoStack.push(undoItem);
  this.redoStack = [];
}
```

### Document Operations
**Method: `recordDocumentReorderChange()`**
```typescript
recordDocumentReorderChange(
  currentDocumentState: any,
  changeDescription?: string
): void {
  const undoItem: DocumentReorderUndoItem = {
    type: 'document-reorder',
    previousDocumentState: cloneDeep(currentDocumentState),
    timestamp: Date.now(),
    changeDescription
  };

  this.undoStack.push(undoItem);
  this.redoStack = [];
}
```

### Combined Scene/Document Operations
**Method: `recordSceneReorderChange()`**
```typescript
recordSceneReorderChange(
  currentSceneOrder: any[],
  currentDocumentState: any,
  changeDescription?: string
): void {
  const undoItem: SceneReorderUndoItem = {
    type: 'scene-reorder',
    previousSceneOrder: cloneDeep(currentSceneOrder),
    previousDocumentState: cloneDeep(currentDocumentState),
    timestamp: Date.now(),
    changeDescription
  };

  this.undoStack.push(undoItem);
  this.redoStack = [];
}
```

## Undo/Redo Operations

### Undo Process
**Method: `undo()`**
```typescript
undo(): AnyUndoItem | null {
  if (this.undoStack.length === 0) return null;

  const undoItem = this.undoStack.pop()!;
  this.redoStack.push(undoItem);

  // Handle different item types
  switch (this.getUndoItemType(undoItem)) {
    case 'scene-reorder':
      this.handleSceneReorderUndo(undoItem as SceneReorderUndoItem);
      break;
    case 'scene-order':
      this.handleSceneOrderUndo(undoItem as SceneOrderUndoItem);
      break;
    case 'document-reorder':
      this.handleDocumentReorderUndo(undoItem as DocumentReorderUndoItem);
      break;
    default:
      this.handleLineChangeUndo(undoItem as UndoStackItem);
  }

  // Notify components
  this.undoRedoSubject.next({ type: 'undo', item: undoItem });
  return undoItem;
}
```

### Redo Process
**Method: `redo()`**
```typescript
redo(): AnyUndoItem | null {
  if (this.redoStack.length === 0) return null;

  const redoItem = this.redoStack.pop()!;
  this.undoStack.push(redoItem);

  // Handle different item types (similar to undo)
  switch (this.getUndoItemType(redoItem)) {
    case 'scene-reorder':
      this.handleSceneReorderRedo(redoItem as SceneReorderUndoItem);
      break;
    // ... other cases
  }

  this.undoRedoSubject.next({ type: 'redo', item: redoItem });
  return redoItem;
}
```

### Line State Restoration
**Method: `restoreLineState()`**
```typescript
private restoreLineState(undoItem: UndoStackItem): void {
  // Update PDF service document data directly
  if (this.pdfService.finalDocument?.data) {
    const page = this.pdfService.finalDocument.data[undoItem.pageIndex];
    if (page && page[undoItem.lineIndex]) {
      // Replace entire line with previous state
      this.pdfService.finalDocument.data[undoItem.pageIndex][undoItem.lineIndex] =
        cloneDeep(undoItem.previousLineState);

      // Emit update through observable
      this.pdfService._finalDocumentData$.next({
        docPageIndex: undoItem.pageIndex,
        docPageLineIndex: undoItem.lineIndex,
        line: cloneDeep(undoItem.previousLineState)
      });
    }
  }
}
```

## Document Reset Functionality

### PDF Service Reset
**Method: `resetToInitialState()`**
```typescript
resetToInitialState(): void {
  if (this.initialDocumentState) {
    // Restore complete document state
    this.finalDocument = JSON.parse(JSON.stringify(this.initialDocumentState));

    // Reset flags
    this.finalDocReady = true;

    // Emit regeneration event
    this._documentRegenerated$.next(true);
  }
}
```

### Global Reset
**Method: `resetDocumentState()` (PDF Service)**
```typescript
resetDocumentState(): void {
  console.log('PdfService: Resetting all document state');

  // Clear all document data
  this.finalPdfData = null;
  this.callsheet = null;
  this.selected = [];
  this.watermark = null;
  this.script = null;
  this.finalDocument = null;
  this.initialFinalDocState = null;
  this.allLines = [];
  this.firstAndLastLinesOfScene = [];
  this.individualPages = [];
  this.finalDocReady = false;
  this.scenes = [];
  this.initialSelection = [];
  this.pages = [];
  // ... clear all other state

  // Reset observables
  this._documentReordered$.next(false);
  this._documentRegenerated$.next(false);
  this._finalDocumentData$.next(null);

  // Reset scene-related state
  this._selectedScenes = [];
  // ... reset all scene state

  // Reset undo service
  if (this.undoService) {
    this.undoService.reset();
  }

  // Clear localStorage items
  localStorage.removeItem('name');
  localStorage.removeItem('callSheetPath');
  localStorage.removeItem('callsheetData');
  // ... clear other localStorage items
}
```

### Component-Level Reset
**Method: `resetDocumentToInitialState()` (Last-Looks Component)**
```typescript
resetDocumentToInitialState() {
  if (this.initialDocState && this.initialDocState.length > 0) {
    console.log('Resetting document to initial state');

    // Restore pages array
    this.pages = JSON.parse(JSON.stringify(this.initialDocState));

    // Update current page
    this.currentPage = this.pages[this.currentPageIndex];

    // Process lines for display
    this.processLinesForLastLooks(this.pages);

    // Clear selections
    this.selectedLine = null;

    // Reset child component
    if (this.lastLooksPage) {
      this.lastLooksPage.resetPage(this.currentPage);
    }

    // Force change detection
    this.cdRef.detectChanges();

    console.log('Document reset to initial state complete');
  }
}
```

## PDF Service Integration

### Service Reference Injection
```typescript
// In PdfService constructor
constructor(public upload: UploadService, private undoService: UndoService) {
  // Set PDF service reference in undo service
  this.undoService.setPdfService(this);

  // Subscribe to reset events
  this.undoService.reset$.subscribe(() => {
    this.resetToInitialState();
  });
}
```

### Observable Integration
```typescript
// PDF Service emits line updates
this._finalDocumentData$.next({
  docPageIndex: pageIndex,
  docPageLineIndex: lineIndex,
  line: updatedLine
});

// Components subscribe to updates
this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(data => {
  // Update component state based on changes
});
```

### State Preservation
```typescript
// Store initial state after document processing
this.initialDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
this.initialFinalDocState = JSON.parse(JSON.stringify(this.finalDocument));
```

## Component Integration

### Keyboard Shortcuts
**Method: `handleGlobalKeyDown()` (Last-Looks-Page Component)**
```typescript
@HostListener('document:keydown', ['$event'])
handleGlobalKeyDown(event: KeyboardEvent): void {
  if (!this.canEditDocument) return;

  // Ctrl+Z for undo
  if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
    event.preventDefault();
    this.performUndo();
    return;
  }

  // Ctrl+Y or Ctrl+Shift+Z for redo
  if ((event.ctrlKey && event.key === 'y') ||
      (event.ctrlKey && event.shiftKey && event.key === 'z')) {
    event.preventDefault();
    this.performRedo();
    return;
  }
}
```

### Component Methods
```typescript
// Last-Looks-Page Component
performUndo(): void {
  this.undoService.undo();
  // PDF service automatically updates components
}

performRedo(): void {
  this.undoService.redo();
  // PDF service automatically updates components
}
```

### UI State Management
```typescript
// Computed properties for UI state
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
```

## User Interface

### Visual Feedback
```html
<!-- Undo/Redo buttons with state -->
<button [disabled]="!canUndo" (click)="performUndo()">
  Undo {{ getUndoInfo() }}
</button>

<button [disabled]="!canRedo" (click)="performRedo()">
  Redo
</button>
```

### Reset Functionality
```html
<!-- Reset document button -->
<button (click)="resetDocument()">
  Reset Document
</button>
```

### Keyboard Shortcuts Display
```html
<!-- Help text showing shortcuts -->
<div class="keyboard-shortcuts">
  <p>Ctrl+Z: Undo</p>
  <p>Ctrl+Y: Redo</p>
  <p>Ctrl+Shift+Z: Redo</p>
</div>
```

## Error Handling

### Validation Points
1. **Stack Limits**: Automatic trimming when `maxStackSize` exceeded
2. **Service Availability**: Checks for PDF service before operations
3. **State Existence**: Validates document/line existence before restoration
4. **Deep Cloning**: Prevents reference issues with `cloneDeep()`

### Recovery Mechanisms
1. **Graceful Degradation**: Operations fail silently if conditions not met
2. **State Consistency**: Ensures undo/redo stacks remain synchronized
3. **Memory Management**: Automatic cleanup of old operations
4. **Observable Safety**: Proper error handling in subscriptions

## Performance Considerations

### Memory Optimization
- **Stack Size Limits**: Default 50 operations maximum
- **Deep Cloning**: Only clones necessary data structures
- **Automatic Cleanup**: Old operations removed when limit exceeded
- **Reference Management**: Avoids circular references

### Change Detection
- **Targeted Updates**: Only updates affected components
- **Observable Pattern**: Efficient notification system
- **Lazy Evaluation**: State computed only when needed

### Operation Efficiency
- **Batch Operations**: `recordBatchChanges()` for multiple simultaneous changes
- **Immediate Restoration**: Direct PDF service updates avoid full re-renders
- **Observable Debouncing**: Prevents excessive UI updates

## Common Issues & Solutions

### Issue: Undo not working
**Symptoms**: Ctrl+Z doesn't undo changes
**Causes**:
- Changes not recorded in undo stack
- PDF service reference not set
- Component not subscribed to updates
**Solutions**:
- Verify `recordLineChange()` called before modifications
- Check `undoService.setPdfService(this)` in PDF constructor
- Ensure component subscribes to `finalDocumentData$`

### Issue: Document reset not working
**Symptoms**: Reset doesn't restore initial state
**Causes**:
- `initialDocumentState` not saved
- Reset subscription not established
- Component state not updated
**Solutions**:
- Verify `initialDocumentState` set after processing
- Check `undoService.reset$.subscribe()` in PDF service
- Ensure component handles document regeneration

### Issue: Memory leaks
**Symptoms**: Application slows down over time
**Causes**:
- Undo stack growing indefinitely
- Subscriptions not cleaned up
- Large document states kept in memory
**Solutions**:
- Set appropriate `maxStackSize`
- Implement `ngOnDestroy` cleanup
- Use shallow cloning where possible

### Issue: Inconsistent state
**Symptoms**: Undo/redo produces unexpected results
**Causes**:
- Changes recorded after modifications
- Reference issues with object cloning
- Concurrent modifications
**Solutions**:
- Always record BEFORE making changes
- Use `cloneDeep()` for state preservation
- Implement operation locking if needed

## Debugging Tools

### Stack Inspection
```typescript
// Get current stack information
const debugInfo = this.undoService.getDebugInfo();
console.log('Undo Debug Info:', debugInfo);

// Peek at next operations
const nextUndo = this.undoService.peekLastUndo();
const nextRedo = this.undoService.peekLastRedo();
```

### Operation Logging
```typescript
// Enable detailed logging
console.log('Recording undo:', changeDescription);
console.log('Stack sizes - Undo:', this.undoStack.length, 'Redo:', this.redoStack.length);
```

### State Validation
```typescript
// Verify document state consistency
const currentState = this.pdfService.finalDocument;
const initialState = this.pdfService.initialDocumentState;
console.log('State comparison:', {
  hasCurrent: !!currentState,
  hasInitial: !!initialState,
  pagesMatch: currentState?.data?.length === initialState?.data?.length
});
```

## Integration Points

### With Text Editing
1. **Before Edit**: `recordLineChange()` called in `startEditingLine()`
2. **After Edit**: Changes automatically tracked through blur/save events
3. **Undo**: Restores previous line state directly in PDF service

### With Category Changes
1. **Before Change**: `recordLineChange()` for all affected lines
2. **During Change**: Update PDF service and emit events
3. **Undo**: Batch restoration of all affected lines

### With Scene Operations
1. **Before Reorder**: `recordSceneReorderChange()` with full state
2. **During Reorder**: Update PDF service document structure
3. **Undo**: Restore both scene order and document structure

This comprehensive system ensures users can reliably undo any changes made to their documents, providing a robust editing experience with full state management and error recovery.
