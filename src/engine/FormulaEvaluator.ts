import {
  ASTNode,
  NumberNode,
  StringNode,
  BooleanNode,
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
      return a.toLowerCase().localeCompare(b.toLowerCase());
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
