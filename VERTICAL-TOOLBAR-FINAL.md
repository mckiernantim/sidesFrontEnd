# Vertical Right-Side Toolbar - Final Design

## Overview
Professional vertical toolbar positioned on the right side of the script page, containing all editing tools in a Miro/Figma-style interface.

## Visual Layout

```
                                           ┌────┐
                                           │ 3  │ Selection Count
                                           ├────┤
                                           │ 👁️ │ Visibility
                                           │ ↑  │ Start Bar
                                           │ ↓  │ End Bar
                                           │ ⇡  │ Continue Top
                                           │ ⇣  │ Continue
                                           ├────┤
                                           │ ↶  │ Undo
                                           │ ↷  │ Redo
                                           ├────┤
                                           │ 🔄 │ Reset
                                           │ ✓  │ Save
                                           └────┘
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                            ┃
┃  Script Page Content       ┃
┃                            ┃
┃                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

## Toolbar Position
- **Fixed**: Right side of viewport at `right: 20px`
- **Vertical Center**: `top: 50%` with `translateY(-50%)`
- **Z-Index**: 200 (floats above everything)
- **Animation**: Slides in from right on mount

## Toolbar Structure

### 1. Selection Badge (Top)
- **Circular badge** with gradient background
- Shows **number of selected lines**
- Only appears when lines are selected
- Pop animation on appear

### 2. Selection Tools Section
Separated by horizontal divider:

**👁️ Visibility Toggle**
- Shows eye icon when lines visible
- Shows crossed eye when lines hidden
- Disabled when no selection
- Active state: cyan background

**↑ Start Bar**
- Add/remove scene start marker
- Active when bar exists on selected line

**↓ End Bar**
- Add/remove scene end marker
- Active when bar exists on selected line

**⇡ Continue Top**
- Add/remove top continuation marker
- Active when marker exists

**⇣ Continue Bottom**
- Add/remove bottom continuation marker
- Active when marker exists

### 3. History Section
Separated by horizontal divider:

**↶ Undo**
- Undo last change
- Disabled when no undo history
- Keyboard: Ctrl+Z

**↷ Redo**
- Redo last undone change
- Disabled when no redo history
- Keyboard: Ctrl+Y

### 4. Document Actions Section
Separated by horizontal divider:

**🔄 Reset (Danger)**
- Reset all changes to initial state
- Shows confirmation dialog
- Red hover state

**✓ Save (Success)**
- Save current changes
- Green hover state

## Button Specifications

### Size
- Width: 40px
- Height: 40px
- Border-radius: 8px

### Icon
- Size: 20px × 20px
- Default color: #6b7280 (gray)

### States

**Default**
```css
Background: transparent
Icon: #6b7280 (gray)
Border: none
```

**Hover**
```css
Background: #f3f4f6 (light gray)
Icon: #111827 (dark gray)
Tooltip: Visible on left
```

**Active**
```css
Background: #00ffc4 (cyan)
Icon: #000 (black)
```

**Disabled**
```css
Opacity: 0.3
Cursor: not-allowed
```

**Danger Hover (Reset)**
```css
Background: #fef2f2 (light red)
Border: #fecaca (red)
Icon: #ef4444 (red)
```

**Success Hover (Save)**
```css
Background: #f0fdf4 (light green)
Border: #bbf7d0 (green)
Icon: #22c55e (green)
```

## Tooltip System

### Position
- Appears on the **left side** of buttons
- Arrow points to the right toward button
- Vertically centered with button

### Content
```
┌───────────────┐  ◄─┐
│ Continue Top  │    │
└───────────────┘    │
```

### Styling
- Background: #1f2937 (dark gray)
- Text: White, 12px, medium weight
- Padding: 6px 10px
- Border-radius: 6px
- Arrow: Triangle pointing right

### Timing
- Delay: 0ms (instant)
- Fade in: 200ms
- Fade out: 200ms

## Section Dividers

### Style
- Width: 32px
- Height: 1px
- Color: #e5e7eb (light gray)
- Margin: 4px vertical

### Placement
1. After selection badge (if visible)
2. After editing tools
3. After history tools

## Component Integration

### TypeScript Methods Added

```typescript
// Reset functionality
resetToInitialState(): void

// Save functionality
saveChanges(): void

