// ═══════════════════════════════════════════════════════════════════════════
// AI POWER QUERY TOOL — NL to Transform Pipeline
// Converts natural language to Power Query transform steps
// ═══════════════════════════════════════════════════════════════════════════

import { TransformStep, createStep } from '../../powerquery';

// ─────────────────────────────────────────────────────────────────────────────
// NL → Steps Mapping
// ─────────────────────────────────────────────────────────────────────────────

interface NLPattern {
  patterns: RegExp[];
  generate: (match: RegExpMatchArray, columns: string[]) => TransformStep | null;
}

const nlPatterns: NLPattern[] = [
  // Filter patterns
  {
    patterns: [
      /(?:filter|lọc|giữ|keep)\s+(?:where|rows?|dòng)?\s*(?:where)?\s*(\w+)\s*(?:=|equals?|bằng|là)\s*(.+)/i,
      /(?:xóa|remove|delete)\s+(?:rows?|dòng)\s+(?:where|khi)\s*(\w+)\s*(?:=|equals?|bằng|là)\s*(.+)/i,
    ],
    generate: (match) => {
      const column = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      const isRemove = /xóa|remove|delete/i.test(match[0]);
      return createStep('filter', {
        column,
        operator: isRemove ? 'notEquals' : 'equals',
        value,
      }, `Filter ${column} ${isRemove ? '!=' : '='} ${value}`);
    },
  },
  // Remove blank/empty rows
  {
    patterns: [
      /(?:xóa|remove|delete)\s+(?:dòng|rows?)\s+(?:trống|blank|empty|null)/i,
      /(?:remove|xóa)\s+(?:blank|trống|empty)\s+(?:rows?|dòng)/i,
    ],
    generate: (_match, columns) => {
      const col = columns[0] || 'A';
      return createStep('filter', { column: col, operator: 'isNotNull', value: null }, 'Remove blank rows');
    },
  },
  // Sort
  {
    patterns: [
      /(?:sort|sắp xếp|order)\s+(?:by|theo)\s+(\w+)\s*(asc|desc|ascending|descending|tăng|giảm)?/i,
    ],
    generate: (match) => {
      const column = match[1].trim();
      const dir = /desc|descending|giảm/i.test(match[2] || '') ? 'desc' : 'asc';
      return createStep('sort', { column, direction: dir }, `Sort by ${column} ${dir}`);
    },
  },
  // Group by with aggregation
  {
    patterns: [
      /(?:group|nhóm)\s+(?:by|theo)\s+(\w+)\s*,?\s*(?:tính|calc|compute)?\s*(sum|count|avg|average|min|max)\s+(\w+)/i,
    ],
    generate: (match) => {
      const groupCol = match[1].trim();
      let op = match[2].toLowerCase();
      if (op === 'average') op = 'avg';
      const valueCol = match[3].trim();
      return createStep('groupBy', {
        columns: [groupCol],
        aggregations: [{ column: valueCol, operation: op, as: `${op}_${valueCol}` }],
      }, `Group by ${groupCol}, ${op}(${valueCol})`);
    },
  },
  // Remove duplicates
  {
    patterns: [
      /(?:remove|xóa)\s+(?:duplicates?|trùng)/i,
      /(?:distinct|unique|duy nhất)/i,
    ],
    generate: () => createStep('removeDuplicates', {}, 'Remove duplicates'),
  },
  // Remove columns
  {
    patterns: [
      /(?:remove|xóa|drop)\s+(?:column|cột)\s+(\w+(?:\s*,\s*\w+)*)/i,
    ],
    generate: (match) => {
      const cols = match[1].split(',').map((c) => c.trim());
      return createStep('removeColumns', { columns: cols }, `Remove columns: ${cols.join(', ')}`);
    },
  },
  // Rename column
  {
    patterns: [
      /(?:rename|đổi tên)\s+(?:column|cột)\s+(\w+)\s+(?:to|thành)\s+(\w+)/i,
    ],
    generate: (match) => {
      return createStep('renameColumn', { from: match[1].trim(), to: match[2].trim() }, `Rename ${match[1]} → ${match[2]}`);
    },
  },
  // Trim
  {
    patterns: [
      /(?:trim|cắt khoảng trắng)\s+(?:column|cột)?\s*(\w+)?/i,
    ],
    generate: (match, columns) => {
      const col = match[1]?.trim() || columns[0] || 'A';
      return createStep('trimText', { column: col }, `Trim ${col}`);
    },
  },
  // Uppercase / lowercase
  {
    patterns: [/(?:uppercase|upper|viết hoa)\s+(?:column|cột)?\s*(\w+)?/i],
    generate: (match, columns) => {
      const col = match[1]?.trim() || columns[0] || 'A';
      return createStep('uppercase', { column: col }, `Uppercase ${col}`);
    },
  },
  {
    patterns: [/(?:lowercase|lower|viết thường)\s+(?:column|cột)?\s*(\w+)?/i],
    generate: (match, columns) => {
      const col = match[1]?.trim() || columns[0] || 'A';
      return createStep('lowercase', { column: col }, `Lowercase ${col}`);
    },
  },
  // Replace
  {
    patterns: [
      /(?:replace|thay thế)\s+["'](.+?)["']\s+(?:with|bằng|thành)\s+["'](.+?)["']\s+(?:in|ở|tại)\s+(\w+)/i,
    ],
    generate: (match) => {
      return createStep('replaceValues', {
        column: match[3].trim(),
        find: match[1],
        replace: match[2],
      }, `Replace "${match[1]}" with "${match[2]}" in ${match[3]}`);
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Parsing Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse natural language into Power Query transform steps.
 * Supports multiple instructions separated by commas, periods, or newlines.
 */
export function parseNLToSteps(input: string, columns: string[] = []): TransformStep[] {
  const steps: TransformStep[] = [];

  // Split multi-instruction input
  const instructions = input
    .split(/[,.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  for (const instruction of instructions) {
    let matched = false;

    for (const { patterns, generate } of nlPatterns) {
      for (const pattern of patterns) {
        const match = instruction.match(pattern);
        if (match) {
          const step = generate(match, columns);
          if (step) {
            steps.push(step);
            matched = true;
            break;
          }
        }
      }
      if (matched) break;
    }
  }

  return steps;
}

/**
 * Generate a human-readable description of the pipeline steps
 */
export function describeSteps(steps: TransformStep[]): string {
  return steps
    .filter((s) => s.enabled)
    .map((s, i) => `${i + 1}. ${s.label || s.type}`)
    .join('\n');
}
