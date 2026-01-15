export interface Shortcut {
  id: string;
  keys: string;
  description: string;
  category: ShortcutCategory;
  action: string;
  when?: string;
  preventDefault?: boolean;
  global?: boolean;
}

export type ShortcutCategory =
  | 'navigation'
  | 'selection'
  | 'editing'
  | 'formatting'
  | 'clipboard'
  | 'file'
  | 'view'
  | 'data'
  | 'insert'
  | 'tools';

// === NAVIGATION SHORTCUTS ===
export const NAVIGATION_SHORTCUTS: Shortcut[] = [
  { id: 'nav.up', keys: 'ArrowUp', description: 'Move up', category: 'navigation', action: 'MOVE_UP' },
  { id: 'nav.down', keys: 'ArrowDown', description: 'Move down', category: 'navigation', action: 'MOVE_DOWN' },
  { id: 'nav.left', keys: 'ArrowLeft', description: 'Move left', category: 'navigation', action: 'MOVE_LEFT' },
  { id: 'nav.right', keys: 'ArrowRight', description: 'Move right', category: 'navigation', action: 'MOVE_RIGHT' },

  { id: 'nav.ctrl.up', keys: 'ctrl+ArrowUp', description: 'Jump to top of data region', category: 'navigation', action: 'JUMP_UP' },
  { id: 'nav.ctrl.down', keys: 'ctrl+ArrowDown', description: 'Jump to bottom of data region', category: 'navigation', action: 'JUMP_DOWN' },
  { id: 'nav.ctrl.left', keys: 'ctrl+ArrowLeft', description: 'Jump to left of data region', category: 'navigation', action: 'JUMP_LEFT' },
  { id: 'nav.ctrl.right', keys: 'ctrl+ArrowRight', description: 'Jump to right of data region', category: 'navigation', action: 'JUMP_RIGHT' },

  { id: 'nav.pageup', keys: 'PageUp', description: 'Page up', category: 'navigation', action: 'PAGE_UP' },
  { id: 'nav.pagedown', keys: 'PageDown', description: 'Page down', category: 'navigation', action: 'PAGE_DOWN' },
  { id: 'nav.alt.pageup', keys: 'alt+PageUp', description: 'Page left', category: 'navigation', action: 'PAGE_LEFT' },
  { id: 'nav.alt.pagedown', keys: 'alt+PageDown', description: 'Page right', category: 'navigation', action: 'PAGE_RIGHT' },

  { id: 'nav.home', keys: 'Home', description: 'Go to beginning of row', category: 'navigation', action: 'GO_ROW_START' },
  { id: 'nav.end', keys: 'End', description: 'Go to end of row data', category: 'navigation', action: 'GO_ROW_END' },
  { id: 'nav.ctrl.home', keys: 'ctrl+Home', description: 'Go to cell A1', category: 'navigation', action: 'GO_START' },
  { id: 'nav.ctrl.end', keys: 'ctrl+End', description: 'Go to last used cell', category: 'navigation', action: 'GO_END' },

  { id: 'nav.tab', keys: 'Tab', description: 'Move to next cell', category: 'navigation', action: 'MOVE_NEXT' },
  { id: 'nav.shift.tab', keys: 'shift+Tab', description: 'Move to previous cell', category: 'navigation', action: 'MOVE_PREV' },
  { id: 'nav.enter', keys: 'Enter', description: 'Move down (confirm edit)', category: 'navigation', action: 'CONFIRM_DOWN' },
  { id: 'nav.shift.enter', keys: 'shift+Enter', description: 'Move up', category: 'navigation', action: 'CONFIRM_UP' },

  { id: 'nav.goto', keys: 'ctrl+g', description: 'Go to cell', category: 'navigation', action: 'SHOW_GOTO', global: true },
  { id: 'nav.goto.f5', keys: 'F5', description: 'Go to cell', category: 'navigation', action: 'SHOW_GOTO', global: true },
];

