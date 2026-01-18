import {
  ASTNode,
  NumberNode,
  StringNode,
  BooleanNode,
  ErrorNode,
  CellRefNode,
  RangeRefNode,
  FunctionCallNode,
  BinaryOpNode,
  UnaryOpNode,
  ArrayNode,
  FormulaValue,
  FormulaError,
  EvalContext,
  CellDependency,
} from './types';
import { getFunction } from './functions';
import { toNumber, toString, isError } from './functions/utils';
import { parseCellRef } from './FormulaParser';

export class FormulaEvaluator {
  private dependencies: CellDependency[] = [];

  evaluate(ast: ASTNode, context: EvalContext): FormulaValue {
    this.dependencies = [];
    return this.evalNode(ast, context);
  }

  getDependencies(): CellDependency[] {
    return this.dependencies;
  }

  private evalNode(node: ASTNode, context: EvalContext): FormulaValue {
    switch (node.type) {
      case 'Number':
        return (node as NumberNode).value;

      case 'String':
        return (node as StringNode).value;

      case 'Boolean':
        return (node as BooleanNode).value;

      case 'Error':
        return new FormulaError((node as ErrorNode).errorType);

      case 'CellRef':
        return this.evalCellRef(node as CellRefNode, context);

      case 'RangeRef':
        return this.evalRangeRef(node as RangeRefNode, context);

      case 'FunctionCall':
        return this.evalFunctionCall(node as FunctionCallNode, context);

      case 'BinaryOp':
        return this.evalBinaryOp(node as BinaryOpNode, context);

      case 'UnaryOp':
        return this.evalUnaryOp(node as UnaryOpNode, context);

      case 'Array':
        return this.evalArray(node as ArrayNode, context);

      default:
        return new FormulaError('#ERROR!', `Unknown node type: ${node.type}`);
    }
  }

  private evalCellRef(node: CellRefNode, context: EvalContext): FormulaValue {
    const ref = node.ref;

    // Track dependency
    this.dependencies.push({
      sheetId: ref.sheetName || context.sheetId,
      row: ref.row,
      col: ref.col,
    });

    return context.getCellValue(ref);
  }

