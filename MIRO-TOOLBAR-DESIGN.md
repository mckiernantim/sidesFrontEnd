# Miro-Style Toolbar Design

## Overview
Complete redesign of the last-looks editing controls to match a digital whiteboard interface (like Miro), with a floating vertical toolbar that provides clear, organized access to all editing tools.

## Design Philosophy
- **Clear Tool Definitions**: Each tool has an icon, name, and description
- **Always Visible**: Toolbar is fixed on the left side when in edit mode
- **Context Aware**: Tools show active state and disable when no selection
- **Non-Intrusive**: Doesn't cover the script content
- **Professional**: Clean, modern design similar to Miro/Figma

## Toolbar Structure

### Floating Left Panel
- **Position**: Fixed on the left side, vertically centered
- **Width**: 240px
- **Style**: Rounded corners, subtle shadow, semi-transparent backdrop
- **Animation**: Slides in from the left when edit mode activates

### Header Section
```
┌─────────────────────────┐
│ Tools          ● (pulse)│
└─────────────────────────┘
```
- **Title**: "Tools" label
- **Status Indicator**: Pulsing green dot when edit mode is active

### Tool Sections

#### 1. Selection Tools
- **Hide/Show Toggle**
  - Icon: Eye with slash
  - Name: "Hide" or "Show" (dynamic)
  - Description: "Toggle visibility"
  - Keyboard: X key
  - State: Active when line is hidden

#### 2. Scene Markers
- **Start Bar**
  - Icon: Arrow pointing up
  - Name: "Start Bar"
  - Description: "Scene beginning"
  - Function: Adds horizontal bar at scene start
  - State: Active when bar is present

- **End Bar**
  - Icon: Arrow pointing down
  - Name: "End Bar"
  - Description: "Scene ending"
  - Function: Adds horizontal bar at scene end
  - State: Active when bar is present

- **Continue Top**
  - Icon: Double arrow up
  - Name: "Continue Top"
  - Description: "Page top marker"
  - Function: Adds "CONTINUED" marker at top
  - State: Active when marker is present

- **Continue**
  - Icon: Double arrow down
  - Name: "Continue"
  - Description: "Page bottom marker"
  - Function: Adds "CONTINUED" marker at bottom
  - State: Active when marker is present

### Footer Section
```
┌─────────────────────────┐
│ ☑ 3 selected           │
└─────────────────────────┘
```
- **Selection Count**: Shows number of selected lines
- **Style**: Accent background with border
- **Only visible**: When lines are selected

## Visual States

### Tool States
1. **Default**: Gray background, muted icon
2. **Hover**: Light background, tooltip appears
3. **Active**: Accent background, accent icon, border highlight
4. **Disabled**: 40% opacity, no-drop cursor

### Tool Item Structure
```
┌──────────────────────────────┐
│  ┌────┐  Start Bar           │
│  │ ↑  │  Scene beginning     │
│  └────┘                       │
└──────────────────────────────┘
```
- **Icon Box**: 40x40px square with rounded corners
- **Tool Name**: Bold, 14px
- **Description**: Subtle, 11px

## Top Bar Simplification

### New Simplified Design
```
┌─────────────────────────────────────────┐
│  ← [Page 1 / 10] →        ● Edit Mode   │
└─────────────────────────────────────────┘
```

**Elements**:
- **Navigation**: Arrow buttons for prev/next
- **Page Display**: Simple text counter
- **Mode Indicator**: Dot + text (changes color when active)

## Color Scheme

Using existing design system:
- **Background**: `var(--sw-surface)`
- **Borders**: `var(--sw-border)`
- **Active State**: `var(--sw-accent)` (#00ffc4)
- **Text**: `var(--sw-text)`, `var(--sw-text-muted)`, `var(--sw-text-subtle)`
- **Hover**: `var(--sw-surface-2)`

## Animations

1. **Toolbar Entry**
   - Slide in from left
   - Duration: 300ms
   - Easing: ease-out

2. **Status Pulse**
   - Edit mode indicator pulses
   - Duration: 2s
   - Effect: Growing shadow

3. **Tool Hover**
   - Smooth background transition
   - Duration: 150ms

## Interactions

### Selection Required
Tools that require a selection:
- Hide/Show
- Start Bar
- End Bar
- Continue Top
- Continue

**Behavior**: These tools are disabled (grayed out) when no line is selected.

### Active State
When a tool's function is applied to the selected line(s), it shows the active state with:
- Accent background color
- Accent border
- Icon color changes to black (on accent background)

### Click Behavior
1. User selects a line on the script
2. Toolbar tools become enabled
3. Clicking a tool applies/removes that feature
4. Tool shows active state if feature is present
5. Selection count updates in footer

## No Changes to Core Functionality

### Preserved Features
- ✅ All drag and drop functionality
- ✅ Double-click to edit text
- ✅ Right-click context menu
- ✅ Keyboard shortcuts (X, Ctrl+Z, etc.)
- ✅ Multi-selection (Ctrl+Click, Shift+Click)
- ✅ Bar dragging and positioning
- ✅ Scene number editing
- ✅ Undo/Redo system

### Only Changed
- ❌ Visual layout of controls
- ❌ Toolbar positioning
- ❌ Button styling
- ❌ Top bar design

## Responsive Behavior

### Desktop (> 1024px)
- Toolbar fixed on left
- Full tool labels visible
- 240px width

### Tablet (768px - 1024px)
- Could be collapsed to icons only
- Expand on hover (future enhancement)

### Mobile (< 768px)
- Could move to bottom toolbar
- Or slide-in drawer (future enhancement)

## Accessibility

- **Keyboard Navigation**: All tools accessible via Tab
- **ARIA Labels**: Each tool has descriptive labels
- **Visual Feedback**: Clear active/disabled states
- **Tooltips**: Hover shows full description
- **High Contrast**: Works with system dark mode

## File Structure

### Modified Files
1. `last-looks.component.html` - New toolbar structure
2. `last-looks.component.css` - Miro-style toolbar CSS
3. (NO changes to drag/drop TypeScript)

### CSS Organization
```css
/* ═══ MIRO-STYLE FLOATING TOOLBAR ═══ */
- .miro-toolbar
- .toolbar-header
- .toolbar-section
- .tool-item
- .tool-icon
- .tool-label
- .toolbar-footer

/* ═══ SIMPLIFIED TOP BAR ═══ */
- .top-bar
- .nav-btn
- .page-display
- .mode-indicator
```

## Future Enhancements

1. **Tool Groups**: Collapsible sections
2. **Favorites**: Pin frequently used tools
3. **Drag Toolbar**: Allow repositioning
4. **Customization**: User can show/hide tools
5. **Themes**: Light/dark toolbar themes
6. **Tooltips**: Rich tooltips with keyboard shortcuts
7. **Search**: Quick tool search/filter
8. **Presets**: Save common tool combinations

## Comparison

### Before (Button Layout)
- Quick actions bar at top
- Buttons in horizontal row
- Only visible when selection active
- Text + icon in each button
- Cluttered top bar

### After (Miro Style)
- Floating panel on left
- Vertical tool list
- Always visible in edit mode
- Icon + name + description
- Clean, minimal top bar

## Benefits

1. **Clarity**: Each tool clearly labeled with purpose
2. **Organization**: Tools grouped by function
3. **Efficiency**: Always visible, no need to right-click
4. **Professional**: Modern whiteboard-style interface
5. **Scalable**: Easy to add new tools
6. **Familiar**: Similar to Miro, Figma, etc.
7. **Context**: Shows active state and selection count
8. **Non-blocking**: Doesn't cover script content
