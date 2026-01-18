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

    // =========================================================================
    // MODERN LOOKUP FUNCTIONS (Excel 365+)
    // =========================================================================
    this.addFunction({
      name: 'XLOOKUP',
      category: 'lookup',
      description: 'Searches a range and returns an item corresponding to the first match',
      descriptionVi: 'Tìm kiếm trong phạm vi và trả về giá trị tương ứng với kết quả đầu tiên',
      syntax: 'XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
      parameters: [
        { name: 'lookup_value', type: 'any', required: true, description: 'Value to search for' },
        { name: 'lookup_array', type: 'range', required: true, description: 'Range to search' },
        { name: 'return_array', type: 'range', required: true, description: 'Range to return from' },
        { name: 'if_not_found', type: 'any', required: false, description: 'Value if not found' },
        { name: 'match_mode', type: 'number', required: false, description: '0=exact, -1=exact or smaller, 1=exact or larger, 2=wildcard' },
        { name: 'search_mode', type: 'number', required: false, description: '1=first to last, -1=last to first, 2=binary ascending, -2=binary descending' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=XLOOKUP("Apple",A:A,B:B,"Not found")', description: 'Find Apple in A, return from B', result: null },
      ],
      nlPatterns: [
        { pattern: 'lookup (.+) in (.+) return (.+)', language: 'en', priority: 1, transform: 'XLOOKUP($1,$2,$3)' },
        { pattern: 'tìm (.+) trong (.+) trả về (.+)', language: 'vi', priority: 1, transform: 'XLOOKUP($1,$2,$3)' },
      ],
      excelVersion: '365',
      googleSheets: false,
    });

    this.addFunction({
      name: 'FILTER',
      category: 'lookup',
      description: 'Filters a range based on criteria',
      descriptionVi: 'Lọc phạm vi dựa trên điều kiện',
      syntax: 'FILTER(array, include, [if_empty])',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to filter' },
        { name: 'include', type: 'boolean[]', required: true, description: 'Criteria array' },
        { name: 'if_empty', type: 'any', required: false, description: 'Value if no results' },
      ],
      returnType: 'array',
      examples: [
        { formula: '=FILTER(A:B,A:A>100)', description: 'Filter rows where A > 100', result: null },
      ],
      nlPatterns: [
        { pattern: 'filter (.+) where (.+)', language: 'en', priority: 1, transform: 'FILTER($1,$2)' },
        { pattern: 'lọc (.+) với (.+)', language: 'vi', priority: 1, transform: 'FILTER($1,$2)' },
      ],
      excelVersion: '365',
      googleSheets: true,
    });

    this.addFunction({
      name: 'UNIQUE',
      category: 'lookup',
      description: 'Returns unique values from a range',
      descriptionVi: 'Trả về các giá trị duy nhất từ phạm vi',
      syntax: 'UNIQUE(array, [by_col], [exactly_once])',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to extract unique values from' },
        { name: 'by_col', type: 'boolean', required: false, description: 'TRUE to compare columns' },
        { name: 'exactly_once', type: 'boolean', required: false, description: 'TRUE for values appearing exactly once' },
      ],
      returnType: 'array',
      examples: [
        { formula: '=UNIQUE(A:A)', description: 'Unique values in column A', result: null },
      ],
      nlPatterns: [
        { pattern: 'unique (?:values )?(?:in|of) (.+)', language: 'en', priority: 1, transform: 'UNIQUE($1)' },
        { pattern: 'giá trị duy nhất (?:trong|của) (.+)', language: 'vi', priority: 1, transform: 'UNIQUE($1)' },
      ],
      excelVersion: '365',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SORT',
      category: 'lookup',
      description: 'Sorts the contents of a range',
      descriptionVi: 'Sắp xếp nội dung của phạm vi',
      syntax: 'SORT(array, [sort_index], [sort_order], [by_col])',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to sort' },
        { name: 'sort_index', type: 'number', required: false, description: 'Column or row number to sort by' },
        { name: 'sort_order', type: 'number', required: false, description: '1=ascending, -1=descending' },
        { name: 'by_col', type: 'boolean', required: false, description: 'TRUE to sort by columns' },
      ],
      returnType: 'array',
      examples: [
        { formula: '=SORT(A:B,2,-1)', description: 'Sort A:B by column 2 descending', result: null },
      ],
      nlPatterns: [
        { pattern: 'sort (.+) by (.+)', language: 'en', priority: 1, transform: 'SORT($1,$2)' },
        { pattern: 'sắp xếp (.+) theo (.+)', language: 'vi', priority: 1, transform: 'SORT($1,$2)' },
      ],
      excelVersion: '365',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SORTBY',
      category: 'lookup',
      description: 'Sorts a range by values in a corresponding range',
      descriptionVi: 'Sắp xếp phạm vi theo giá trị trong phạm vi tương ứng',
      syntax: 'SORTBY(array, by_array1, [sort_order1], ...)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to sort' },
        { name: 'by_array1', type: 'range', required: true, description: 'Range to sort by' },
        { name: 'sort_order1', type: 'number', required: false, description: '1=ascending, -1=descending' },
      ],
      returnType: 'array',
      examples: [
        { formula: '=SORTBY(A:B,B:B,-1)', description: 'Sort A:B by B descending', result: null },
      ],
      nlPatterns: [],
      excelVersion: '365',
      googleSheets: false,
    });

    // =========================================================================
    // MULTI-CONDITION FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'SUMIFS',
      category: 'math',
      description: 'Sums cells that meet multiple criteria',
      descriptionVi: 'Tính tổng các ô thỏa nhiều điều kiện',
      syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
      parameters: [
        { name: 'sum_range', type: 'range', required: true, description: 'Range to sum' },
        { name: 'criteria_range1', type: 'range', required: true, description: 'First criteria range' },
        { name: 'criteria1', type: 'string|number', required: true, description: 'First criteria' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SUMIFS(C:C,A:A,"North",B:B,">100")', description: 'Sum C where A=North AND B>100', result: null },
      ],
      nlPatterns: [
        { pattern: 'sum (.+) where (.+) is (.+) and (.+) is (.+)', language: 'en', priority: 2, transform: 'SUMIFS($1,$2,"$3",$4,"$5")' },
        { pattern: 'tổng (.+) khi (.+) là (.+) và (.+) là (.+)', language: 'vi', priority: 2, transform: 'SUMIFS($1,$2,"$3",$4,"$5")' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COUNTIFS',
      category: 'statistical',
      description: 'Counts cells that meet multiple criteria',
      descriptionVi: 'Đếm các ô thỏa nhiều điều kiện',
      syntax: 'COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
      parameters: [
        { name: 'criteria_range1', type: 'range', required: true, description: 'First criteria range' },
        { name: 'criteria1', type: 'string|number', required: true, description: 'First criteria' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=COUNTIFS(A:A,"North",B:B,">100")', description: 'Count where A=North AND B>100', result: null },
      ],
      nlPatterns: [
        { pattern: 'count where (.+) is (.+) and (.+) is (.+)', language: 'en', priority: 2, transform: 'COUNTIFS($1,"$2",$3,"$4")' },
        { pattern: 'đếm khi (.+) là (.+) và (.+) là (.+)', language: 'vi', priority: 2, transform: 'COUNTIFS($1,"$2",$3,"$4")' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'AVERAGEIFS',
      category: 'statistical',
      description: 'Averages cells that meet multiple criteria',
      descriptionVi: 'Tính trung bình các ô thỏa nhiều điều kiện',
      syntax: 'AVERAGEIFS(average_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
      parameters: [
        { name: 'average_range', type: 'range', required: true, description: 'Range to average' },
        { name: 'criteria_range1', type: 'range', required: true, description: 'First criteria range' },
        { name: 'criteria1', type: 'string|number', required: true, description: 'First criteria' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=AVERAGEIFS(C:C,A:A,"North",B:B,">100")', description: 'Average C where A=North AND B>100', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MAXIFS',
      category: 'statistical',
      description: 'Returns maximum value among cells specified by given criteria',
      descriptionVi: 'Trả về giá trị lớn nhất trong các ô thỏa điều kiện',
      syntax: 'MAXIFS(max_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
      parameters: [
        { name: 'max_range', type: 'range', required: true, description: 'Range to find max' },
        { name: 'criteria_range1', type: 'range', required: true, description: 'First criteria range' },
        { name: 'criteria1', type: 'string|number', required: true, description: 'First criteria' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MAXIFS(C:C,A:A,"North")', description: 'Max C where A=North', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2016',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MINIFS',
      category: 'statistical',
      description: 'Returns minimum value among cells specified by given criteria',
      descriptionVi: 'Trả về giá trị nhỏ nhất trong các ô thỏa điều kiện',
      syntax: 'MINIFS(min_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
      parameters: [
        { name: 'min_range', type: 'range', required: true, description: 'Range to find min' },
        { name: 'criteria_range1', type: 'range', required: true, description: 'First criteria range' },
        { name: 'criteria1', type: 'string|number', required: true, description: 'First criteria' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MINIFS(C:C,A:A,"North")', description: 'Min C where A=North', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2016',
      googleSheets: true,
    });

    // =========================================================================
    // ADDITIONAL LOGICAL FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'AND',
      category: 'logical',
      description: 'Returns TRUE if all arguments are TRUE',
      descriptionVi: 'Trả về TRUE nếu tất cả đối số đều TRUE',
      syntax: 'AND(logical1, [logical2], ...)',
      parameters: [
        { name: 'logical1', type: 'boolean', required: true, description: 'First condition' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=AND(A1>10,B1<20)', description: 'A1>10 AND B1<20', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'OR',
      category: 'logical',
      description: 'Returns TRUE if any argument is TRUE',
      descriptionVi: 'Trả về TRUE nếu bất kỳ đối số nào TRUE',
      syntax: 'OR(logical1, [logical2], ...)',
      parameters: [
        { name: 'logical1', type: 'boolean', required: true, description: 'First condition' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=OR(A1>10,B1<20)', description: 'A1>10 OR B1<20', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'NOT',
      category: 'logical',
      description: 'Reverses the logic of its argument',
      descriptionVi: 'Đảo ngược logic của đối số',
      syntax: 'NOT(logical)',
      parameters: [
        { name: 'logical', type: 'boolean', required: true, description: 'Value to reverse' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=NOT(A1>10)', description: 'NOT(A1>10)', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'IFS',
      category: 'logical',
      description: 'Returns value matching the first TRUE condition',
      descriptionVi: 'Trả về giá trị khớp với điều kiện TRUE đầu tiên',
      syntax: 'IFS(logical_test1, value_if_true1, [logical_test2, value_if_true2], ...)',
      parameters: [
        { name: 'logical_test1', type: 'boolean', required: true, description: 'First condition' },
        { name: 'value_if_true1', type: 'any', required: true, description: 'Value if first condition is TRUE' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=IFS(A1>=90,"A",A1>=80,"B",A1>=70,"C",TRUE,"F")', description: 'Grade based on score', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2016',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SWITCH',
      category: 'logical',
      description: 'Evaluates an expression against a list of values and returns the corresponding result',
      descriptionVi: 'Đánh giá biểu thức với danh sách giá trị và trả về kết quả tương ứng',
      syntax: 'SWITCH(expression, value1, result1, [value2, result2], ..., [default])',
      parameters: [
        { name: 'expression', type: 'any', required: true, description: 'Value to match' },
        { name: 'value1', type: 'any', required: true, description: 'First value to match against' },
        { name: 'result1', type: 'any', required: true, description: 'Result if value1 matches' },
        { name: 'default', type: 'any', required: false, description: 'Default result if no match' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=SWITCH(A1,1,"One",2,"Two",3,"Three","Other")', description: 'Map number to word', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2016',
      googleSheets: true,
    });

    this.addFunction({
      name: 'XOR',
      category: 'logical',
      description: 'Returns TRUE if an odd number of arguments are TRUE',
      descriptionVi: 'Trả về TRUE nếu số lẻ đối số TRUE',
      syntax: 'XOR(logical1, [logical2], ...)',
      parameters: [
        { name: 'logical1', type: 'boolean', required: true, description: 'First condition' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=XOR(A1>10,B1>20)', description: 'XOR of two conditions', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2013',
      googleSheets: true,
    });

    // =========================================================================
    // ADDITIONAL MATH FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'ABS',
      category: 'math',
      description: 'Returns the absolute value of a number',
      descriptionVi: 'Trả về giá trị tuyệt đối của số',
      syntax: 'ABS(number)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to get absolute value of' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ABS(-5)', description: 'Absolute value of -5', result: 5 },
      ],
      nlPatterns: [
        { pattern: 'absolute value of (.+)', language: 'en', priority: 1, transform: 'ABS($1)' },
        { pattern: 'giá trị tuyệt đối (.+)', language: 'vi', priority: 1, transform: 'ABS($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SQRT',
      category: 'math',
      description: 'Returns the square root of a number',
      descriptionVi: 'Trả về căn bậc hai của số',
      syntax: 'SQRT(number)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to get square root of' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SQRT(16)', description: 'Square root of 16', result: 4 },
      ],
      nlPatterns: [
        { pattern: 'square root of (.+)', language: 'en', priority: 1, transform: 'SQRT($1)' },
        { pattern: 'căn bậc hai (.+)', language: 'vi', priority: 1, transform: 'SQRT($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'POWER',
      category: 'math',
      description: 'Returns number raised to power',
      descriptionVi: 'Trả về số lũy thừa',
      syntax: 'POWER(number, power)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Base number' },
        { name: 'power', type: 'number', required: true, description: 'Exponent' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=POWER(2,8)', description: '2 to the power of 8', result: 256 },
      ],
      nlPatterns: [
        { pattern: '(.+) to the power of (.+)', language: 'en', priority: 1, transform: 'POWER($1,$2)' },
        { pattern: '(.+) mũ (.+)', language: 'vi', priority: 1, transform: 'POWER($1,$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MOD',
      category: 'math',
      description: 'Returns the remainder after division',
      descriptionVi: 'Trả về phần dư sau phép chia',
      syntax: 'MOD(number, divisor)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to divide' },
        { name: 'divisor', type: 'number', required: true, description: 'Divisor' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MOD(10,3)', description: 'Remainder of 10/3', result: 1 },
      ],
      nlPatterns: [
        { pattern: 'remainder of (.+) divided by (.+)', language: 'en', priority: 1, transform: 'MOD($1,$2)' },
        { pattern: 'phần dư (.+) chia (.+)', language: 'vi', priority: 1, transform: 'MOD($1,$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'CEILING',
      category: 'math',
      description: 'Rounds a number up to the nearest multiple',
      descriptionVi: 'Làm tròn lên đến bội số gần nhất',
      syntax: 'CEILING(number, significance)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to round up' },
        { name: 'significance', type: 'number', required: true, description: 'Multiple to round to' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=CEILING(4.2,1)', description: 'Round 4.2 up', result: 5 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'FLOOR',
      category: 'math',
      description: 'Rounds a number down to the nearest multiple',
      descriptionVi: 'Làm tròn xuống đến bội số gần nhất',
      syntax: 'FLOOR(number, significance)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to round down' },
        { name: 'significance', type: 'number', required: true, description: 'Multiple to round to' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=FLOOR(4.8,1)', description: 'Round 4.8 down', result: 4 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ROUNDUP',
      category: 'math',
      description: 'Rounds a number up, away from zero',
      descriptionVi: 'Làm tròn lên, xa khỏi 0',
      syntax: 'ROUNDUP(number, num_digits)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to round' },
        { name: 'num_digits', type: 'number', required: true, description: 'Decimal places' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ROUNDUP(3.14159,2)', description: 'Round up to 2 decimals', result: 3.15 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ROUNDDOWN',
      category: 'math',
      description: 'Rounds a number down, toward zero',
      descriptionVi: 'Làm tròn xuống, về phía 0',
      syntax: 'ROUNDDOWN(number, num_digits)',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to round' },
        { name: 'num_digits', type: 'number', required: true, description: 'Decimal places' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ROUNDDOWN(3.99,0)', description: 'Round down to integer', result: 3 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'PRODUCT',
      category: 'math',
      description: 'Multiplies all numbers given as arguments',
      descriptionVi: 'Nhân tất cả các số',
      syntax: 'PRODUCT(number1, [number2], ...)',
      parameters: [
        { name: 'number1', type: 'number|range', required: true, description: 'First number or range' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=PRODUCT(A1:A5)', description: 'Product of A1 to A5', result: null },
      ],
      nlPatterns: [
        { pattern: 'product of (.+)', language: 'en', priority: 1, transform: 'PRODUCT($1)' },
        { pattern: 'tích của (.+)', language: 'vi', priority: 1, transform: 'PRODUCT($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SUMPRODUCT',
      category: 'math',
      description: 'Returns the sum of the products of corresponding array components',
      descriptionVi: 'Trả về tổng của tích các phần tử tương ứng trong mảng',
      syntax: 'SUMPRODUCT(array1, [array2], ...)',
      parameters: [
        { name: 'array1', type: 'range', required: true, description: 'First array' },
        { name: 'array2', type: 'range', required: false, description: 'Additional arrays' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SUMPRODUCT(A1:A3,B1:B3)', description: 'Sum of A*B products', result: null },
      ],
      nlPatterns: [
        { pattern: 'sum product of (.+) and (.+)', language: 'en', priority: 1, transform: 'SUMPRODUCT($1,$2)' },
        { pattern: 'tổng tích (.+) và (.+)', language: 'vi', priority: 1, transform: 'SUMPRODUCT($1,$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'RAND',
      category: 'math',
      description: 'Returns a random number between 0 and 1',
      descriptionVi: 'Trả về số ngẫu nhiên từ 0 đến 1',
      syntax: 'RAND()',
      parameters: [],
      returnType: 'number',
      examples: [
        { formula: '=RAND()', description: 'Random number 0-1', result: null },
      ],
      nlPatterns: [
        { pattern: 'random number', language: 'en', priority: 1, transform: 'RAND()' },
        { pattern: 'số ngẫu nhiên', language: 'vi', priority: 1, transform: 'RAND()' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'RANDBETWEEN',
      category: 'math',
      description: 'Returns a random integer between specified numbers',
      descriptionVi: 'Trả về số nguyên ngẫu nhiên trong phạm vi',
      syntax: 'RANDBETWEEN(bottom, top)',
      parameters: [
        { name: 'bottom', type: 'number', required: true, description: 'Minimum value' },
        { name: 'top', type: 'number', required: true, description: 'Maximum value' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=RANDBETWEEN(1,100)', description: 'Random integer 1-100', result: null },
      ],
      nlPatterns: [
        { pattern: 'random (?:number )?between (.+) and (.+)', language: 'en', priority: 1, transform: 'RANDBETWEEN($1,$2)' },
        { pattern: 'số ngẫu nhiên từ (.+) đến (.+)', language: 'vi', priority: 1, transform: 'RANDBETWEEN($1,$2)' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    // =========================================================================
    // ADDITIONAL TEXT FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'TRIM',
      category: 'text',
      description: 'Removes extra spaces from text',
      descriptionVi: 'Xóa khoảng trắng thừa từ văn bản',
      syntax: 'TRIM(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to trim' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=TRIM(A1)', description: 'Trim spaces from A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'trim (.+)', language: 'en', priority: 1, transform: 'TRIM($1)' },
        { pattern: 'cắt khoảng trắng (.+)', language: 'vi', priority: 1, transform: 'TRIM($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'UPPER',
      category: 'text',
      description: 'Converts text to uppercase',
      descriptionVi: 'Chuyển văn bản thành chữ hoa',
      syntax: 'UPPER(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to convert' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=UPPER(A1)', description: 'Uppercase A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'uppercase (.+)', language: 'en', priority: 1, transform: 'UPPER($1)' },
        { pattern: 'chữ hoa (.+)', language: 'vi', priority: 1, transform: 'UPPER($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'LOWER',
      category: 'text',
      description: 'Converts text to lowercase',
      descriptionVi: 'Chuyển văn bản thành chữ thường',
      syntax: 'LOWER(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to convert' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=LOWER(A1)', description: 'Lowercase A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'lowercase (.+)', language: 'en', priority: 1, transform: 'LOWER($1)' },
        { pattern: 'chữ thường (.+)', language: 'vi', priority: 1, transform: 'LOWER($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'PROPER',
      category: 'text',
      description: 'Capitalizes the first letter of each word',
      descriptionVi: 'Viết hoa chữ cái đầu mỗi từ',
      syntax: 'PROPER(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to convert' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=PROPER("john doe")', description: 'Title case', result: 'John Doe' },
      ],
      nlPatterns: [
        { pattern: 'title case (.+)', language: 'en', priority: 1, transform: 'PROPER($1)' },
        { pattern: 'viết hoa đầu (.+)', language: 'vi', priority: 1, transform: 'PROPER($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MID',
      category: 'text',
      description: 'Returns specific characters from a text string',
      descriptionVi: 'Trả về các ký tự cụ thể từ chuỗi',
      syntax: 'MID(text, start_num, num_chars)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text string' },
        { name: 'start_num', type: 'number', required: true, description: 'Starting position' },
        { name: 'num_chars', type: 'number', required: true, description: 'Number of characters' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=MID(A1,2,3)', description: '3 chars starting at position 2', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'LEN',
      category: 'text',
      description: 'Returns the number of characters in a text string',
      descriptionVi: 'Trả về số ký tự trong chuỗi',
      syntax: 'LEN(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to measure' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=LEN(A1)', description: 'Length of text in A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'length of (.+)', language: 'en', priority: 1, transform: 'LEN($1)' },
        { pattern: 'độ dài (.+)', language: 'vi', priority: 1, transform: 'LEN($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'FIND',
      category: 'text',
      description: 'Finds one text value within another (case-sensitive)',
      descriptionVi: 'Tìm chuỗi văn bản trong chuỗi khác (phân biệt hoa thường)',
      syntax: 'FIND(find_text, within_text, [start_num])',
      parameters: [
        { name: 'find_text', type: 'text', required: true, description: 'Text to find' },
        { name: 'within_text', type: 'text', required: true, description: 'Text to search in' },
        { name: 'start_num', type: 'number', required: false, description: 'Starting position' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=FIND("a",A1)', description: 'Position of "a" in A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'find (.+) in (.+)', language: 'en', priority: 1, transform: 'FIND("$1",$2)' },
        { pattern: 'tìm (.+) trong (.+)', language: 'vi', priority: 1, transform: 'FIND("$1",$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SEARCH',
      category: 'text',
      description: 'Finds one text value within another (case-insensitive)',
      descriptionVi: 'Tìm chuỗi văn bản (không phân biệt hoa thường)',
      syntax: 'SEARCH(find_text, within_text, [start_num])',
      parameters: [
        { name: 'find_text', type: 'text', required: true, description: 'Text to find' },
        { name: 'within_text', type: 'text', required: true, description: 'Text to search in' },
        { name: 'start_num', type: 'number', required: false, description: 'Starting position' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SEARCH("a",A1)', description: 'Position of "a" in A1 (case-insensitive)', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'REPLACE',
      category: 'text',
      description: 'Replaces part of a text string with a different text string',
      descriptionVi: 'Thay thế một phần của chuỗi bằng chuỗi khác',
      syntax: 'REPLACE(old_text, start_num, num_chars, new_text)',
      parameters: [
        { name: 'old_text', type: 'text', required: true, description: 'Original text' },
        { name: 'start_num', type: 'number', required: true, description: 'Starting position' },
        { name: 'num_chars', type: 'number', required: true, description: 'Characters to replace' },
        { name: 'new_text', type: 'text', required: true, description: 'Replacement text' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=REPLACE(A1,1,3,"New")', description: 'Replace first 3 chars with "New"', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SUBSTITUTE',
      category: 'text',
      description: 'Substitutes new text for old text',
      descriptionVi: 'Thay thế văn bản cũ bằng văn bản mới',
      syntax: 'SUBSTITUTE(text, old_text, new_text, [instance_num])',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to modify' },
        { name: 'old_text', type: 'text', required: true, description: 'Text to replace' },
        { name: 'new_text', type: 'text', required: true, description: 'Replacement text' },
        { name: 'instance_num', type: 'number', required: false, description: 'Which instance to replace' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=SUBSTITUTE(A1,"old","new")', description: 'Replace "old" with "new"', result: null },
      ],
      nlPatterns: [
        { pattern: 'replace (.+) with (.+) in (.+)', language: 'en', priority: 1, transform: 'SUBSTITUTE($3,"$1","$2")' },
        { pattern: 'thay (.+) bằng (.+) trong (.+)', language: 'vi', priority: 1, transform: 'SUBSTITUTE($3,"$1","$2")' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'TEXT',
      category: 'text',
      description: 'Converts a value to text in a specific number format',
      descriptionVi: 'Chuyển đổi giá trị thành văn bản với định dạng cụ thể',
      syntax: 'TEXT(value, format_text)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to format' },
        { name: 'format_text', type: 'text', required: true, description: 'Format pattern' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=TEXT(A1,"$#,##0.00")', description: 'Format as currency', result: null },
        { formula: '=TEXT(A1,"yyyy-mm-dd")', description: 'Format as date', result: null },
      ],
      nlPatterns: [
        { pattern: 'format (.+) as (.+)', language: 'en', priority: 1, transform: 'TEXT($1,"$2")' },
        { pattern: 'định dạng (.+) thành (.+)', language: 'vi', priority: 1, transform: 'TEXT($1,"$2")' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'TEXTJOIN',
      category: 'text',
      description: 'Joins text with a delimiter',
      descriptionVi: 'Nối văn bản với ký tự phân cách',
      syntax: 'TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
      parameters: [
        { name: 'delimiter', type: 'text', required: true, description: 'Separator between texts' },
        { name: 'ignore_empty', type: 'boolean', required: true, description: 'TRUE to ignore empty cells' },
        { name: 'text1', type: 'text|range', required: true, description: 'First text or range' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=TEXTJOIN(",",TRUE,A1:A5)', description: 'Join with comma', result: null },
      ],
      nlPatterns: [
        { pattern: 'join (.+) with (.+)', language: 'en', priority: 1, transform: 'TEXTJOIN("$2",TRUE,$1)' },
        { pattern: 'nối (.+) bằng (.+)', language: 'vi', priority: 1, transform: 'TEXTJOIN("$2",TRUE,$1)' },
      ],
      excelVersion: '2016',
      googleSheets: true,
    });

    this.addFunction({
      name: 'VALUE',
      category: 'text',
      description: 'Converts text to a number',
      descriptionVi: 'Chuyển văn bản thành số',
      syntax: 'VALUE(text)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text representing a number' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=VALUE("123.45")', description: 'Convert text to number', result: 123.45 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'REPT',
      category: 'text',
      description: 'Repeats text a given number of times',
      descriptionVi: 'Lặp lại văn bản số lần cho trước',
      syntax: 'REPT(text, number_times)',
      parameters: [
        { name: 'text', type: 'text', required: true, description: 'Text to repeat' },
        { name: 'number_times', type: 'number', required: true, description: 'Times to repeat' },
      ],
      returnType: 'text',
      examples: [
        { formula: '=REPT("*",5)', description: 'Repeat * five times', result: '*****' },
      ],
      nlPatterns: [
        { pattern: 'repeat (.+) (\\d+) times', language: 'en', priority: 1, transform: 'REPT("$1",$2)' },
        { pattern: 'lặp (.+) (\\d+) lần', language: 'vi', priority: 1, transform: 'REPT("$1",$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // ADDITIONAL DATE FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'DATE',
      category: 'date',
      description: 'Creates a date from year, month, day',
      descriptionVi: 'Tạo ngày từ năm, tháng, ngày',
      syntax: 'DATE(year, month, day)',
      parameters: [
        { name: 'year', type: 'number', required: true, description: 'Year' },
        { name: 'month', type: 'number', required: true, description: 'Month' },
        { name: 'day', type: 'number', required: true, description: 'Day' },
      ],
      returnType: 'date',
      examples: [
        { formula: '=DATE(2024,1,15)', description: 'January 15, 2024', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'DATEDIF',
      category: 'date',
      description: 'Calculates the difference between two dates',
      descriptionVi: 'Tính khoảng cách giữa hai ngày',
      syntax: 'DATEDIF(start_date, end_date, unit)',
      parameters: [
        { name: 'start_date', type: 'date', required: true, description: 'Start date' },
        { name: 'end_date', type: 'date', required: true, description: 'End date' },
        { name: 'unit', type: 'text', required: true, description: '"Y", "M", "D", "MD", "YM", "YD"' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=DATEDIF(A1,B1,"D")', description: 'Days between A1 and B1', result: null },
      ],
      nlPatterns: [
        { pattern: 'days between (.+) and (.+)', language: 'en', priority: 1, transform: 'DATEDIF($1,$2,"D")' },
        { pattern: 'số ngày từ (.+) đến (.+)', language: 'vi', priority: 1, transform: 'DATEDIF($1,$2,"D")' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'EDATE',
      category: 'date',
      description: 'Returns a date that is a specified number of months before or after a date',
      descriptionVi: 'Trả về ngày cộng/trừ số tháng',
      syntax: 'EDATE(start_date, months)',
      parameters: [
        { name: 'start_date', type: 'date', required: true, description: 'Start date' },
        { name: 'months', type: 'number', required: true, description: 'Months to add (can be negative)' },
      ],
      returnType: 'date',
      examples: [
        { formula: '=EDATE(A1,3)', description: 'Add 3 months to A1', result: null },
      ],
      nlPatterns: [
        { pattern: '(.+) plus (\\d+) months', language: 'en', priority: 1, transform: 'EDATE($1,$2)' },
        { pattern: '(.+) cộng (\\d+) tháng', language: 'vi', priority: 1, transform: 'EDATE($1,$2)' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'EOMONTH',
      category: 'date',
      description: 'Returns the last day of the month, a specified number of months from a date',
      descriptionVi: 'Trả về ngày cuối tháng',
      syntax: 'EOMONTH(start_date, months)',
      parameters: [
        { name: 'start_date', type: 'date', required: true, description: 'Start date' },
        { name: 'months', type: 'number', required: true, description: 'Months to add (can be negative)' },
      ],
      returnType: 'date',
      examples: [
        { formula: '=EOMONTH(A1,0)', description: 'End of current month', result: null },
      ],
      nlPatterns: [
        { pattern: 'end of month (?:of )?(.+)', language: 'en', priority: 1, transform: 'EOMONTH($1,0)' },
        { pattern: 'cuối tháng (?:của )?(.+)', language: 'vi', priority: 1, transform: 'EOMONTH($1,0)' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'WEEKDAY',
      category: 'date',
      description: 'Returns the day of the week as a number',
      descriptionVi: 'Trả về ngày trong tuần (số)',
      syntax: 'WEEKDAY(serial_number, [return_type])',
      parameters: [
        { name: 'serial_number', type: 'date', required: true, description: 'Date' },
        { name: 'return_type', type: 'number', required: false, description: '1=Sun-Sat, 2=Mon-Sun, 3=0-6' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=WEEKDAY(A1)', description: 'Day of week for A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'weekday of (.+)', language: 'en', priority: 1, transform: 'WEEKDAY($1)' },
        { pattern: 'thứ trong tuần (.+)', language: 'vi', priority: 1, transform: 'WEEKDAY($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'WEEKNUM',
      category: 'date',
      description: 'Returns the week number of a date',
      descriptionVi: 'Trả về số tuần của ngày',
      syntax: 'WEEKNUM(serial_number, [return_type])',
      parameters: [
        { name: 'serial_number', type: 'date', required: true, description: 'Date' },
        { name: 'return_type', type: 'number', required: false, description: 'Week type' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=WEEKNUM(A1)', description: 'Week number for A1', result: null },
      ],
      nlPatterns: [
        { pattern: 'week number of (.+)', language: 'en', priority: 1, transform: 'WEEKNUM($1)' },
        { pattern: 'tuần thứ mấy (.+)', language: 'vi', priority: 1, transform: 'WEEKNUM($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'NETWORKDAYS',
      category: 'date',
      description: 'Returns the number of workdays between two dates',
      descriptionVi: 'Trả về số ngày làm việc giữa hai ngày',
      syntax: 'NETWORKDAYS(start_date, end_date, [holidays])',
      parameters: [
        { name: 'start_date', type: 'date', required: true, description: 'Start date' },
        { name: 'end_date', type: 'date', required: true, description: 'End date' },
        { name: 'holidays', type: 'range', required: false, description: 'Range of holiday dates' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=NETWORKDAYS(A1,B1)', description: 'Workdays between A1 and B1', result: null },
      ],
      nlPatterns: [
        { pattern: 'workdays between (.+) and (.+)', language: 'en', priority: 1, transform: 'NETWORKDAYS($1,$2)' },
        { pattern: 'ngày làm việc từ (.+) đến (.+)', language: 'vi', priority: 1, transform: 'NETWORKDAYS($1,$2)' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'WORKDAY',
      category: 'date',
      description: 'Returns a date that is a specified number of workdays from a date',
      descriptionVi: 'Trả về ngày cộng số ngày làm việc',
      syntax: 'WORKDAY(start_date, days, [holidays])',
      parameters: [
        { name: 'start_date', type: 'date', required: true, description: 'Start date' },
        { name: 'days', type: 'number', required: true, description: 'Workdays to add' },
        { name: 'holidays', type: 'range', required: false, description: 'Range of holiday dates' },
      ],
      returnType: 'date',
      examples: [
        { formula: '=WORKDAY(A1,10)', description: 'Add 10 workdays to A1', result: null },
      ],
      nlPatterns: [
        { pattern: '(.+) plus (\\d+) workdays', language: 'en', priority: 1, transform: 'WORKDAY($1,$2)' },
        { pattern: '(.+) cộng (\\d+) ngày làm việc', language: 'vi', priority: 1, transform: 'WORKDAY($1,$2)' },
      ],
      excelVersion: '2007',
      googleSheets: true,
    });

    this.addFunction({
      name: 'HOUR',
      category: 'date',
      description: 'Extracts hour from time',
      descriptionVi: 'Trích xuất giờ từ thời gian',
      syntax: 'HOUR(serial_number)',
      parameters: [
        { name: 'serial_number', type: 'datetime', required: true, description: 'Time to extract hour from' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=HOUR(A1)', description: 'Hour of time in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MINUTE',
      category: 'date',
      description: 'Extracts minute from time',
      descriptionVi: 'Trích xuất phút từ thời gian',
      syntax: 'MINUTE(serial_number)',
      parameters: [
        { name: 'serial_number', type: 'datetime', required: true, description: 'Time to extract minute from' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MINUTE(A1)', description: 'Minute of time in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SECOND',
      category: 'date',
      description: 'Extracts second from time',
      descriptionVi: 'Trích xuất giây từ thời gian',
      syntax: 'SECOND(serial_number)',
      parameters: [
        { name: 'serial_number', type: 'datetime', required: true, description: 'Time to extract second from' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SECOND(A1)', description: 'Second of time in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // STATISTICAL FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'MEDIAN',
      category: 'statistical',
      description: 'Returns the median of the given numbers',
      descriptionVi: 'Trả về giá trị trung vị',
      syntax: 'MEDIAN(number1, [number2], ...)',
      parameters: [
        { name: 'number1', type: 'number|range', required: true, description: 'First number or range' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MEDIAN(A1:A10)', description: 'Median of A1:A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'median of (.+)', language: 'en', priority: 1, transform: 'MEDIAN($1)' },
        { pattern: 'trung vị của (.+)', language: 'vi', priority: 1, transform: 'MEDIAN($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'MODE',
      category: 'statistical',
      description: 'Returns the most frequently occurring value',
      descriptionVi: 'Trả về giá trị xuất hiện nhiều nhất',
      syntax: 'MODE(number1, [number2], ...)',
      parameters: [
        { name: 'number1', type: 'number|range', required: true, description: 'First number or range' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=MODE(A1:A10)', description: 'Mode of A1:A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'mode of (.+)', language: 'en', priority: 1, transform: 'MODE($1)' },
        { pattern: 'yếu vị của (.+)', language: 'vi', priority: 1, transform: 'MODE($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'STDEV',
      category: 'statistical',
      description: 'Estimates standard deviation based on a sample',
      descriptionVi: 'Tính độ lệch chuẩn dựa trên mẫu',
      syntax: 'STDEV(number1, [number2], ...)',
      parameters: [
        { name: 'number1', type: 'number|range', required: true, description: 'First number or range' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=STDEV(A1:A10)', description: 'Standard deviation of A1:A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'standard deviation of (.+)', language: 'en', priority: 1, transform: 'STDEV($1)' },
        { pattern: 'độ lệch chuẩn của (.+)', language: 'vi', priority: 1, transform: 'STDEV($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'VAR',
      category: 'statistical',
      description: 'Estimates variance based on a sample',
      descriptionVi: 'Tính phương sai dựa trên mẫu',
      syntax: 'VAR(number1, [number2], ...)',
      parameters: [
        { name: 'number1', type: 'number|range', required: true, description: 'First number or range' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=VAR(A1:A10)', description: 'Variance of A1:A10', result: null },
      ],
      nlPatterns: [
        { pattern: 'variance of (.+)', language: 'en', priority: 1, transform: 'VAR($1)' },
        { pattern: 'phương sai của (.+)', language: 'vi', priority: 1, transform: 'VAR($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'PERCENTILE',
      category: 'statistical',
      description: 'Returns the k-th percentile of values in a range',
      descriptionVi: 'Trả về phân vị thứ k',
      syntax: 'PERCENTILE(array, k)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range of data' },
        { name: 'k', type: 'number', required: true, description: 'Percentile value (0-1)' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=PERCENTILE(A1:A10,0.9)', description: '90th percentile', result: null },
      ],
      nlPatterns: [
        { pattern: '(\\d+)(?:th|st|nd|rd) percentile of (.+)', language: 'en', priority: 1, transform: 'PERCENTILE($2,$1/100)' },
        { pattern: 'phân vị (\\d+) của (.+)', language: 'vi', priority: 1, transform: 'PERCENTILE($2,$1/100)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'QUARTILE',
      category: 'statistical',
      description: 'Returns the quartile of a data set',
      descriptionVi: 'Trả về tứ phân vị của tập dữ liệu',
      syntax: 'QUARTILE(array, quart)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range of data' },
        { name: 'quart', type: 'number', required: true, description: 'Quartile (0-4)' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=QUARTILE(A1:A10,1)', description: 'First quartile', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'RANK',
      category: 'statistical',
      description: 'Returns the rank of a number in a list',
      descriptionVi: 'Trả về thứ hạng của số trong danh sách',
      syntax: 'RANK(number, ref, [order])',
      parameters: [
        { name: 'number', type: 'number', required: true, description: 'Number to rank' },
        { name: 'ref', type: 'range', required: true, description: 'Range of numbers' },
        { name: 'order', type: 'number', required: false, description: '0=descending, 1=ascending' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=RANK(A1,A:A)', description: 'Rank of A1 in column A', result: null },
      ],
      nlPatterns: [
        { pattern: 'rank of (.+) in (.+)', language: 'en', priority: 1, transform: 'RANK($1,$2)' },
        { pattern: 'xếp hạng (.+) trong (.+)', language: 'vi', priority: 1, transform: 'RANK($1,$2)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'LARGE',
      category: 'statistical',
      description: 'Returns the k-th largest value in a data set',
      descriptionVi: 'Trả về giá trị lớn thứ k',
      syntax: 'LARGE(array, k)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range of data' },
        { name: 'k', type: 'number', required: true, description: 'Position from largest' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=LARGE(A1:A10,2)', description: 'Second largest value', result: null },
      ],
      nlPatterns: [
        { pattern: '(\\d+)(?:st|nd|rd|th) largest (?:in |of )?(.+)', language: 'en', priority: 1, transform: 'LARGE($2,$1)' },
        { pattern: 'lớn thứ (\\d+) (?:trong|của) (.+)', language: 'vi', priority: 1, transform: 'LARGE($2,$1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'SMALL',
      category: 'statistical',
      description: 'Returns the k-th smallest value in a data set',
      descriptionVi: 'Trả về giá trị nhỏ thứ k',
      syntax: 'SMALL(array, k)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range of data' },
        { name: 'k', type: 'number', required: true, description: 'Position from smallest' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=SMALL(A1:A10,2)', description: 'Second smallest value', result: null },
      ],
      nlPatterns: [
        { pattern: '(\\d+)(?:st|nd|rd|th) smallest (?:in |of )?(.+)', language: 'en', priority: 1, transform: 'SMALL($2,$1)' },
        { pattern: 'nhỏ thứ (\\d+) (?:trong|của) (.+)', language: 'vi', priority: 1, transform: 'SMALL($2,$1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // FINANCIAL FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'PMT',
      category: 'financial',
      description: 'Calculates the payment for a loan based on constant payments and constant interest rate',
      descriptionVi: 'Tính số tiền thanh toán định kỳ cho khoản vay',
      syntax: 'PMT(rate, nper, pv, [fv], [type])',
      parameters: [
        { name: 'rate', type: 'number', required: true, description: 'Interest rate per period' },
        { name: 'nper', type: 'number', required: true, description: 'Total number of payments' },
        { name: 'pv', type: 'number', required: true, description: 'Present value (loan amount)' },
        { name: 'fv', type: 'number', required: false, description: 'Future value' },
        { name: 'type', type: 'number', required: false, description: '0=end, 1=beginning' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=PMT(0.05/12,60,100000)', description: 'Monthly payment for $100k loan', result: null },
      ],
      nlPatterns: [
        { pattern: 'monthly payment for (.+) at (.+)% for (\\d+) (?:months|years)', language: 'en', priority: 1, transform: 'PMT($2/100/12,$3,$1)' },
        { pattern: 'thanh toán hàng tháng cho (.+) với lãi (.+)% trong (\\d+) tháng', language: 'vi', priority: 1, transform: 'PMT($2/100/12,$3,$1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'FV',
      category: 'financial',
      description: 'Returns the future value of an investment',
      descriptionVi: 'Trả về giá trị tương lai của khoản đầu tư',
      syntax: 'FV(rate, nper, pmt, [pv], [type])',
      parameters: [
        { name: 'rate', type: 'number', required: true, description: 'Interest rate per period' },
        { name: 'nper', type: 'number', required: true, description: 'Number of periods' },
        { name: 'pmt', type: 'number', required: true, description: 'Payment per period' },
        { name: 'pv', type: 'number', required: false, description: 'Present value' },
        { name: 'type', type: 'number', required: false, description: '0=end, 1=beginning' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=FV(0.05/12,120,-500)', description: 'Future value of $500/month savings', result: null },
      ],
      nlPatterns: [
        { pattern: 'future value of (.+) at (.+)% for (\\d+) periods', language: 'en', priority: 1, transform: 'FV($2/100,$3,$1)' },
        { pattern: 'giá trị tương lai (.+) với lãi (.+)% trong (\\d+) kỳ', language: 'vi', priority: 1, transform: 'FV($2/100,$3,$1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'PV',
      category: 'financial',
      description: 'Returns the present value of an investment',
      descriptionVi: 'Trả về giá trị hiện tại của khoản đầu tư',
      syntax: 'PV(rate, nper, pmt, [fv], [type])',
      parameters: [
        { name: 'rate', type: 'number', required: true, description: 'Interest rate per period' },
        { name: 'nper', type: 'number', required: true, description: 'Number of periods' },
        { name: 'pmt', type: 'number', required: true, description: 'Payment per period' },
        { name: 'fv', type: 'number', required: false, description: 'Future value' },
        { name: 'type', type: 'number', required: false, description: '0=end, 1=beginning' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=PV(0.05/12,60,-500)', description: 'Present value of $500/month', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'NPV',
      category: 'financial',
      description: 'Returns the net present value of an investment',
      descriptionVi: 'Trả về giá trị hiện tại ròng của khoản đầu tư',
      syntax: 'NPV(rate, value1, [value2], ...)',
      parameters: [
        { name: 'rate', type: 'number', required: true, description: 'Discount rate' },
        { name: 'value1', type: 'number|range', required: true, description: 'First cash flow' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=NPV(0.1,A1:A5)', description: 'NPV at 10% discount rate', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'IRR',
      category: 'financial',
      description: 'Returns the internal rate of return for a series of cash flows',
      descriptionVi: 'Trả về tỷ suất hoàn vốn nội bộ',
      syntax: 'IRR(values, [guess])',
      parameters: [
        { name: 'values', type: 'range', required: true, description: 'Range of cash flows' },
        { name: 'guess', type: 'number', required: false, description: 'Initial guess for rate' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=IRR(A1:A10)', description: 'IRR of cash flows', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'RATE',
      category: 'financial',
      description: 'Returns the interest rate per period of an annuity',
      descriptionVi: 'Trả về lãi suất mỗi kỳ của niên kim',
      syntax: 'RATE(nper, pmt, pv, [fv], [type], [guess])',
      parameters: [
        { name: 'nper', type: 'number', required: true, description: 'Number of periods' },
        { name: 'pmt', type: 'number', required: true, description: 'Payment per period' },
        { name: 'pv', type: 'number', required: true, description: 'Present value' },
        { name: 'fv', type: 'number', required: false, description: 'Future value' },
        { name: 'type', type: 'number', required: false, description: '0=end, 1=beginning' },
        { name: 'guess', type: 'number', required: false, description: 'Initial guess' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=RATE(60,-500,25000)', description: 'Interest rate for loan', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // INFORMATION FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'ISBLANK',
      category: 'info',
      description: 'Returns TRUE if the cell is empty',
      descriptionVi: 'Trả về TRUE nếu ô trống',
      syntax: 'ISBLANK(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Cell to check' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=ISBLANK(A1)', description: 'Check if A1 is empty', result: null },
      ],
      nlPatterns: [
        { pattern: 'is (.+) (?:empty|blank)', language: 'en', priority: 1, transform: 'ISBLANK($1)' },
        { pattern: '(.+) có trống không', language: 'vi', priority: 1, transform: 'ISBLANK($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ISNUMBER',
      category: 'info',
      description: 'Returns TRUE if the value is a number',
      descriptionVi: 'Trả về TRUE nếu giá trị là số',
      syntax: 'ISNUMBER(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=ISNUMBER(A1)', description: 'Check if A1 is a number', result: null },
      ],
      nlPatterns: [
        { pattern: 'is (.+) a number', language: 'en', priority: 1, transform: 'ISNUMBER($1)' },
        { pattern: '(.+) có phải số không', language: 'vi', priority: 1, transform: 'ISNUMBER($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ISTEXT',
      category: 'info',
      description: 'Returns TRUE if the value is text',
      descriptionVi: 'Trả về TRUE nếu giá trị là văn bản',
      syntax: 'ISTEXT(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=ISTEXT(A1)', description: 'Check if A1 is text', result: null },
      ],
      nlPatterns: [
        { pattern: 'is (.+) text', language: 'en', priority: 1, transform: 'ISTEXT($1)' },
        { pattern: '(.+) có phải văn bản không', language: 'vi', priority: 1, transform: 'ISTEXT($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ISERROR',
      category: 'info',
      description: 'Returns TRUE if the value is an error',
      descriptionVi: 'Trả về TRUE nếu giá trị là lỗi',
      syntax: 'ISERROR(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=ISERROR(A1)', description: 'Check if A1 has an error', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ISNA',
      category: 'info',
      description: 'Returns TRUE if the value is #N/A error',
      descriptionVi: 'Trả về TRUE nếu giá trị là lỗi #N/A',
      syntax: 'ISNA(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
      ],
      returnType: 'boolean',
      examples: [
        { formula: '=ISNA(VLOOKUP("x",A:B,2,0))', description: 'Check if VLOOKUP returns N/A', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'IFNA',
      category: 'logical',
      description: 'Returns alternative value on #N/A error',
      descriptionVi: 'Trả về giá trị thay thế khi lỗi #N/A',
      syntax: 'IFNA(value, value_if_na)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
        { name: 'value_if_na', type: 'any', required: true, description: 'Value to return on #N/A' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=IFNA(VLOOKUP("x",A:B,2,0),"Not found")', description: 'Return "Not found" if N/A', result: null },
      ],
      nlPatterns: [],
      excelVersion: '2013',
      googleSheets: true,
    });

    this.addFunction({
      name: 'TYPE',
      category: 'info',
      description: 'Returns a number indicating the data type',
      descriptionVi: 'Trả về số chỉ loại dữ liệu',
      syntax: 'TYPE(value)',
      parameters: [
        { name: 'value', type: 'any', required: true, description: 'Value to check' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=TYPE(A1)', description: 'Type of value in A1', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    // =========================================================================
    // REFERENCE FUNCTIONS
    // =========================================================================
    this.addFunction({
      name: 'INDIRECT',
      category: 'lookup',
      description: 'Returns the reference specified by a text string',
      descriptionVi: 'Trả về tham chiếu từ chuỗi văn bản',
      syntax: 'INDIRECT(ref_text, [a1])',
      parameters: [
        { name: 'ref_text', type: 'text', required: true, description: 'Reference as text' },
        { name: 'a1', type: 'boolean', required: false, description: 'TRUE for A1 style' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=INDIRECT("A"&B1)', description: 'Dynamic reference', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'OFFSET',
      category: 'lookup',
      description: 'Returns a reference offset from a given reference',
      descriptionVi: 'Trả về tham chiếu dịch chuyển từ tham chiếu cho trước',
      syntax: 'OFFSET(reference, rows, cols, [height], [width])',
      parameters: [
        { name: 'reference', type: 'range', required: true, description: 'Starting reference' },
        { name: 'rows', type: 'number', required: true, description: 'Rows to offset' },
        { name: 'cols', type: 'number', required: true, description: 'Columns to offset' },
        { name: 'height', type: 'number', required: false, description: 'Height of result' },
        { name: 'width', type: 'number', required: false, description: 'Width of result' },
      ],
      returnType: 'range',
      examples: [
        { formula: '=OFFSET(A1,2,3)', description: 'Cell 2 rows down, 3 cols right', result: null },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ROW',
      category: 'lookup',
      description: 'Returns the row number of a reference',
      descriptionVi: 'Trả về số hàng của tham chiếu',
      syntax: 'ROW([reference])',
      parameters: [
        { name: 'reference', type: 'range', required: false, description: 'Cell reference' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ROW()', description: 'Current row number', result: null },
        { formula: '=ROW(A5)', description: 'Row of A5', result: 5 },
      ],
      nlPatterns: [
        { pattern: 'row number (?:of )?(.+)?', language: 'en', priority: 1, transform: 'ROW($1)' },
        { pattern: 'số hàng (?:của )?(.+)?', language: 'vi', priority: 1, transform: 'ROW($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COLUMN',
      category: 'lookup',
      description: 'Returns the column number of a reference',
      descriptionVi: 'Trả về số cột của tham chiếu',
      syntax: 'COLUMN([reference])',
      parameters: [
        { name: 'reference', type: 'range', required: false, description: 'Cell reference' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=COLUMN()', description: 'Current column number', result: null },
        { formula: '=COLUMN(C1)', description: 'Column of C1', result: 3 },
      ],
      nlPatterns: [
        { pattern: 'column number (?:of )?(.+)?', language: 'en', priority: 1, transform: 'COLUMN($1)' },
        { pattern: 'số cột (?:của )?(.+)?', language: 'vi', priority: 1, transform: 'COLUMN($1)' },
      ],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'ROWS',
      category: 'lookup',
      description: 'Returns the number of rows in a reference',
      descriptionVi: 'Trả về số hàng trong tham chiếu',
      syntax: 'ROWS(array)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to count rows' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=ROWS(A1:A10)', description: 'Number of rows in A1:A10', result: 10 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'COLUMNS',
      category: 'lookup',
      description: 'Returns the number of columns in a reference',
      descriptionVi: 'Trả về số cột trong tham chiếu',
      syntax: 'COLUMNS(array)',
      parameters: [
        { name: 'array', type: 'range', required: true, description: 'Range to count columns' },
      ],
      returnType: 'number',
      examples: [
        { formula: '=COLUMNS(A1:E1)', description: 'Number of columns in A1:E1', result: 5 },
      ],
      nlPatterns: [],
      excelVersion: '1.0',
      googleSheets: true,
    });

    this.addFunction({
      name: 'HLOOKUP',
      category: 'lookup',
      description: 'Looks up value in top row and returns value in same column',
      descriptionVi: 'Tra cứu giá trị ở hàng đầu và trả về giá trị cùng cột',
      syntax: 'HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])',
      parameters: [
        { name: 'lookup_value', type: 'any', required: true, description: 'Value to search for' },
        { name: 'table_array', type: 'range', required: true, description: 'Table to search in' },
        { name: 'row_index_num', type: 'number', required: true, description: 'Row number to return' },
        { name: 'range_lookup', type: 'boolean', required: false, description: 'FALSE for exact match' },
      ],
      returnType: 'any',
      examples: [
        { formula: '=HLOOKUP("Q1",A1:D5,3,FALSE)', description: 'Find Q1 and return row 3', result: null },
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
