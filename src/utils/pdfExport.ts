// =============================================================================
// PDF EXPORT — Export spreadsheet to PDF
// =============================================================================

interface WorkbookState {
  sheets: Record<string, { name: string; cells: Record<string, any> }>;
  activeSheetId: string | null;
}

/**
 * Export workbook to PDF
 * Note: This is a placeholder implementation
 * For full PDF export, integrate a library like jsPDF or use server-side rendering
 */
export const exportToPDF = async (workbook: WorkbookState, filename: string): Promise<void> => {
  // For now, we'll create a simple text representation
  // In production, use jsPDF or pdfmake for proper PDF generation

  console.warn('PDF export is a placeholder implementation');
  console.log('Workbook to export:', workbook);
  console.log('Filename:', filename);

  // Create a simple HTML representation for printing
  const htmlContent = generateHTMLForPDF(workbook);

  // Open print dialog (user can save as PDF)
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  return Promise.resolve();
};

/**
 * Generate HTML content for PDF printing
 */
function generateHTMLForPDF(workbook: WorkbookState): string {
  const sheets = Object.values(workbook.sheets);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Excel Export</title>
  <style>
    @page {
      size: A4;
      margin: 1cm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
    }
    .sheet {
      page-break-after: always;
    }
    .sheet:last-child {
      page-break-after: auto;
    }
    h1 {
      font-size: 14pt;
      margin-bottom: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 4px 8px;
      text-align: left;
      font-size: 9pt;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
  </style>
</head>
<body>
`;

  sheets.forEach((sheet) => {
    html += `<div class="sheet">`;
    html += `<h1>${sheet.name}</h1>`;
    html += `<table>`;

    // Find max row and col
    let maxRow = 0;
    let maxCol = 0;
    Object.keys(sheet.cells).forEach((key) => {
      const [row, col] = key.split(':').map(Number);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    });

    // Generate table
    for (let row = 0; row <= Math.min(maxRow, 100); row++) {
      html += '<tr>';
      for (let col = 0; col <= Math.min(maxCol, 26); col++) {
        const key = `${row}:${col}`;
        const cell = sheet.cells[key];
        const value = cell?.displayValue || cell?.value || '';
        html += `<td>${escapeHTML(String(value))}</td>`;
      }
      html += '</tr>';
    }

    html += `</table>`;
    html += `</div>`;
  });

  html += `
</body>
</html>
`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
