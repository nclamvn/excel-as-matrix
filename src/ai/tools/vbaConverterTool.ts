// ═══════════════════════════════════════════════════════════════════════════
// VBA CONVERTER TOOL — Paste VBA → AI Convert → ExcelAI Macro JSON
// Uses Claude API to convert VBA macros into ExcelAI's 19 action types
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MacroActionType =
  | 'setCellValue'
  | 'setCellFormula'
  | 'formatCells'
  | 'insertRow'
  | 'insertColumn'
  | 'deleteRow'
  | 'deleteColumn'
  | 'copyRange'
  | 'pasteRange'
  | 'sortRange'
  | 'filterRange'
  | 'clearRange'
  | 'mergeRange'
  | 'autoFill'
  | 'conditionalFormat'
  | 'createChart'
  | 'showMessage'
  | 'inputPrompt'
  | 'loop';

export interface MacroAction {
  type: MacroActionType;
  params: Record<string, unknown>;
  description?: string;
}

export interface ConvertedMacro {
  name: string;
  description: string;
  actions: MacroAction[];
  warnings: string[];
  unsupportedFeatures: string[];
  originalVBA: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local pattern-based converter (no AI needed for common patterns)
// ─────────────────────────────────────────────────────────────────────────────

const VBA_PATTERNS: Array<{
  pattern: RegExp;
  convert: (match: RegExpMatchArray) => MacroAction | null;
}> = [
  // Range("A1").Value = "text"
  {
    pattern: /Range\("([A-Z]+\d+)"\)\.Value\s*=\s*"([^"]*)"$/m,
    convert: (m) => ({
      type: 'setCellValue',
      params: { cell: m[1], value: m[2] },
      description: `Set ${m[1]} = "${m[2]}"`,
    }),
  },
  // Range("A1").Value = 123
  {
    pattern: /Range\("([A-Z]+\d+)"\)\.Value\s*=\s*(\d+\.?\d*)/m,
    convert: (m) => ({
      type: 'setCellValue',
      params: { cell: m[1], value: parseFloat(m[2]) },
      description: `Set ${m[1]} = ${m[2]}`,
    }),
  },
  // Range("A1").Formula = "=SUM(B1:B10)"
  {
    pattern: /Range\("([A-Z]+\d+)"\)\.Formula\s*=\s*"([^"]*)"$/m,
    convert: (m) => ({
      type: 'setCellFormula',
      params: { cell: m[1], formula: m[2] },
      description: `Set formula ${m[1]} = ${m[2]}`,
    }),
  },
  // Cells(row, col).Value = ...
  {
    pattern: /Cells\((\d+),\s*(\d+)\)\.Value\s*=\s*(.+)/m,
    convert: (m) => ({
      type: 'setCellValue',
      params: { row: parseInt(m[1]) - 1, col: parseInt(m[2]) - 1, value: m[3].trim().replace(/^"|"$/g, '') },
      description: `Set cell (${m[1]},${m[2]}) = ${m[3].trim()}`,
    }),
  },
  // Range("A1:B10").Font.Bold = True
  {
    pattern: /Range\("([^"]+)"\)\.Font\.Bold\s*=\s*(True|False)/mi,
    convert: (m) => ({
      type: 'formatCells',
      params: { range: m[1], format: { bold: m[2].toLowerCase() === 'true' } },
      description: `${m[2] === 'True' ? 'Bold' : 'Unbold'} ${m[1]}`,
    }),
  },
  // Range("A1:B10").Font.Color = RGB(r,g,b)
  {
    pattern: /Range\("([^"]+)"\)\.Font\.Color\s*=\s*RGB\((\d+),\s*(\d+),\s*(\d+)\)/m,
    convert: (m) => ({
      type: 'formatCells',
      params: { range: m[1], format: { textColor: `rgb(${m[2]},${m[3]},${m[4]})` } },
      description: `Set text color of ${m[1]}`,
    }),
  },
  // Range("A1:B10").Interior.Color = RGB(r,g,b)
  {
    pattern: /Range\("([^"]+)"\)\.Interior\.Color\s*=\s*RGB\((\d+),\s*(\d+),\s*(\d+)\)/m,
    convert: (m) => ({
      type: 'formatCells',
      params: { range: m[1], format: { backgroundColor: `rgb(${m[2]},${m[3]},${m[4]})` } },
      description: `Set background color of ${m[1]}`,
    }),
  },
  // Rows(n).Insert
  {
    pattern: /Rows\((\d+)\)\.Insert/m,
    convert: (m) => ({
      type: 'insertRow',
      params: { index: parseInt(m[1]) - 1 },
      description: `Insert row at ${m[1]}`,
    }),
  },
  // Rows(n).Delete
  {
    pattern: /Rows\((\d+)\)\.Delete/m,
    convert: (m) => ({
      type: 'deleteRow',
      params: { index: parseInt(m[1]) - 1 },
      description: `Delete row ${m[1]}`,
    }),
  },
  // Columns(n).Insert
  {
    pattern: /Columns\((\d+)\)\.Insert/m,
    convert: (m) => ({
      type: 'insertColumn',
      params: { index: parseInt(m[1]) - 1 },
      description: `Insert column at ${m[1]}`,
    }),
  },
  // Range("A1:B10").Sort Key1:=Range("A1")
  {
    pattern: /Range\("([^"]+)"\)\.Sort\s+Key1:=Range\("([^"]+)"\)/m,
    convert: (m) => ({
      type: 'sortRange',
      params: { range: m[1], keyCell: m[2] },
      description: `Sort ${m[1]} by ${m[2]}`,
    }),
  },
  // Range("A1:B10").ClearContents
  {
    pattern: /Range\("([^"]+)"\)\.ClearContents/m,
    convert: (m) => ({
      type: 'clearRange',
      params: { range: m[1] },
      description: `Clear contents of ${m[1]}`,
    }),
  },
  // Range("A1:B10").Copy / .Paste
  {
    pattern: /Range\("([^"]+)"\)\.Copy/m,
    convert: (m) => ({
      type: 'copyRange',
      params: { range: m[1] },
      description: `Copy ${m[1]}`,
    }),
  },
  // MsgBox "message"
  {
    pattern: /MsgBox\s+"([^"]+)"/m,
    convert: (m) => ({
      type: 'showMessage',
      params: { message: m[1] },
      description: `Show message: "${m[1]}"`,
    }),
  },
  // For i = start To end ... Next i
  {
    pattern: /For\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)/m,
    convert: (m) => ({
      type: 'loop',
      params: { variable: m[1], start: parseInt(m[2]), end: parseInt(m[3]), actions: [] },
      description: `Loop ${m[1]} from ${m[2]} to ${m[3]}`,
    }),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Convert VBA to Macro JSON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert VBA code to ExcelAI macro actions using local pattern matching.
 * Falls back gracefully for unrecognized patterns.
 */