// === SELECTION SHORTCUTS ===
export const SELECTION_SHORTCUTS: Shortcut[] = [
  { id: 'sel.shift.up', keys: 'shift+ArrowUp', description: 'Extend selection up', category: 'selection', action: 'EXTEND_UP' },
  { id: 'sel.shift.down', keys: 'shift+ArrowDown', description: 'Extend selection down', category: 'selection', action: 'EXTEND_DOWN' },
  { id: 'sel.shift.left', keys: 'shift+ArrowLeft', description: 'Extend selection left', category: 'selection', action: 'EXTEND_LEFT' },
  { id: 'sel.shift.right', keys: 'shift+ArrowRight', description: 'Extend selection right', category: 'selection', action: 'EXTEND_RIGHT' },

  { id: 'sel.ctrl.shift.up', keys: 'ctrl+shift+ArrowUp', description: 'Extend to top of region', category: 'selection', action: 'EXTEND_JUMP_UP' },
  { id: 'sel.ctrl.shift.down', keys: 'ctrl+shift+ArrowDown', description: 'Extend to bottom of region', category: 'selection', action: 'EXTEND_JUMP_DOWN' },
  { id: 'sel.ctrl.shift.left', keys: 'ctrl+shift+ArrowLeft', description: 'Extend to left of region', category: 'selection', action: 'EXTEND_JUMP_LEFT' },
  { id: 'sel.ctrl.shift.right', keys: 'ctrl+shift+ArrowRight', description: 'Extend to right of region', category: 'selection', action: 'EXTEND_JUMP_RIGHT' },

  { id: 'sel.all', keys: 'ctrl+a', description: 'Select all cells', category: 'selection', action: 'SELECT_ALL', global: true },
  { id: 'sel.row', keys: 'shift+Space', description: 'Select entire row', category: 'selection', action: 'SELECT_ROW' },
  { id: 'sel.col', keys: 'ctrl+Space', description: 'Select entire column', category: 'selection', action: 'SELECT_COLUMN' },

  { id: 'sel.shift.pageup', keys: 'shift+PageUp', description: 'Extend selection page up', category: 'selection', action: 'EXTEND_PAGE_UP' },
  { id: 'sel.shift.pagedown', keys: 'shift+PageDown', description: 'Extend selection page down', category: 'selection', action: 'EXTEND_PAGE_DOWN' },

  { id: 'sel.shift.home', keys: 'shift+Home', description: 'Extend to row start', category: 'selection', action: 'EXTEND_ROW_START' },
  { id: 'sel.shift.end', keys: 'shift+End', description: 'Extend to row end', category: 'selection', action: 'EXTEND_ROW_END' },
  { id: 'sel.ctrl.shift.home', keys: 'ctrl+shift+Home', description: 'Extend to A1', category: 'selection', action: 'EXTEND_START' },
  { id: 'sel.ctrl.shift.end', keys: 'ctrl+shift+End', description: 'Extend to last cell', category: 'selection', action: 'EXTEND_END' },
];

// === EDITING SHORTCUTS ===
export const EDITING_SHORTCUTS: Shortcut[] = [
  { id: 'edit.f2', keys: 'F2', description: 'Edit cell', category: 'editing', action: 'EDIT_CELL' },
  { id: 'edit.enter', keys: 'Enter', description: 'Confirm edit', category: 'editing', action: 'CONFIRM_EDIT', when: 'editing' },
  { id: 'edit.escape', keys: 'Escape', description: 'Cancel edit', category: 'editing', action: 'CANCEL_EDIT', when: 'editing' },

  { id: 'edit.delete', keys: 'Delete', description: 'Clear cell contents', category: 'editing', action: 'CLEAR_CONTENTS' },
  { id: 'edit.backspace', keys: 'Backspace', description: 'Clear and edit', category: 'editing', action: 'CLEAR_AND_EDIT' },

  { id: 'edit.alt.enter', keys: 'alt+Enter', description: 'New line in cell', category: 'editing', action: 'INSERT_NEWLINE', when: 'editing' },

  { id: 'edit.f4', keys: 'F4', description: 'Toggle absolute reference', category: 'editing', action: 'TOGGLE_ABSOLUTE', when: 'editing' },
  { id: 'edit.ctrl.shift.enter', keys: 'ctrl+shift+Enter', description: 'Enter array formula', category: 'editing', action: 'ARRAY_FORMULA', when: 'editing' },

  { id: 'edit.ctrl.d', keys: 'ctrl+d', description: 'Fill down', category: 'editing', action: 'FILL_DOWN' },
  { id: 'edit.ctrl.r', keys: 'ctrl+r', description: 'Fill right', category: 'editing', action: 'FILL_RIGHT' },

  { id: 'edit.ctrl.plus', keys: 'ctrl++', description: 'Insert cells', category: 'editing', action: 'INSERT_CELLS' },
  { id: 'edit.ctrl.minus', keys: 'ctrl+-', description: 'Delete cells', category: 'editing', action: 'DELETE_CELLS' },
  { id: 'edit.ctrl.shift.plus', keys: 'ctrl+shift++', description: 'Insert row/column', category: 'editing', action: 'INSERT_ROW_COL' },
];

