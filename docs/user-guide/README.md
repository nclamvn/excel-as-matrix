# ExcelAI User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Working with Cells](#working-with-cells)
4. [Formulas](#formulas)
5. [Collaboration](#collaboration)
6. [Sharing](#sharing)
7. [Version History](#version-history)
8. [Import/Export](#importexport)
9. [Filter Views](#filter-views)
10. [Protected Ranges](#protected-ranges)
11. [Comments & @mentions](#comments--mentions)
12. [AI Copilot](#ai-copilot)
13. [Mobile](#mobile)
14. [Keyboard Shortcuts](#keyboard-shortcuts)
15. [FAQ](#faq)

---

## Introduction

ExcelAI is a next-generation spreadsheet with:
- 162 Excel-compatible formula functions
- Real-time collaboration (multi-user editing)
- AI Copilot built-in
- Version history with restore
- Import/Export: Excel, CSV, PDF, Google Sheets
- Mobile responsive design

---

## Quick Start

### Create a new workbook
1. Open ExcelAI
2. Start typing in any cell

### Open an existing file
1. Click the **Open File** button on the empty grid
2. Or go to **File > Open** and select a .xlsx or .csv file
3. Or drag & drop a file onto the grid

### Import from Google Sheets
1. Go to **File > Import**
2. Select the **Google Sheets** tab
3. Paste the Google Sheet URL (must be shared as "Anyone with the link can view")
4. Click **Import from Google Sheets**

---

## Working with Cells

### Editing
- **Click** a cell to select it, then start typing
- **Double-click** to edit an existing cell
- **F2** to enter edit mode on the selected cell
- **Enter** to confirm and move down
- **Tab** to confirm and move right
- **Escape** to cancel editing

### Selection
- **Click + Drag** to select a range
- **Shift + Click** to extend selection from current cell
- **Ctrl + A** to select all cells

### Copy/Paste
- **Ctrl + C** / **Ctrl + X** / **Ctrl + V**
- Supports multi-cell copy/paste

### Formatting
Use the Home toolbar for:
- Font family and size
- Bold (**Ctrl+B**), Italic (**Ctrl+I**), Underline (**Ctrl+U**)
- Text color and fill color
- Alignment (left, center, right)
- Number format (currency, percentage, date)
- Conditional formatting rules

---

## Formulas

ExcelAI supports 162 formula functions compatible with Excel.

### Usage
Type `=` followed by the function name and arguments:
```
=SUM(A1:A10)
=AVERAGE(B1:B100)
=IF(A1>10, "Yes", "No")
=VLOOKUP(A1, B:C, 2, FALSE)
```

### Function Categories

| Category | Examples |
|----------|----------|
| Math | SUM, AVERAGE, MAX, MIN, ROUND, ABS, POWER |
| Text | CONCAT, LEFT, RIGHT, MID, TRIM, UPPER, LOWER, LEN |
| Logic | IF, AND, OR, NOT, IFS, SWITCH |
| Lookup | VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP |
| Date | TODAY, NOW, DATE, YEAR, MONTH, DAY, DATEDIF |
| Financial | PMT, FV, PV, NPV, IRR, RATE |
| Statistical | COUNT, COUNTIF, SUMIF, SUMIFS, STDEV, MEDIAN |
| Engineering | BIN2DEC, DEC2BIN, CONVERT, COMPLEX |

### Cell References
- **Relative**: `A1` (changes when copied)
- **Absolute**: `$A$1` (stays fixed when copied)
- **Mixed**: `$A1` or `A$1`
- **Range**: `A1:B10`
- **Cross-sheet**: `Sheet2!A1`

---

## Collaboration

### Real-time editing
- Open the same workbook in multiple tabs or devices
- See other users' cursors and avatars in the header
- Changes sync automatically in real-time

### Presence indicators
- Avatar stack in the header shows who is online
- Green dot = Active
- Yellow dot = Idle
- Gray dot = Away
- "Live" indicator shows real-time sync is active

### Cell locking
- When you are editing a cell, others cannot edit the same cell
- The cell automatically unlocks when you finish editing
- Locked cells show the editing user's name

> **Note:** Real-time collaboration requires Supabase configuration. Without it, the app works in single-user mode.

---

## Sharing

### Share a workbook
1. Click the **Share** button in the header
2. Enter the email of the person to share with
3. Select permission level: **View** / **Edit** / **Admin**
4. Click **Send**

### Share via link
1. Click the **Share** button
2. Click **Copy link**
3. Send the link to anyone

### Permission levels

| Level | View | Edit | Share | Delete |
|-------|------|------|-------|--------|
| View  | Yes  | No   | No    | No     |
| Edit  | Yes  | Yes  | No    | No     |
| Admin | Yes  | Yes  | Yes   | Yes    |

---

## Version History

### View history
1. Click the **History** button in the header
2. The version history panel slides in from the right
3. Browse versions by timeline

### Auto-save
- Automatically saves every 5 minutes
- Saves when you switch tabs or minimize the app
- Keeps up to 100 versions

### Restore a version
1. Click on a version in the list
2. Click **Preview** to see a diff view
3. Click **Restore** to revert to that version
4. Your current state is saved before restoring

### Diff view
- Green cells = Added
- Red cells = Removed
- Blue cells = Modified

---

## Import/Export

### Import

| Format | Method |
|--------|--------|
| .xlsx / .xls | File > Open, or drag & drop |
| .csv / .tsv | File > Open, or drag & drop |
| Google Sheets | File > Import > Google Sheets tab > paste URL |

### Export

| Format | Method |
|--------|--------|
| .xlsx | File > Export > Excel |
| .csv | File > Export > CSV |
| .pdf | File > Export > PDF |

---

## Filter Views

### Create a Filter View
1. Go to the **Data** tab in the toolbar
2. Click the Filter View selector
3. Click **Create new filter view**
4. Name your filter and configure rules

### Key features
- Filter views are **personal** — they do not affect other users
- Each user can have their own set of filters
- Supports 12 filter operators (equals, contains, greater than, etc.)
- Filters persist in localStorage

---

## Protected Ranges

### Protect cells
1. Select the range to protect
2. Go to the **Review** tab
3. Click the **Range** protection button
4. Name the protected range and set options
5. Click **Protect Range**

### Protection modes
- **Strict** — Completely blocks editing
- **Warning only** — Shows a warning but allows editing

### Management
- Only the range owner can remove protection
- Additional editors can be granted access

---

## Comments & @mentions

### Add a comment
1. Right-click a cell
2. Select **Add Comment**
3. Type your comment
4. Press **Ctrl+Enter** to save

### @mention someone
1. In the comment input, type `@`
2. A dropdown appears with available users
3. Use arrow keys to navigate, Enter to select
4. The mentioned user receives a notification

### Notification bell
- The bell icon in the header shows unread notifications
- Red badge = unread count
- Click a notification to jump to the referenced cell
- Click **Mark all read** to clear

---

## AI Copilot

### Open AI panel
Click the **AI Copilot** button in the header (or press the toggle).

### Features
- Ask questions about your data
- Generate formulas from natural language
- Get data cleaning suggestions
- Receive proactive insights

### Example prompts
- "Sum all values in column B"
- "Create a chart from this data"
- "Find duplicates in column A"
- "What's the trend in sales data?"

---

## Mobile

ExcelAI works on mobile and tablet devices.

### Responsive breakpoints
- **Mobile** (< 640px) — Compact layout, full-screen dialogs
- **Tablet** (640-1023px) — Icon-only toolbar
- **Desktop** (>= 1024px) — Full layout

### Touch gestures
- **Tap** — Select cell
- **Double tap** — Edit cell
- **Long press** — Context menu (copy, paste, delete)
- **Swipe** — Scroll grid

### Mobile toolbar
Bottom tab bar with: Format, Insert, Data, AI, More

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| Arrow keys | Move between cells |
| Tab / Shift+Tab | Move right / left |
| Enter | Move down / confirm edit |
| Ctrl+Home | Go to cell A1 |
| Ctrl+G | Go to cell dialog |
| Ctrl+K | Command palette |

### Editing

| Shortcut | Action |
|----------|--------|
| F2 | Edit selected cell |
| Escape | Cancel editing |
| Delete | Clear cell content |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

### Formatting

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+U | Underline |

### Selection

| Shortcut | Action |
|----------|--------|
| Ctrl+A | Select all |
| Shift+Arrow | Extend selection |
| Ctrl+Shift+End | Select to last cell |

---

## FAQ

**Q: I lost my data. How do I recover?**
A: Go to **History** > select a previous version > **Restore**.

**Q: I can't see other users editing.**
A: Real-time collaboration requires Supabase. Contact your admin.

**Q: Google Sheets import shows an error.**
A: The sheet must be shared as "Anyone with the link can view".

**Q: How do I protect an entire sheet?**
A: Select all cells (Ctrl+A) > Review tab > Range > Protect Range.

**Q: The toolbar is missing on mobile.**
A: The toolbar is at the bottom of the screen as a tab bar. Tap the icons to expand panels.

**Q: How do I zoom in/out?**
A: Use the zoom controls in the bottom-right status bar (+ and - buttons).
