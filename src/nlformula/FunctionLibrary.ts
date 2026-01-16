// =============================================================================
// FUNCTION LIBRARY — Excel function definitions
// =============================================================================

import type { ExcelFunction, FunctionInfo, FunctionCategory } from './types';

/**
 * Library of Excel functions with metadata for NL interpretation
 */
export class FunctionLibrary {
  private functions: Map<string, ExcelFunction> = new Map();

  constructor() {
    this.initializeFunctions();
  }

  /**
   * Get function info by name
   */
  getFunction(name: string): FunctionInfo | null {
    const func = this.functions.get(name.toUpperCase());
    if (!func) return null;

    return {
      name: func.name,
      description: func.description,
      descriptionVi: func.descriptionVi,
      syntax: func.syntax,
      examples: func.examples.map((e) => e.formula),
      category: func.category,
    };
  }

  /**
   * Get all functions
   */
  getAllFunctions(): ExcelFunction[] {
    return Array.from(this.functions.values());
  }

  /**
   * Get functions by category
   */
  getByCategory(category: FunctionCategory): ExcelFunction[] {
    return Array.from(this.functions.values()).filter(
      (f) => f.category === category
    );
  }

  /**
   * Search functions
   */
  search(query: string): ExcelFunction[] {
    const lower = query.toLowerCase();
    return Array.from(this.functions.values()).filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.description.toLowerCase().includes(lower) ||
        f.descriptionVi?.toLowerCase().includes(lower)
    );
  }

  /**
   * Initialize function definitions
   */
  private initializeFunctions(): void {
    // =========================================================================
    // MATH FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'SUM',
      category: 'math',
      description: 'Adds all numbers in a range',
      descriptionVi: 'Tính tổng các số trong phạm vi',
      syntax: 'SUM(number1, [number2], ...)',
      parameters: [
        {
          name: 'number1',
          type: 'number|range',
          required: true,
          description: 'First number or range',
        },
        {
          name: 'number2',
          type: 'number|range',
          required: false,
          description: 'Additional numbers or ranges',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SUM(A1:A10)', description: 'Sum of A1 to A10', result: null },
        { formula: '=SUM(1,2,3)', description: 'Sum of 1, 2, 3', result: 6 },
      ],
      nlPatterns: [
        { pattern: 'sum of (.+)', language: 'en', priority: 1, transform: 'SUM($1)' },
        { pattern: 'tổng (.+)', language: 'vi', priority: 1, transform: 'SUM($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'AVERAGE',
      category: 'statistical',
      description: 'Returns the average of numbers',
      descriptionVi: 'Tính trung bình các số',
      syntax: 'AVERAGE(number1, [number2], ...)',
      parameters: [
        {
          name: 'number1',
          type: 'number|range',
          required: true,
          description: 'First number or range',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=AVERAGE(A1:A10)', description: 'Average of A1 to A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'average of (.+)', language: 'en', priority: 1, transform: 'AVERAGE($1)' },
        { pattern: 'trung bình (.+)', language: 'vi', priority: 1, transform: 'AVERAGE($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COUNT',
      category: 'statistical',
      description: 'Counts cells containing numbers',
      descriptionVi: 'Đếm các ô chứa số',
      syntax: 'COUNT(value1, [value2], ...)',
      parameters: [
        {
          name: 'value1',
          type: 'range',
          required: true,
          description: 'Range to count',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=COUNT(A1:A10)', description: 'Count numbers in A1 to A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'count (.+)', language: 'en', priority: 1, transform: 'COUNT($1)' },
        { pattern: 'đếm (.+)', language: 'vi', priority: 1, transform: 'COUNT($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COUNTA',
      category: 'statistical',
      description: 'Counts non-empty cells',
      descriptionVi: 'Đếm các ô không trống',
      syntax: 'COUNTA(value1, [value2], ...)',
      parameters: [
        {
          name: 'value1',
          type: 'range',
          required: true,
          description: 'Range to count',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=COUNTA(A1:A10)', description: 'Count non-empty cells', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MAX',
      category: 'statistical',
      description: 'Returns the maximum value',
      descriptionVi: 'Trả về giá trị lớn nhất',
      syntax: 'MAX(number1, [number2], ...)',
      parameters: [
        {
          name: 'number1',
          type: 'number|range',
          required: true,
          description: 'First number or range',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MAX(A1:A10)', description: 'Maximum in A1 to A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'max(?:imum)? (?:of )?(.+)', language: 'en', priority: 1, transform: 'MAX($1)' },
        { pattern: 'lớn nhất (.+)', language: 'vi', priority: 1, transform: 'MAX($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MIN',
      category: 'statistical',
      description: 'Returns the minimum value',
      descriptionVi: 'Trả về giá trị nhỏ nhất',
      syntax: 'MIN(number1, [number2], ...)',
      parameters: [
        {
          name: 'number1',
          type: 'number|range',
          required: true,
          description: 'First number or range',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MIN(A1:A10)', description: 'Minimum in A1 to A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'min(?:imum)? (?:of )?(.+)', language: 'en', priority: 1, transform: 'MIN($1)' },
        { pattern: 'nhỏ nhất (.+)', language: 'vi', priority: 1, transform: 'MIN($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ROUND',
      category: 'math',
      description: 'Rounds a number to specified digits',
      descriptionVi: 'Làm tròn số đến số chữ số chỉ định',
      syntax: 'ROUND(number, num_digits)',
      parameters: [
        {
          name: 'number',
          type: 'number',
          required: true,
          description: 'Number to round',
        },
        {
          name: 'num_digits',
          type: 'number',
          required: true,
          description: 'Decimal places',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ROUND(3.14159, 2)', description: 'Round to 2 decimals', result: 3.14 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // CONDITIONAL FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'SUMIF',
      category: 'math',
      description: 'Sums cells that meet a condition',
      descriptionVi: 'Tính tổng các ô thỏa điều kiện',
      syntax: 'SUMIF(range, criteria, [sum_range])',
      parameters: [
        {
          name: 'range',
          type: 'range',
          required: true,
          description: 'Range to check criteria',
        },
        {
          name: 'criteria',
          type: 'string|number',
          required: true,
          description: 'Condition to match',
        },
        {
          name: 'sum_range',
          type: 'range',
          required: false,
          description: 'Range to sum (defaults to range)',
        },
      ],
      returnType: 'number',
      examples: [
        {
          formula: '=SUMIF(A:A,"Hanoi",B:B)',
          description: 'Sum B where A is Hanoi',
          result: null,
        },
      ],
      nlPatterns: [
        {
          pattern: 'sum (.+) where (.+) (?:is|=) (.+)',
          language: 'en',
          priority: 1,
          transform: 'SUMIF($2,"$3",$1)',
        },
        {
          pattern: 'tổng (.+) khi (.+) (?:là|=) (.+)',
          language: 'vi',
          priority: 1,
          transform: 'SUMIF($2,"$3",$1)',
        },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COUNTIF',
      category: 'statistical',
      description: 'Counts cells that meet a condition',
      descriptionVi: 'Đếm các ô thỏa điều kiện',
      syntax: 'COUNTIF(range, criteria)',
      parameters: [
        {
          name: 'range',
          type: 'range',
          required: true,
          description: 'Range to check',
        },
        {
          name: 'criteria',
          type: 'string|number',
          required: true,
          description: 'Condition to match',
        },
      ],
      returnType: 'number',
      examples: [
        {
          formula: '=COUNTIF(A:A,"Done")',
          description: 'Count cells equal to Done',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'AVERAGEIF',
      category: 'statistical',
      description: 'Averages cells that meet a condition',
      descriptionVi: 'Tính trung bình các ô thỏa điều kiện',
      syntax: 'AVERAGEIF(range, criteria, [average_range])',
      parameters: [
        {
          name: 'range',
          type: 'range',
          required: true,
          description: 'Range to check criteria',
        },
        {
          name: 'criteria',
          type: 'string|number',
          required: true,
          description: 'Condition to match',
        },
        {
          name: 'average_range',
          type: 'range',
          required: false,
          description: 'Range to average',
        },
      ],
      returnType: 'number',
      examples: [
        {
          formula: '=AVERAGEIF(A:A,"Done",B:B)',
          description: 'Average B where A is Done',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '2007',
      googleSheets: true,
    });

    // =========================================================================
    // LOGICAL FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'IF',
      category: 'logical',
      description: 'Returns different values based on condition',
      descriptionVi: 'Trả về giá trị khác nhau dựa trên điều kiện',
      syntax: 'IF(logical_test, value_if_true, [value_if_false])',
      parameters: [
        {
          name: 'logical_test',
          type: 'boolean',
          required: true,
          description: 'Condition to test',
        },
        {
          name: 'value_if_true',
          type: 'any',
          required: true,
          description: 'Value if condition is true',
        },
        {
          name: 'value_if_false',
          type: 'any',
          required: false,
          description: 'Value if condition is false',
        },
      ],
      returnType: 'any',
      examples: [
        {
          formula: '=IF(A1>10,"High","Low")',
          description: 'Check if A1 > 10',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'IFERROR',
      category: 'logical',
      description: 'Returns alternative value on error',
      descriptionVi: 'Trả về giá trị thay thế khi có lỗi',
      syntax: 'IFERROR(value, value_if_error)',
      parameters: [
        {
          name: 'value',
          type: 'any',
          required: true,
          description: 'Value to check',
        },
        {
          name: 'value_if_error',
          type: 'any',
          required: true,
          description: 'Value to return on error',
        },
      ],
      returnType: 'any',
      examples: [
        {
          formula: '=IFERROR(A1/B1,0)',
          description: 'Return 0 if division fails',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '2007',
      googleSheets: true,
    });

    // =========================================================================
    // LOOKUP FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'VLOOKUP',
      category: 'lookup',
      description: 'Looks up value in leftmost column and returns value in same row',
      descriptionVi: 'Tra cứu giá trị ở cột trái và trả về giá trị cùng hàng',
      syntax: 'VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
      parameters: [
        {
          name: 'lookup_value',
          type: 'any',
          required: true,
          description: 'Value to search for',
        },
        {
          name: 'table_array',
          type: 'range',
          required: true,
          description: 'Table to search in',
        },
        {
          name: 'col_index_num',
          type: 'number',
          required: true,
          description: 'Column number to return',
        },
        {
          name: 'range_lookup',
          type: 'boolean',
          required: false,
          description: 'FALSE for exact match',
          default: true,
        },
      ],
      returnType: 'any',
      examples: [
        {
          formula: '=VLOOKUP("Apple",A:C,2,FALSE)',
          description: 'Find Apple and return column 2',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'INDEX',
      category: 'lookup',
      description: 'Returns value at specified row and column',
      descriptionVi: 'Trả về giá trị tại hàng và cột chỉ định',
      syntax: 'INDEX(array, row_num, [col_num])',
      parameters: [
        {
          name: 'array',
          type: 'range',
          required: true,
          description: 'Range of cells',
        },
        {
          name: 'row_num',
          type: 'number',
          required: true,
          description: 'Row number',
        },
        {
          name: 'col_num',
          type: 'number',
          required: false,
          description: 'Column number',
        },
      ],
      returnType: 'any',
      examples: [
        {
          formula: '=INDEX(A1:C10,5,2)',
          description: 'Return value at row 5, column 2',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MATCH',
      category: 'lookup',
      description: 'Returns position of value in range',
      descriptionVi: 'Trả về vị trí của giá trị trong phạm vi',
      syntax: 'MATCH(lookup_value, lookup_array, [match_type])',
      parameters: [
        {
          name: 'lookup_value',
          type: 'any',
          required: true,
          description: 'Value to find',
        },
        {
          name: 'lookup_array',
          type: 'range',
          required: true,
          description: 'Range to search',
        },
        {
          name: 'match_type',
          type: 'number',
          required: false,
          description: '0 for exact match',
          default: 1,
        },
      ],
      returnType: 'number',
      examples: [
        {
          formula: '=MATCH("Apple",A:A,0)',
          description: 'Find position of Apple',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // TEXT FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'CONCAT',
      category: 'text',
      description: 'Joins text from multiple ranges',
      descriptionVi: 'Nối văn bản từ nhiều phạm vi',
      syntax: 'CONCAT(text1, [text2], ...)',
      parameters: [
        {
          name: 'text1',
          type: 'text',
          required: true,
          description: 'First text',
        },
      ],
      returnType: 'text',
      examples: [
        {
          formula: '=CONCAT(A1," ",B1)',
          description: 'Join A1 and B1 with space',
          result: null,
        },
      ],
      nlPatterns: [],
      excelVersion: '2016',
      googleSheets: true,
    });

    this.addFunction({
      name: 'LEFT',
      category: 'text',
      description: 'Returns leftmost characters',
      descriptionVi: 'Trả về các ký tự bên trái',
      syntax: 'LEFT(text, [num_chars])',
      parameters: [
        {
          name: 'text',
          type: 'text',
          required: true,
          description: 'Text string',
        },
        {
          name: 'num_chars',
          type: 'number',
          required: false,
          description: 'Number of characters',
          default: 1,
        },
      ],
      returnType: 'text',
      examples: [
        { formula: '=LEFT(A1,3)', description: 'First 3 characters', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'RIGHT',
      category: 'text',
      description: 'Returns rightmost characters',
      descriptionVi: 'Trả về các ký tự bên phải',
      syntax: 'RIGHT(text, [num_chars])',
      parameters: [
        {
          name: 'text',
          type: 'text',
          required: true,
          description: 'Text string',
        },
        {
          name: 'num_chars',
          type: 'number',
          required: false,
          description: 'Number of characters',
          default: 1,
        },
      ],
      returnType: 'text',
      examples: [
        { formula: '=RIGHT(A1,3)', description: 'Last 3 characters', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // DATE FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'TODAY',
      category: 'date',
      description: 'Returns current date',
      descriptionVi: 'Trả về ngày hiện tại',
      syntax: 'TODAY()',
      parameters: [],
      returnType: 'date',
      examples: [
        { formula: '=TODAY()', description: 'Current date', result: null },
      ],
      nlPatterns: [
        { pattern: "today(?:'s)? date", language: 'en', priority: 1, transform: 'TODAY()' },
        { pattern: 'hôm nay', language: 'vi', priority: 1, transform: 'TODAY()' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'NOW',
      category: 'date',
      description: 'Returns current date and time',
      descriptionVi: 'Trả về ngày và giờ hiện tại',
      syntax: 'NOW()',
      parameters: [],
      returnType: 'datetime',
      examples: [
        { formula: '=NOW()', description: 'Current date and time', result: null },
      ],
      nlPatterns: [
        { pattern: 'current time', language: 'en', priority: 1, transform: 'NOW()' },
        { pattern: 'hiện tại', language: 'vi', priority: 1, transform: 'NOW()' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'YEAR',
      category: 'date',
      description: 'Extracts year from date',
      descriptionVi: 'Trích xuất năm từ ngày',
      syntax: 'YEAR(serial_number)',
      parameters: [
        {
          name: 'serial_number',
          type: 'date',
          required: true,
          description: 'Date to extract year from',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=YEAR(A1)', description: 'Year of date in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MONTH',
      category: 'date',
      description: 'Extracts month from date',
      descriptionVi: 'Trích xuất tháng từ ngày',
      syntax: 'MONTH(serial_number)',
      parameters: [
        {
          name: 'serial_number',
          type: 'date',
          required: true,
          description: 'Date to extract month from',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MONTH(A1)', description: 'Month of date in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'DAY',
      category: 'date',
      description: 'Extracts day from date',
      descriptionVi: 'Trích xuất ngày từ ngày',
      syntax: 'DAY(serial_number)',
      parameters: [
        {
          name: 'serial_number',
          type: 'date',
          required: true,
          description: 'Date to extract day from',
        },
      ],
      returnType: 'number',
      examples: [
        { formula: '=DAY(A1)', description: 'Day of date in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });
  }

  /**
   * Add a function to the library
   */
  private addFunction(func: ExcelFunction): void {
    this.functions.set(func.name.toUpperCase(), func);
  }
}

// Export singleton
export const functionLibrary = new FunctionLibrary();