// All existing toolbar methods from previous iteration
isVisibilityToggled(): boolean
toggleSelectedVisibility(): void
hasStartBar(): boolean
toggleStartBarForSelected(): void
hasEndBar(): boolean
toggleEndBarForSelected(): void
hasContinueTop(): boolean
toggleContinueTopForSelected(): void
hasContinue(): boolean
toggleContinueForSelected(): void
```

### Confirmation Dialogs

**Reset**
```
Are you sure you want to reset all changes?
This cannot be undone.
[Cancel] [Reset]
```

## Interactions

### Tool Click Flow
```
User hovers tool
  ↓
Tooltip appears on left
  ↓
User clicks
  ↓
Action executes
  ↓
Visual feedback (if applicable)
  ↓
Undo state recorded
```

### Reset Flow
```
User clicks Reset
  ↓
Confirmation dialog appears
  ↓
User confirms
  ↓
Undo history cleared
  ↓
Page reset to initial state
  ↓
Selections cleared
```

### Save Flow
```
User clicks Save
  ↓
Current page state emitted
  ↓
Changes persisted
  ↓
Success feedback shown
```

## Keyboard Shortcuts

All keyboard shortcuts still work:
- **X** - Toggle visibility
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Double-Click** - Edit text
- **Right-Click** - Context menu
- **Ctrl+Click** - Multi-select
- **Shift+Click** - Range select

## Accessibility

### Keyboard Navigation
- All buttons are focusable with Tab
- Space/Enter activates buttons
- Tooltips announce on focus

### ARIA Labels
- Each button has descriptive tooltip
- Disabled state announced
- Active state announced

### Visual Indicators
- Clear hover states
- Distinct active states
- High contrast colors
- Visual separators

## Responsive Behavior

### Desktop (All Sizes)
- Fixed position on right
- Fully visible
- All tools accessible

### Future Enhancements
- Tablet: Could be collapsible
- Mobile: Could move to bottom
- Small screens: Could show fewer tools

## Animations

### Entry Animation
```css
@keyframes toolbarSlideIn {
  from: translateY(-50%) translateX(20px), opacity 0
  to: translateY(-50%) translateX(0), opacity 1
  duration: 300ms
  easing: ease-out
}
```

### Badge Pop
```css
@keyframes badgePop {
  0%: scale(0.8)
  50%: scale(1.1)
  100%: scale(1)
  duration: 200ms
}
```

## Benefits

### User Experience
1. ✅ **Always Accessible** - Tools always visible
2. ✅ **Organized** - Logical grouping by function
3. ✅ **Visual Hierarchy** - Separators and colors
4. ✅ **Feedback** - Active states and tooltips
5. ✅ **Safety** - Confirmation for destructive actions

### Developer Experience
1. ✅ **Self-Contained** - All logic in page component
2. ✅ **Maintainable** - Clear method names
3. ✅ **Extensible** - Easy to add new tools
4. ✅ **Testable** - Pure functions

### Design
1. ✅ **Professional** - Miro/Figma aesthetic
2. ✅ **Clean** - Icon-only interface
3. ✅ **Consistent** - Uniform sizing and spacing
4. ✅ **Intuitive** - Familiar tool patterns

## File Changes

### HTML
- `last-looks-page.component.html`
  - Added `.vertical-toolbar` container
  - Added 9 tool buttons
  - Added section dividers
  - Added selection badge

### CSS
- `last-looks-page.component.css`
  - Vertical toolbar positioning
  - Left-aligned tooltips
  - Danger/success button variants
  - Section divider styles
  - Updated badge for vertical layout

### TypeScript
- `last-looks-page.component.ts`
  - Added `resetToInitialState()` method
  - Added `saveChanges()` method
  - All previous toolbar helper methods

## Testing Checklist

- [ ] Toolbar appears on right side
- [ ] Toolbar is vertically centered
- [ ] Selection badge shows count
- [ ] Tooltips appear on left
- [ ] All tools execute actions
- [ ] Active states update correctly
- [ ] Undo/redo work
- [ ] Reset shows confirmation
- [ ] Reset clears all changes
- [ ] Save emits page state
- [ ] Disabled states work
- [ ] Danger hover is red
- [ ] Success hover is green
- [ ] Keyboard shortcuts still work
- [ ] Drag and drop still works

## Future Enhancements

1. **Toast Notifications** - Success/error messages
2. **Autosave** - Periodic automatic saves
3. **Change Indicator** - Dot showing unsaved changes
4. **Tool Presets** - Quick apply common settings
5. **Favorites** - Pin frequently used tools
6. **Collapsed Mode** - Minimize to icons only
7. **Drag to Reorder** - Custom tool order
8. **Keyboard Customization** - Custom shortcuts