export function convertVBALocally(vbaCode: string): ConvertedMacro {
  const actions: MacroAction[] = [];
  const warnings: string[] = [];
  const unsupported: string[] = [];

  // Extract macro name
  const nameMatch = vbaCode.match(/Sub\s+(\w+)\s*\(/);
  const name = nameMatch?.[1] || 'ConvertedMacro';

  // Split into lines and process each
  const lines = vbaCode
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("'") && !l.startsWith('Sub ') && !l.startsWith('End Sub') && l !== 'Dim');

  for (const line of lines) {
    // Skip Dim declarations
    if (line.startsWith('Dim ')) continue;
    if (line === 'Next' || line.match(/^Next \w+$/)) continue;
    if (line.startsWith('End If') || line.startsWith('Else') || line === 'Wend' || line === 'Loop') continue;

    let matched = false;
    for (const { pattern, convert } of VBA_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const action = convert(match);
        if (action) {
          actions.push(action);
          matched = true;
          break;
        }
      }
    }

    if (!matched && line.length > 3) {
      // Check for known unsupported constructs
      if (/ActiveSheet|Worksheet|Application\.|Selection\.|ActiveWorkbook/i.test(line)) {
        unsupported.push(line);
      } else if (/If\s+.+\s+Then/i.test(line)) {
        warnings.push(`Conditional logic detected: "${line}" — may need manual review`);
      } else if (/Do\s+While|While\s+/i.test(line)) {
        warnings.push(`While loop detected: "${line}" — simplified to loop action`);
      } else {
        warnings.push(`Unrecognized: "${line}"`);
      }
    }
  }

  return {
    name,
    description: `Converted from VBA macro "${name}"`,
    actions,
    warnings,
    unsupportedFeatures: unsupported,
    originalVBA: vbaCode,
  };
}

/**
 * Generate the AI prompt to convert VBA that couldn't be handled locally.
 * This prompt is sent to Claude API for complex VBA conversion.
 */
export function generateVBAConversionPrompt(vbaCode: string): string {
  return `Convert this VBA macro to ExcelAI macro JSON format.

Available action types: setCellValue, setCellFormula, formatCells, insertRow, insertColumn, deleteRow, deleteColumn, copyRange, pasteRange, sortRange, filterRange, clearRange, mergeRange, autoFill, conditionalFormat, createChart, showMessage, inputPrompt, loop.

Each action has format: { "type": "actionType", "params": {...}, "description": "human readable" }

VBA Code:
\`\`\`vba
${vbaCode}
\`\`\`

Return ONLY a JSON array of actions. For unsupported VBA features, add a "warning" field.`;
}
