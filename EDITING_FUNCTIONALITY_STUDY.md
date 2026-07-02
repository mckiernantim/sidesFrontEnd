# Last-Looks Page Text Editing Functionality Study

## Overview
This document provides a comprehensive analysis of the text editing functionality in the `last-looks-page.component.ts`. The editing system allows users to modify line text through a context menu interface, with full undo/redo support and real-time PDF synchronization.

## Table of Contents
1. [User Interaction Flow](#user-interaction-flow)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Context Menu System](#context-menu-system)
5. [Text Editing Process](#text-editing-process)
6. [PDF Service Integration](#pdf-service-integration)
7. [Parent Component Communication](#parent-component-communication)
8. [Undo/Redo System](#undo-redo-system)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)

## User Interaction Flow

### Step 1: Line Selection
```typescript
// User clicks on a line element
(click)="canEditDocument && selectLine(line, $event)"
```

**Method: `selectLine(line: Line, event: MouseEvent)`**
- **Purpose**: Manages line selection state
- **Parameters**:
  - `line`: The Line object being clicked
  - `event`: MouseEvent for modifier key detection
- **Logic**:
  1. Checks `canEditDocument` permission
  2. Extracts `lineId` from `line.docPageLineIndex`
  3. Handles different selection modes:
     - **Single click**: Replaces selection with clicked line
     - **Ctrl/Cmd + click**: Toggles line in multi-selection
     - **Shift + click**: Selects range between last selected and current line
  4. Updates `selectedLineIds` array
  5. Calls `emitSelectedLines()` to notify parent
  6. Triggers change detection

### Step 2: Context Menu Activation
```html
<!-- Host listener for right-click events -->
@HostListener('document:contextmenu', ['$event'])
onContextMenu(event: MouseEvent)
```

**Method: `onContextMenu(event: MouseEvent)`**
- **Purpose**: Detects right-click on line elements and opens context menu
- **Process**:
  1. Finds closest `li` element to click target
  2. Extracts line ID from element's `id` attribute
  3. Finds corresponding Line object using `docPageLineIndex`
  4. Calls `openContextMenu(event, line, lineId)`

### Step 3: Context Menu Display
**Method: `openContextMenu(event: MouseEvent, line: any, lineIndex: number)`**
- **Purpose**: Shows context menu with editing options
- **Logic**:
  1. Prevents default browser context menu
  2. **Auto-selection**: If no lines selected, selects the right-clicked line
  3. Sets menu position based on mouse coordinates
  4. Updates component state for menu display

### Step 4: Edit Text Selection
```html
<li (click)="editSelectedLineText($event)" class="classification-option text-blue-600">
    Edit Text
</li>
```

**Method: `editSelectedLineText(event: Event)`**
- **Purpose**: Initiates text editing for selected line
- **Validation**: Only allows editing when exactly 1 line is selected
- **Process**:
  1. Stops event propagation
  2. Hides context menu
  3. Finds selected line by `docPageLineIndex`
  4. Calls `startEditingLine(lineId, line.text)`

## Component Architecture

### Key Properties
```typescript
// Editing state
editingLine: number | null = null;        // Currently editing line ID
editingText: string = '';                // Current text being edited

// Selection state
selectedLineIds: number[] = [];           // Array of selected line IDs
lastSelectedIndex: number | null = null; // Last selected line ID

// UI state
showContextMenu: boolean = false;        // Context menu visibility
contextMenuPosition: { x: number; y: number } = { x: 0, y: 0 };
```

### Template Structure
```html
<!-- Editable line with conditional contenteditable -->
<li id="{{ line.docPageLineIndex }}"
    [contentEditable]="isLineEditing(line)"
    [class.editing]="editingLine === line.docPageLineIndex"
    [style.background-color]="editingLine === line.docPageLineIndex ? 'orange' : 'transparent'"
    (blur)="editingLine === line.docPageLineIndex && saveEdit()"
    (keydown)="editingLine === line.docPageLineIndex && handleEditKeyDown($event)"
    (input)="editingLine === line.docPageLineIndex && onEditTextChange($event.target.textContent)">
    {{ line.text }}
</li>
```

## State Management

### Selection State
- **`selectedLineIds[]`**: Array of `docPageLineIndex` values for selected lines
- **`lastSelectedIndex`**: Stores the most recent selection for range operations
- **Selection methods**:
  - `selectLine()`: Updates selection based on user clicks
  - `clearSelection()`: Resets all selection state
  - `emitSelectedLines()`: Notifies parent of selection changes

### Editing State
- **`editingLine`**: Currently active line ID (`docPageLineIndex`)
- **`editingText`**: Temporary storage for text being edited
- **State transitions**:
  - `null` → `lineId`: Enter editing mode
  - `lineId` → `null`: Exit editing mode

### UI State
- **`showContextMenu`**: Controls context menu visibility
- **`contextMenuPosition`**: Mouse coordinates for menu placement

## Context Menu System

### Menu Structure
```html
<div *ngIf="showContextMenu" class="context-menu">
    <ul>
        <!-- Category options -->
        <li *ngFor="let choice of categoryPresets"
            (click)="changeLineCategory($event, choice.category, choice.xPos, selectedLine, selectedLineIndex)">
            {{ choice.label }}
        </li>

        <!-- Edit Text option -->
        <li (click)="editSelectedLineText($event)" class="text-blue-600">
            Edit Text
        </li>

        <!-- Delete option -->
        <li (click)="changeLineCategory($event, 'hidden', '', selectedLine, selectedLineIndex)"
            class="text-red-500">
            Delete
        </li>
    </ul>
</div>
```

### Category Presets
```typescript
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
```

## Text Editing Process

### Phase 1: Initiation
**Method: `startEditingLine(lineId: number, text: string)`**
1. **Validation**: Confirms line exists in current page
2. **Undo Recording**: Calls `undoService.recordLineChange()` before changes
3. **State Update**: Sets `editingLine` and `editingText`
4. **UI Update**: Triggers change detection
5. **Focus Management**: Uses `setTimeout` to focus editable element

### Phase 2: Active Editing
**Template Binding: `[contentEditable]="isLineEditing(line)"`**
- **Method: `isLineEditing(line: any)`**: Returns `editingLine === line.docPageLineIndex`
- **CSS Classes**: Adds `editing` class for visual feedback
- **Background**: Changes to orange during editing
- **Event Handlers**:
  - `(input)`: Tracks text changes in real-time
  - `(keydown)`: Handles Enter/Escape keys
  - `(blur)`: Saves changes when focus lost

### Phase 3: Saving Changes
**Method: `saveEdit()`**
1. **Validation**: Ensures `editingLine` is set and line exists
2. **Undo Recording**: Records the text change for undo functionality
3. **PDF Update**: Calls `pdfService.updateLine()` with new text
4. **State Reset**: Clears `editingLine` and `editingText`
5. **UI Update**: Triggers change detection

### Phase 4: Cancellation
**Method: `cancelEdit()`**
1. **State Reset**: Clears editing state without saving
2. **UI Update**: Removes editing visual indicators

## PDF Service Integration

### Update Flow
```typescript
// In saveEdit()
this.pdfService.updateLine(
    this.currentPageIndex,    // Page index in document
    lineIndex,                // Line index within page
    { ...line, text: this.editingText } // Updated line object
);
```

### Observable Pattern
```typescript
// PDF service emits updates
this._finalDocumentData$.next({
    docPageIndex: pageIndex,
    docPageLineIndex: lineIndex,
    line: updatedLine
});

// Parent component subscribes
this.finalDocumentDataSubscription = this.pdf.finalDocumentData$.subscribe(data => {
    // Update local page data
    if (this.pages[data.docPageIndex]) {
        const page = this.pages[data.docPageIndex];
        const lineIndex = page.findIndex(line => line.docPageLineIndex === data.docPageLineIndex);
        if (lineIndex !== -1) {
            page[lineIndex] = data.line;
            // Update current page if needed
            if (data.docPageIndex === this.currentPageIndex) {
                this.currentPage = [...page];
            }
        }
    }
});
```

## Parent Component Communication

### Event Emissions
```typescript
// Page updates (currently commented out in saveEdit)
this.pageUpdate.emit([...this.page]);

// Line selection
this.lineSelected.emit(selectedLine);

// Category changes
this.categoryChanged.emit({ line, lineIndex, category });

// Position changes
this.positionChanged.emit(changeData);
```

### Parent Handling
**Method: `handlePageUpdate(updatedPage: any)`**
1. Updates local page state: `this.pages[this.currentPageIndex] = [...updatedPage]`
2. Updates PDF service for each line in the page
3. Updates current page reference
4. Triggers change detection

## Undo/Redo System

### Recording Changes
```typescript
// In startEditingLine() - records BEFORE changes
this.undoService.recordLineChange(
    this.currentPageIndex,
    lineIndex,
    line, // Original line state
    `Edit line text: "${text}"`
);

// In saveEdit() - records the actual change
this.undoService.recordLineChange(
    this.currentPageIndex,
    lineIndex,
    originalLine, // Pre-change state
    `Edit line text: "${originalText}" → "${this.editingText}"`
);
```

### Undo Process
**Method: `undoService.undo()`**
1. Retrieves last undo item from stack
2. Calls `restoreLineState(undoItem)` to revert line
3. Updates PDF service observable
4. Moves item to redo stack

### Redo Process
**Method: `undoService.redo()`**
1. Retrieves last redo item from stack
2. Calls `restoreLineState(redoItem)` to reapply change
3. Updates PDF service observable
4. Moves item to undo stack

## Error Handling

### Validation Points
1. **Permission Check**: `canEditDocument` must be true
2. **Selection Validation**: Exactly 1 line must be selected for editing
3. **Line Existence**: Line must exist in current page
4. **PDF Service**: Update operations include error handling

### Recovery Mechanisms
1. **State Reset**: Failed operations reset editing state
2. **User Feedback**: Console logging for debugging
3. **Graceful Degradation**: Operations fail silently if conditions not met

## Performance Considerations

### Change Detection Optimization
- Uses `OnPush` change detection strategy where applicable
- Manual `cdRef.detectChanges()` calls for targeted updates
- Avoids unnecessary `pageUpdate.emit()` calls during editing

### Memory Management
- `undoService` limits stack size (default: 50 items)
- Deep cloning for state preservation
- Proper subscription cleanup in `ngOnDestroy`

### Event Handling
- Event propagation stopped to prevent conflicts
- Host listeners for global events (context menu, clicks)
- Debounced operations where appropriate

## Common Issues & Solutions

### Issue: Context menu not showing
**Symptoms**: Right-click doesn't open menu
**Causes**:
- No lines selected AND right-clicked line not auto-selected
- `canEditDocument` is false
- Event propagation issues
**Solutions**:
- Ensure auto-selection logic works
- Check edit permissions
- Verify event handlers are attached

### Issue: Line not becoming editable
**Symptoms**: Edit Text clicked but line stays read-only
**Causes**:
- `editingLine` not set correctly
- `isLineEditing()` returns false
- Template binding issues
- Change detection not triggered
**Solutions**:
- Verify `startEditingLine()` is called
- Check `editingLine` value matches `line.docPageLineIndex`
- Ensure `cdRef.detectChanges()` is called
- Verify template binding syntax

### Issue: Changes not saved
**Symptoms**: Text edited but reverts on blur
**Causes**:
- `saveEdit()` not called on blur
- PDF service update fails
- Parent component doesn't receive updates
**Solutions**:
- Check blur event handler
- Verify PDF service integration
- Ensure parent subscription works

### Issue: Selection state lost
**Symptoms**: Lines become unselected unexpectedly
**Causes**:
- Component re-initialization
- Parent component changes page data
- Clear selection called inappropriately
**Solutions**:
- Preserve selection across page changes
- Use proper lifecycle management
- Avoid unnecessary state resets

## Debugging Checklist

### For Selection Issues
1. ✅ `selectLine()` method called on click
2. ✅ `selectedLineIds` array updated correctly
3. ✅ `emitSelectedLines()` called
4. ✅ Parent component receives selection event

### For Context Menu Issues
1. ✅ Right-click detected by host listener
2. ✅ `li` element found with correct ID
3. ✅ Line object retrieved from page array
4. ✅ `openContextMenu()` called
5. ✅ `showContextMenu` set to true
6. ✅ Menu positioned correctly

### For Editing Issues
1. ✅ "Edit Text" option visible in menu
2. ✅ `editSelectedLineText()` called on click
3. ✅ Exactly 1 line selected
4. ✅ `startEditingLine()` called
5. ✅ `editingLine` set to correct line ID
6. ✅ `isLineEditing()` returns true for target line
7. ✅ `contentEditable` attribute set to true
8. ✅ Element receives focus
9. ✅ Text input works
10. ✅ Blur event triggers `saveEdit()`
11. ✅ PDF service updated successfully

This comprehensive study covers the complete editing workflow from user interaction through data persistence, providing a solid foundation for debugging and maintaining the text editing functionality.