// === CLIPBOARD SHORTCUTS ===
export const CLIPBOARD_SHORTCUTS: Shortcut[] = [
  { id: 'clip.copy', keys: 'ctrl+c', description: 'Copy', category: 'clipboard', action: 'COPY', global: true },
  { id: 'clip.cut', keys: 'ctrl+x', description: 'Cut', category: 'clipboard', action: 'CUT', global: true },
  { id: 'clip.paste', keys: 'ctrl+v', description: 'Paste', category: 'clipboard', action: 'PASTE', global: true },
  { id: 'clip.paste.special', keys: 'ctrl+shift+v', description: 'Paste special', category: 'clipboard', action: 'PASTE_SPECIAL', global: true },
  { id: 'clip.paste.values', keys: 'ctrl+alt+v', description: 'Paste values only', category: 'clipboard', action: 'PASTE_VALUES', global: true },
];

// === FORMATTING SHORTCUTS ===
export const FORMATTING_SHORTCUTS: Shortcut[] = [
  { id: 'fmt.bold', keys: 'ctrl+b', description: 'Bold', category: 'formatting', action: 'TOGGLE_BOLD', global: true },
  { id: 'fmt.italic', keys: 'ctrl+i', description: 'Italic', category: 'formatting', action: 'TOGGLE_ITALIC', global: true },
  { id: 'fmt.underline', keys: 'ctrl+u', description: 'Underline', category: 'formatting', action: 'TOGGLE_UNDERLINE', global: true },
  { id: 'fmt.strikethrough', keys: 'ctrl+5', description: 'Strikethrough', category: 'formatting', action: 'TOGGLE_STRIKETHROUGH' },

  { id: 'fmt.general', keys: 'ctrl+shift+~', description: 'General format', category: 'formatting', action: 'FORMAT_GENERAL' },
  { id: 'fmt.number', keys: 'ctrl+shift+1', description: 'Number format', category: 'formatting', action: 'FORMAT_NUMBER' },
  { id: 'fmt.currency', keys: 'ctrl+shift+4', description: 'Currency format', category: 'formatting', action: 'FORMAT_CURRENCY' },
  { id: 'fmt.percent', keys: 'ctrl+shift+5', description: 'Percent format', category: 'formatting', action: 'FORMAT_PERCENT' },
  { id: 'fmt.date', keys: 'ctrl+shift+3', description: 'Date format', category: 'formatting', action: 'FORMAT_DATE' },
  { id: 'fmt.time', keys: 'ctrl+shift+2', description: 'Time format', category: 'formatting', action: 'FORMAT_TIME' },

  { id: 'fmt.align.left', keys: 'ctrl+l', description: 'Align left', category: 'formatting', action: 'ALIGN_LEFT' },
  { id: 'fmt.align.center', keys: 'ctrl+e', description: 'Align center', category: 'formatting', action: 'ALIGN_CENTER' },
  { id: 'fmt.align.right', keys: 'ctrl+shift+r', description: 'Align right', category: 'formatting', action: 'ALIGN_RIGHT' },

  { id: 'fmt.border.all', keys: 'ctrl+shift+7', description: 'Add border', category: 'formatting', action: 'BORDER_ALL' },
  { id: 'fmt.border.none', keys: 'ctrl+shift+_', description: 'Remove border', category: 'formatting', action: 'BORDER_NONE' },

  { id: 'fmt.dialog', keys: 'ctrl+1', description: 'Format cells dialog', category: 'formatting', action: 'SHOW_FORMAT_DIALOG', global: true },
];