  private evalRangeRef(node: RangeRefNode, context: EvalContext): FormulaValue[][] {
    const { start, end } = node;

    // Track dependencies for all cells in range
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const sheetId = start.sheetName || context.sheetId;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        this.dependencies.push({ sheetId, row, col });
      }
    }

    return context.getRangeValues(start, end);
  }

  private evalFunctionCall(node: FunctionCallNode, context: EvalContext): FormulaValue {
    // Special handling for functions that need reference information (before checking registry)
    const refFunctions = ['ROW', 'COLUMN', 'ROWS', 'COLUMNS', 'ADDRESS', 'INDIRECT', 'OFFSET'];
    if (refFunctions.includes(node.name)) {
      return this.evalRefFunction(node, context);
    }

    const fnDef = getFunction(node.name);

    if (!fnDef) {
      return new FormulaError('#NAME?', `Unknown function: ${node.name}`);
    }

    // Check argument count
    if (node.args.length < fnDef.minArgs) {
      return new FormulaError('#VALUE!', `${node.name} requires at least ${fnDef.minArgs} arguments`);
    }

    if (node.args.length > fnDef.maxArgs) {
      return new FormulaError('#VALUE!', `${node.name} accepts at most ${fnDef.maxArgs} arguments`);
    }

    // Evaluate arguments
    const evaluatedArgs: FormulaValue[] = [];

    for (const arg of node.args) {
      const value = this.evalNode(arg, context);
      evaluatedArgs.push(value);
    }

    // Call function
    try {
      return fnDef.fn(evaluatedArgs, context);
    } catch (err) {
      if (err instanceof FormulaError) {
        return err;
      }
      return new FormulaError('#ERROR!', String(err));
    }
  }

  // Handle functions that need reference information
  private evalRefFunction(node: FunctionCallNode, context: EvalContext): FormulaValue {
    switch (node.name) {
      case 'ROW': {
        if (node.args.length === 0) {
          return context.currentCell ? context.currentCell.row + 1 : 1;
        }
        const arg = node.args[0];
        if (arg.type === 'CellRef') {
          const ref = (arg as CellRefNode).ref;
          this.dependencies.push({ sheetId: ref.sheetName || context.sheetId, row: ref.row, col: ref.col });
          return ref.row + 1; // 1-indexed
        }
        if (arg.type === 'RangeRef') {
          const range = arg as RangeRefNode;
          return Math.min(range.start.row, range.end.row) + 1;
        }
        return new FormulaError('#VALUE!');
      }

      case 'COLUMN': {
        if (node.args.length === 0) {
          return context.currentCell ? context.currentCell.col + 1 : 1;
        }
        const arg = node.args[0];
        if (arg.type === 'CellRef') {
          const ref = (arg as CellRefNode).ref;
          this.dependencies.push({ sheetId: ref.sheetName || context.sheetId, row: ref.row, col: ref.col });
          return ref.col + 1; // 1-indexed
        }
        if (arg.type === 'RangeRef') {
          const range = arg as RangeRefNode;
          return Math.min(range.start.col, range.end.col) + 1;
        }
        return new FormulaError('#VALUE!');
      }

      case 'ROWS': {
        if (node.args.length === 0) {
          return new FormulaError('#VALUE!');
        }
        const arg = node.args[0];
        if (arg.type === 'RangeRef') {
          const range = arg as RangeRefNode;
          return Math.abs(range.end.row - range.start.row) + 1;
        }
        if (arg.type === 'CellRef') {
          return 1;
        }
        // For arrays
        const val = this.evalNode(arg, context);
        if (Array.isArray(val)) return val.length;
        return 1;
      }

      case 'COLUMNS': {
        if (node.args.length === 0) {
          return new FormulaError('#VALUE!');
        }
        const arg = node.args[0];
        if (arg.type === 'RangeRef') {
          const range = arg as RangeRefNode;
          return Math.abs(range.end.col - range.start.col) + 1;
        }
        if (arg.type === 'CellRef') {
          return 1;
        }
        // For arrays
        const val = this.evalNode(arg, context);
        if (Array.isArray(val) && Array.isArray(val[0])) return val[0].length;
        return 1;
      }

      case 'ADDRESS': {
        const rowNum = this.evalNode(node.args[0], context);
        const colNum = this.evalNode(node.args[1], context);
        const absNum = node.args[2] ? this.evalNode(node.args[2], context) : 1;
        // A1 style parameter (not currently used but may be needed for R1C1 style)
        void (node.args[3] ? this.evalNode(node.args[3], context) : true);
        const sheetText = node.args[4] ? this.evalNode(node.args[4], context) : '';

        if (isError(rowNum)) return rowNum;
        if (isError(colNum)) return colNum;

        const row = rowNum as number;
        const col = colNum as number;
        const abs = (absNum as number) || 1;
        const sheet = sheetText ? `${sheetText}!` : '';

        // Convert column number to letter
        const colLetter = this.numberToColLetter(col);

        let result = '';
        switch (abs) {
          case 1: result = `$${colLetter}$${row}`; break; // Absolute
          case 2: result = `${colLetter}$${row}`; break;   // Row absolute
          case 3: result = `$${colLetter}${row}`; break;   // Column absolute
          case 4: result = `${colLetter}${row}`; break;    // Relative
          default: result = `$${colLetter}$${row}`;
        }

        return sheet + result;
      }

      case 'INDIRECT': {
        const refText = this.evalNode(node.args[0], context);
        if (isError(refText)) return refText;
        if (typeof refText !== 'string') {
          return new FormulaError('#REF!');
        }

        // Parse the reference string
        try {
          const ref = parseCellRef(refText);
          this.dependencies.push({ sheetId: ref.sheetName || context.sheetId, row: ref.row, col: ref.col });
          return context.getCellValue(ref);
        } catch {
          return new FormulaError('#REF!', 'Invalid reference');
        }
      }

      case 'OFFSET': {
        if (node.args.length < 3) {
          return new FormulaError('#VALUE!');
        }

        const arg = node.args[0];
        let baseRow: number, baseCol: number;

        if (arg.type === 'CellRef') {
          const ref = (arg as CellRefNode).ref;
          baseRow = ref.row;
          baseCol = ref.col;
        } else if (arg.type === 'RangeRef') {
          const range = arg as RangeRefNode;
          baseRow = Math.min(range.start.row, range.end.row);
          baseCol = Math.min(range.start.col, range.end.col);
        } else {
          return new FormulaError('#VALUE!');
        }

        const rowOffset = this.evalNode(node.args[1], context);
        const colOffset = this.evalNode(node.args[2], context);
        const height = node.args[3] ? this.evalNode(node.args[3], context) : 1;
        const width = node.args[4] ? this.evalNode(node.args[4], context) : 1;

        if (isError(rowOffset)) return rowOffset;
        if (isError(colOffset)) return colOffset;

        const newRow = baseRow + (rowOffset as number);
        const newCol = baseCol + (colOffset as number);
        const h = (height as number) || 1;
        const w = (width as number) || 1;

        if (newRow < 0 || newCol < 0) {
          return new FormulaError('#REF!');
        }

        // Track dependencies
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            this.dependencies.push({ sheetId: context.sheetId, row: newRow + r, col: newCol + c });
          }
        }

        // Return single cell or range
        if (h === 1 && w === 1) {
          return context.getCellValue({ row: newRow, col: newCol, colAbsolute: false, rowAbsolute: false });
        }

        return context.getRangeValues(
          { row: newRow, col: newCol, colAbsolute: false, rowAbsolute: false },
          { row: newRow + h - 1, col: newCol + w - 1, colAbsolute: false, rowAbsolute: false }
        );
      }

      default:
        return new FormulaError('#NAME?');
    }
  }

  // Helper to convert column number to letter
  private numberToColLetter(num: number): string {
    let result = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }
    return result;
  }

  private evalBinaryOp(node: BinaryOpNode, context: EvalContext): FormulaValue {
    const left = this.evalNode(node.left, context);
    const right = this.evalNode(node.right, context);

    // Propagate errors
    if (isError(left)) return left;
    if (isError(right)) return right;

    switch (node.operator) {
      case '+': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        return (leftNum as number) + (rightNum as number);
      }

      case '-': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        return (leftNum as number) - (rightNum as number);
      }

      case '*': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        return (leftNum as number) * (rightNum as number);
      }

      case '/': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        if ((rightNum as number) === 0) {
          return new FormulaError('#DIV/0!');
        }
        return (leftNum as number) / (rightNum as number);
      }

      case '^': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        return Math.pow(leftNum as number, rightNum as number);
      }

      case '%': {
        const leftNum = toNumber(left);
        const rightNum = toNumber(right);
        if (isError(leftNum)) return leftNum;
        if (isError(rightNum)) return rightNum;
        if ((rightNum as number) === 0) {
          return new FormulaError('#DIV/0!');
        }
        return (leftNum as number) % (rightNum as number);
      }

      case '&': {
        // String concatenation
        return toString(left) + toString(right);
      }

      case '=': {
        return this.compareValues(left, right) === 0;
      }

      case '<>': {
        return this.compareValues(left, right) !== 0;
      }

      case '<': {
        return this.compareValues(left, right) < 0;
      }

      case '>': {
        return this.compareValues(left, right) > 0;
      }

      case '<=': {
        return this.compareValues(left, right) <= 0;
      }

      case '>=': {
        return this.compareValues(left, right) >= 0;
      }

      default:
        return new FormulaError('#ERROR!', `Unknown operator: ${node.operator}`);
    }
  }

  private evalUnaryOp(node: UnaryOpNode, context: EvalContext): FormulaValue {
    const operand = this.evalNode(node.operand, context);

    if (isError(operand)) return operand;

    switch (node.operator) {
      case '-': {
        const num = toNumber(operand);
        if (isError(num)) return num;
        return -(num as number);
      }

      case '+': {
        const num = toNumber(operand);
        if (isError(num)) return num;
        return num as number;
      }

      default:
        return new FormulaError('#ERROR!', `Unknown unary operator: ${node.operator}`);
    }
  }

  private evalArray(node: ArrayNode, context: EvalContext): FormulaValue[][] {
    return node.elements.map((row) =>
      row.map((element) => this.evalNode(element, context))
    );
  }

  private compareValues(a: FormulaValue, b: FormulaValue): number {
    // Handle nulls
    if (a === null && b === null) return 0;
    if (a === null) return -1;
    if (b === null) return 1;

    // Same type comparison
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    if (typeof a === 'string' && typeof b === 'string') {
      // Case-sensitive string comparison
      return a.localeCompare(b);
    }

    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return (a ? 1 : 0) - (b ? 1 : 0);
    }

    // Cross-type: convert to strings for comparison
    const strA = toString(a).toLowerCase();
    const strB = toString(b).toLowerCase();
    return strA.localeCompare(strB);
  }
}

// Export singleton evaluator
export const formulaEvaluator = new FormulaEvaluator();
