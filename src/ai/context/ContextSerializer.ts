// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT SERIALIZER — Serialize spreadsheet data for LLM consumption
// ═══════════════════════════════════════════════════════════════════════════

import type { SerializedRange } from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, colToLetter, parseCellRef } from '../../types/cell';

/**
 * Serialize spreadsheet data for LLM consumption
 */
export class ContextSerializer {
  /**
   * Serialize a range to LLM-friendly format
   */
  serializeRange(rangeRef: string): SerializedRange {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const { startRow, startCol, endRow, endCol } = this.parseRange(rangeRef);

    const values: unknown[][] = [];
    const formulas: (string | null)[][] = [];
    const formats: (string | null)[][] = [];
    let hasFormulas = false;

    for (let row = startRow; row <= endRow; row++) {
      const rowValues: unknown[] = [];
      const rowFormulas: (string | null)[] = [];
      const rowFormats: (string | null)[] = [];

      for (let col = startCol; col <= endCol; col++) {
        const key = getCellKey(row, col);
        const cell = sheet?.cells[key];

        rowValues.push(cell?.value ?? null);
        rowFormulas.push(cell?.formula ?? null);
        rowFormats.push(cell?.format ? JSON.stringify(cell.format) : null);

        if (cell?.formula) hasFormulas = true;
      }

      values.push(rowValues);
      formulas.push(rowFormulas);
      formats.push(rowFormats);
    }

    return {
      ref: rangeRef,
      sheetName: sheet?.name ?? 'Sheet1',
      values,
      formulas,
      formats,
      hasFormulas,
      cellCount: (endRow - startRow + 1) * (endCol - startCol + 1),
    };
  }

  /**
   * Serialize context to markdown for LLM
   */
  serializeToMarkdown(ranges: SerializedRange[]): string {
    let md = '';

    for (const range of ranges) {
      md += `\n### ${range.sheetName} - ${range.ref}\n\n`;

      // Create table header
      const cols = range.values[0]?.length || 0;
      const headers: string[] = [];
      const { startCol } = this.parseRange(range.ref);

      for (let c = 0; c < cols; c++) {
        headers.push(colToLetter(startCol + c));
      }

      md += '| Row | ' + headers.join(' | ') + ' |\n';
      md += '|-----|' + headers.map(() => '-----').join('|') + '|\n';

      // Add rows
      const { startRow } = this.parseRange(range.ref);
      for (let r = 0; r < range.values.length; r++) {
        const rowNum = startRow + r + 1;
        const row = range.values[r];
        const formulaRow = range.formulas[r];

        const cells = row.map((v, c) => {
          const formula = formulaRow[c];
          if (formula) {
            return `${v} [${formula}]`;
          }
          return String(v ?? '');
        });

        md += `| ${rowNum} | ${cells.join(' | ')} |\n`;
      }
    }

    return md;
  }

  /**
   * Serialize to JSON with grounding markers
   */
  serializeWithGrounding(ranges: SerializedRange[]): string {
    let output = '';

    for (const range of ranges) {
      const { startRow, startCol } = this.parseRange(range.ref);

      for (let r = 0; r < range.values.length; r++) {
        for (let c = 0; c < range.values[r].length; c++) {
          const cellRef = `${colToLetter(startCol + c)}${startRow + r + 1}`;
          const value = range.values[r][c];
          const formula = range.formulas[r][c];

          if (value !== null && value !== '') {
            output += `[📍${cellRef}] = ${value}`;
            if (formula) {
              output += ` (formula: ${formula})`;
            }
            output += '\n';
          }
        }
      }
    }

    return output;
  }

  /**
   * Serialize for compact representation
   */
  serializeCompact(ranges: SerializedRange[]): string {
    const lines: string[] = [];

    for (const range of ranges) {
      lines.push(`Range ${range.ref} (${range.sheetName}):`);

      const { startRow, startCol } = this.parseRange(range.ref);

      for (let r = 0; r < range.values.length; r++) {
        const rowData: string[] = [];
        for (let c = 0; c < range.values[r].length; c++) {
          const value = range.values[r][c];
          if (value !== null && value !== '') {
            const cellRef = `${colToLetter(startCol + c)}${startRow + r + 1}`;
            rowData.push(`${cellRef}=${value}`);
          }
        }
        if (rowData.length > 0) {
          lines.push(`  ${rowData.join(', ')}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Parse range reference to coordinates
   */
  private parseRange(rangeRef: string): {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } {
    const [startRef, endRef] = rangeRef.split(':');
    const start = parseCellRef(startRef);
    const end = endRef ? parseCellRef(endRef) : start;

    if (!start) {
      throw new Error(`Invalid cell reference: ${startRef}`);
    }

    const endPos = end || start;

    return {
      startRow: start.row,
      startCol: start.col,
      endRow: endPos.row,
      endCol: endPos.col,
    };
  }
}

// Export singleton
export const contextSerializer = new ContextSerializer();