// === FILE SHORTCUTS ===
export const FILE_SHORTCUTS: Shortcut[] = [
  { id: 'file.new', keys: 'ctrl+n', description: 'New workbook', category: 'file', action: 'NEW_WORKBOOK', global: true },
  { id: 'file.open', keys: 'ctrl+o', description: 'Open file', category: 'file', action: 'OPEN_FILE', global: true },
  { id: 'file.save', keys: 'ctrl+s', description: 'Save', category: 'file', action: 'SAVE', global: true },
  { id: 'file.saveas', keys: 'ctrl+shift+s', description: 'Save as', category: 'file', action: 'SAVE_AS', global: true },
  { id: 'file.print', keys: 'ctrl+p', description: 'Print', category: 'file', action: 'PRINT', global: true },
  { id: 'file.close', keys: 'ctrl+w', description: 'Close workbook', category: 'file', action: 'CLOSE', global: true },
];

// === VIEW SHORTCUTS ===
export const VIEW_SHORTCUTS: Shortcut[] = [
  { id: 'view.zoom.in', keys: 'ctrl+=', description: 'Zoom in', category: 'view', action: 'ZOOM_IN' },
  { id: 'view.zoom.out', keys: 'ctrl+-', description: 'Zoom out', category: 'view', action: 'ZOOM_OUT' },
  { id: 'view.zoom.100', keys: 'ctrl+0', description: 'Zoom 100%', category: 'view', action: 'ZOOM_RESET' },

  { id: 'view.freeze', keys: 'alt+w f f', description: 'Freeze panes', category: 'view', action: 'FREEZE_PANES' },
  { id: 'view.freeze.row', keys: 'alt+w f r', description: 'Freeze top row', category: 'view', action: 'FREEZE_TOP_ROW' },
  { id: 'view.freeze.col', keys: 'alt+w f c', description: 'Freeze first column', category: 'view', action: 'FREEZE_FIRST_COL' },

  { id: 'view.formula.bar', keys: 'ctrl+shift+u', description: 'Toggle formula bar', category: 'view', action: 'TOGGLE_FORMULA_BAR' },
  { id: 'view.gridlines', keys: 'ctrl+shift+8', description: 'Toggle gridlines', category: 'view', action: 'TOGGLE_GRIDLINES' },

  { id: 'view.fullscreen', keys: 'F11', description: 'Full screen', category: 'view', action: 'TOGGLE_FULLSCREEN', global: true },
];

// === TOOLS SHORTCUTS ===
export const TOOLS_SHORTCUTS: Shortcut[] = [
  { id: 'tools.find', keys: 'ctrl+f', description: 'Find', category: 'tools', action: 'SHOW_FIND', global: true },
  { id: 'tools.replace', keys: 'ctrl+h', description: 'Find and replace', category: 'tools', action: 'SHOW_REPLACE', global: true },
  { id: 'tools.find.next', keys: 'F3', description: 'Find next', category: 'tools', action: 'FIND_NEXT' },
  { id: 'tools.find.prev', keys: 'shift+F3', description: 'Find previous', category: 'tools', action: 'FIND_PREV' },

  { id: 'tools.undo', keys: 'ctrl+z', description: 'Undo', category: 'tools', action: 'UNDO', global: true },
  { id: 'tools.redo', keys: 'ctrl+y', description: 'Redo', category: 'tools', action: 'REDO', global: true },
  { id: 'tools.redo.alt', keys: 'ctrl+shift+z', description: 'Redo', category: 'tools', action: 'REDO', global: true },

  { id: 'tools.spell', keys: 'F7', description: 'Spell check', category: 'tools', action: 'SPELL_CHECK' },

  { id: 'tools.calc', keys: 'F9', description: 'Calculate all', category: 'tools', action: 'CALCULATE_ALL' },
  { id: 'tools.calc.sheet', keys: 'shift+F9', description: 'Calculate sheet', category: 'tools', action: 'CALCULATE_SHEET' },
];

// === ALL SHORTCUTS ===
export const ALL_SHORTCUTS: Shortcut[] = [
  ...NAVIGATION_SHORTCUTS,
  ...SELECTION_SHORTCUTS,
  ...EDITING_SHORTCUTS,
  ...CLIPBOARD_SHORTCUTS,
  ...FORMATTING_SHORTCUTS,
  ...FILE_SHORTCUTS,
  ...VIEW_SHORTCUTS,
  ...TOOLS_SHORTCUTS,
];

// Shortcut map for quick lookup
export const SHORTCUT_MAP = new Map<string, Shortcut>(
  ALL_SHORTCUTS.map((s) => [s.keys.toLowerCase(), s])
);
