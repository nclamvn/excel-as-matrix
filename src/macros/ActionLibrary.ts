// =============================================================================
// ACTION LIBRARY — Available actions for workflows
// =============================================================================

import type { ActionDefinition, ActionType, ActionCategory } from './types';

/**
 * Library of available workflow actions
 */
export class ActionLibrary {
  private actions: Map<ActionType, ActionDefinition> = new Map();

  constructor() {
    this.registerAllActions();
  }

  /**
   * Get all actions
   */
  getAll(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get action by type
   */
  get(type: ActionType): ActionDefinition | undefined {
    return this.actions.get(type);
  }

  /**
   * Get actions by category
   */
  getByCategory(category: ActionCategory): ActionDefinition[] {
    return this.getAll().filter(a => a.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): { category: ActionCategory; label: string; labelVi: string }[] {
    return [
      { category: 'data', label: 'Data Operations', labelVi: 'Thao tác dữ liệu' },
      { category: 'formula', label: 'Formulas', labelVi: 'Công thức' },
      { category: 'format', label: 'Formatting', labelVi: 'Định dạng' },
      { category: 'chart', label: 'Charts', labelVi: 'Biểu đồ' },
      { category: 'sheet', label: 'Sheets', labelVi: 'Trang tính' },
      { category: 'file', label: 'Files', labelVi: 'Tệp tin' },
      { category: 'notification', label: 'Notifications', labelVi: 'Thông báo' },
      { category: 'external', label: 'External', labelVi: 'Bên ngoài' },
      { category: 'ai', label: 'AI Actions', labelVi: 'AI' },
    ];
  }

  /**
   * Search actions
   */
  search(query: string): ActionDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.nameVi.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private registerAllActions(): void {
    // Data Operations
    this.register({
      type: 'copy_range',
      name: 'Copy Range',
      nameVi: 'Sao chép vùng',
      description: 'Copy cells from a range',
      descriptionVi: 'Sao chép các ô từ một vùng',
      category: 'data',
      icon: 'copy',
      params: [
        { name: 'range', type: 'range', label: 'Source Range', labelVi: 'Vùng nguồn', required: true },
      ],
      hasOutput: true,
      outputType: 'range_data',
    });

    this.register({
      type: 'paste_range',
      name: 'Paste Range',
      nameVi: 'Dán vùng',
      description: 'Paste copied data to a range',
      descriptionVi: 'Dán dữ liệu đã sao chép vào một vùng',
      category: 'data',
      icon: 'clipboard',
      params: [
        { name: 'range', type: 'range', label: 'Target Range', labelVi: 'Vùng đích', required: true },
      ],
      hasOutput: false,
    });

    this.register({
      type: 'clear_range',
      name: 'Clear Range',
      nameVi: 'Xóa vùng',
      description: 'Clear contents from a range',
      descriptionVi: 'Xóa nội dung từ một vùng',
      category: 'data',
      icon: 'trash',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'clearType', type: 'select', label: 'Clear', labelVi: 'Xóa', required: true, default: 'all',
          options: [
            { value: 'all', label: 'All' },
            { value: 'values', label: 'Values only' },
            { value: 'formats', label: 'Formats only' },
          ]
        },
      ],
      hasOutput: false,
    });

    this.register({
      type: 'filter_data',
      name: 'Filter Data',
      nameVi: 'Lọc dữ liệu',
      description: 'Apply filter to data',
      descriptionVi: 'Áp dụng bộ lọc cho dữ liệu',
      category: 'data',
      icon: 'filter',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'column', type: 'string', label: 'Column', labelVi: 'Cột', required: true },
        { name: 'condition', type: 'string', label: 'Condition', labelVi: 'Điều kiện', required: true },
      ],
      hasOutput: true,
      requiresSelection: true,
    });

    this.register({
      type: 'sort_data',
      name: 'Sort Data',
      nameVi: 'Sắp xếp dữ liệu',
      description: 'Sort data by column',
      descriptionVi: 'Sắp xếp dữ liệu theo cột',
      category: 'data',
      icon: 'arrow-up-down',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'column', type: 'string', label: 'Sort Column', labelVi: 'Cột sắp xếp', required: true },
        { name: 'ascending', type: 'boolean', label: 'Ascending', labelVi: 'Tăng dần', required: false, default: true },
      ],
      hasOutput: false,
    });

    this.register({
      type: 'remove_duplicates',
      name: 'Remove Duplicates',
      nameVi: 'Xóa trùng lặp',
      description: 'Remove duplicate rows',
      descriptionVi: 'Xóa các hàng trùng lặp',
      category: 'data',
      icon: 'layers',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
      ],
      hasOutput: true,
      outputType: 'number',
    });

    // Formulas
    this.register({
      type: 'apply_formula',
      name: 'Apply Formula',
      nameVi: 'Áp dụng công thức',
      description: 'Apply a formula to a cell',
      descriptionVi: 'Áp dụng công thức vào ô',
      category: 'formula',
      icon: 'function',
      params: [
        { name: 'cell', type: 'range', label: 'Cell', labelVi: 'Ô', required: true },
        { name: 'formula', type: 'formula', label: 'Formula', labelVi: 'Công thức', required: true },
      ],
      hasOutput: true,
    });

    this.register({
      type: 'fill_formula',
      name: 'Fill Formula',
      nameVi: 'Điền công thức',
      description: 'Fill formula down/across',
      descriptionVi: 'Điền công thức xuống/ngang',
      category: 'formula',
      icon: 'arrow-down',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'direction', type: 'select', label: 'Direction', labelVi: 'Hướng', required: true,
          options: [
            { value: 'down', label: 'Down' },
            { value: 'right', label: 'Right' },
          ]
        },
      ],
      hasOutput: false,
    });

    // Formatting
    this.register({
      type: 'format_cells',
      name: 'Format Cells',
      nameVi: 'Định dạng ô',
      description: 'Apply formatting to cells',
      descriptionVi: 'Áp dụng định dạng cho ô',
      category: 'format',
      icon: 'palette',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'bold', type: 'boolean', label: 'Bold', labelVi: 'Đậm', required: false },
        { name: 'italic', type: 'boolean', label: 'Italic', labelVi: 'Nghiêng', required: false },
        { name: 'color', type: 'string', label: 'Text Color', labelVi: 'Màu chữ', required: false },
        { name: 'bgColor', type: 'string', label: 'Background', labelVi: 'Màu nền', required: false },
      ],
      hasOutput: false,
    });

    this.register({
      type: 'conditional_format',
      name: 'Conditional Format',
      nameVi: 'Định dạng có điều kiện',
      description: 'Apply conditional formatting',
      descriptionVi: 'Áp dụng định dạng có điều kiện',
      category: 'format',
      icon: 'sliders',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
        { name: 'condition', type: 'string', label: 'Condition', labelVi: 'Điều kiện', required: true },
        { name: 'format', type: 'string', label: 'Format', labelVi: 'Định dạng', required: true },
      ],
      hasOutput: false,
    });

    // Charts
    this.register({
      type: 'create_chart',
      name: 'Create Chart',
      nameVi: 'Tạo biểu đồ',
      description: 'Create a chart from data',
      descriptionVi: 'Tạo biểu đồ từ dữ liệu',
      category: 'chart',
      icon: 'bar-chart',
      params: [
        { name: 'range', type: 'range', label: 'Data Range', labelVi: 'Vùng dữ liệu', required: true },
        { name: 'chartType', type: 'select', label: 'Chart Type', labelVi: 'Loại biểu đồ', required: true,
          options: [
            { value: 'line', label: 'Line' },
            { value: 'bar', label: 'Bar' },
            { value: 'column', label: 'Column' },
            { value: 'pie', label: 'Pie' },
            { value: 'scatter', label: 'Scatter' },
          ]
        },
        { name: 'title', type: 'string', label: 'Title', labelVi: 'Tiêu đề', required: false },
      ],
      hasOutput: true,
      outputType: 'chart_id',
    });

    // Sheets
    this.register({
      type: 'add_sheet',
      name: 'Add Sheet',
      nameVi: 'Thêm trang tính',
      description: 'Add a new sheet',
      descriptionVi: 'Thêm một trang tính mới',
      category: 'sheet',
      icon: 'plus-square',
      params: [
        { name: 'name', type: 'string', label: 'Sheet Name', labelVi: 'Tên trang tính', required: true },
      ],
      hasOutput: true,
      outputType: 'sheet_id',
    });

    this.register({
      type: 'delete_sheet',
      name: 'Delete Sheet',
      nameVi: 'Xóa trang tính',
      description: 'Delete a sheet',
      descriptionVi: 'Xóa một trang tính',
      category: 'sheet',
      icon: 'minus-square',
      params: [
        { name: 'sheetId', type: 'string', label: 'Sheet', labelVi: 'Trang tính', required: true },
      ],
      hasOutput: false,
    });

    // Files
    this.register({
      type: 'export_pdf',
      name: 'Export to PDF',
      nameVi: 'Xuất PDF',
      description: 'Export workbook to PDF',
      descriptionVi: 'Xuất sổ làm việc ra PDF',
      category: 'file',
      icon: 'file-text',
      params: [
        { name: 'filename', type: 'string', label: 'Filename', labelVi: 'Tên tệp', required: true },
        { name: 'sheets', type: 'string', label: 'Sheets', labelVi: 'Trang tính', required: false },
      ],
      hasOutput: true,
      outputType: 'file_path',
    });

    this.register({
      type: 'export_excel',
      name: 'Export to Excel',
      nameVi: 'Xuất Excel',
      description: 'Export workbook to Excel',
      descriptionVi: 'Xuất sổ làm việc ra Excel',
      category: 'file',
      icon: 'table',
      params: [
        { name: 'filename', type: 'string', label: 'Filename', labelVi: 'Tên tệp', required: true },
      ],
      hasOutput: true,
      outputType: 'file_path',
    });

    this.register({
      type: 'export_csv',
      name: 'Export to CSV',
      nameVi: 'Xuất CSV',
      description: 'Export sheet to CSV',
      descriptionVi: 'Xuất trang tính ra CSV',
      category: 'file',
      icon: 'file',
      params: [
        { name: 'filename', type: 'string', label: 'Filename', labelVi: 'Tên tệp', required: true },
        { name: 'sheetId', type: 'string', label: 'Sheet', labelVi: 'Trang tính', required: false },
      ],
      hasOutput: true,
      outputType: 'file_path',
    });

    // Notifications
    this.register({
      type: 'send_email',
      name: 'Send Email',
      nameVi: 'Gửi email',
      description: 'Send an email notification',
      descriptionVi: 'Gửi thông báo qua email',
      category: 'notification',
      icon: 'mail',
      params: [
        { name: 'to', type: 'string', label: 'To', labelVi: 'Đến', required: true },
        { name: 'subject', type: 'string', label: 'Subject', labelVi: 'Chủ đề', required: true },
        { name: 'body', type: 'string', label: 'Body', labelVi: 'Nội dung', required: true },
        { name: 'attachFile', type: 'boolean', label: 'Attach File', labelVi: 'Đính kèm tệp', required: false },
      ],
      hasOutput: true,
    });

    this.register({
      type: 'show_notification',
      name: 'Show Notification',
      nameVi: 'Hiển thị thông báo',
      description: 'Show a notification',
      descriptionVi: 'Hiển thị một thông báo',
      category: 'notification',
      icon: 'bell',
      params: [
        { name: 'message', type: 'string', label: 'Message', labelVi: 'Nội dung', required: true },
        { name: 'type', type: 'select', label: 'Type', labelVi: 'Loại', required: false, default: 'info',
          options: [
            { value: 'info', label: 'Info' },
            { value: 'success', label: 'Success' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
          ]
        },
      ],
      hasOutput: false,
    });

    // External
    this.register({
      type: 'http_request',
      name: 'HTTP Request',
      nameVi: 'Yêu cầu HTTP',
      description: 'Make an HTTP request',
      descriptionVi: 'Thực hiện yêu cầu HTTP',
      category: 'external',
      icon: 'globe',
      params: [
        { name: 'url', type: 'string', label: 'URL', labelVi: 'URL', required: true },
        { name: 'method', type: 'select', label: 'Method', labelVi: 'Phương thức', required: true, default: 'GET',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ]
        },
        { name: 'body', type: 'string', label: 'Body', labelVi: 'Nội dung', required: false },
      ],
      hasOutput: true,
      outputType: 'json',
    });

    // AI Actions
    this.register({
      type: 'ai_clean_data',
      name: 'AI Clean Data',
      nameVi: 'AI làm sạch dữ liệu',
      description: 'Use AI to clean data',
      descriptionVi: 'Sử dụng AI để làm sạch dữ liệu',
      category: 'ai',
      icon: 'sparkles',
      params: [
        { name: 'range', type: 'range', label: 'Range', labelVi: 'Vùng', required: true },
      ],
      hasOutput: true,
    });

    this.register({
      type: 'ai_create_chart',
      name: 'AI Create Chart',
      nameVi: 'AI tạo biểu đồ',
      description: 'Use AI to create optimal chart',
      descriptionVi: 'Sử dụng AI để tạo biểu đồ tối ưu',
      category: 'ai',
      icon: 'wand',
      params: [
        { name: 'range', type: 'range', label: 'Data Range', labelVi: 'Vùng dữ liệu', required: true },
        { name: 'description', type: 'string', label: 'Description', labelVi: 'Mô tả', required: false },
      ],
      hasOutput: true,
      outputType: 'chart_id',
    });

    this.register({
      type: 'ai_formula',
      name: 'AI Formula',
      nameVi: 'AI công thức',
      description: 'Use AI to generate formula',
      descriptionVi: 'Sử dụng AI để tạo công thức',
      category: 'ai',
      icon: 'brain',
      params: [
        { name: 'description', type: 'string', label: 'Description', labelVi: 'Mô tả', required: true },
        { name: 'cell', type: 'range', label: 'Target Cell', labelVi: 'Ô đích', required: true },
      ],
      hasOutput: true,
      outputType: 'formula',
    });

    this.register({
      type: 'ai_analyze',
      name: 'AI Analyze',
      nameVi: 'AI phân tích',
      description: 'Use AI to analyze data',
      descriptionVi: 'Sử dụng AI để phân tích dữ liệu',
      category: 'ai',
      icon: 'search',
      params: [
        { name: 'range', type: 'range', label: 'Data Range', labelVi: 'Vùng dữ liệu', required: true },
      ],
      hasOutput: true,
      outputType: 'insights',
    });
  }

  private register(action: ActionDefinition): void {
    this.actions.set(action.type, action);
  }
}
