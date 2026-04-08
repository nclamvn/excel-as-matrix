// ============================================================
// GOOGLE SHEETS SERVICE — Import public Google Sheets
// ============================================================

/**
 * Extract spreadsheet ID from various Google Sheets URL formats.
 * Supports:
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
 *   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 */
export function parseGoogleSheetsUrl(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Validate that a string looks like a Google Sheets URL.
 */
export function isGoogleSheetsUrl(url: string): boolean {
  return /docs\.google\.com\/spreadsheets\/d\//.test(url);
}

/**
 * Import a public Google Sheet as an xlsx File blob.
 * Uses the backend proxy to avoid CORS issues.
 * The returned File can be passed directly to importExcelFile().
 *
 * Requirements: Sheet must be shared as "Anyone with the link can view".
 */
export async function fetchGoogleSheetAsFile(
  spreadsheetId: string
): Promise<File> {
  // Try backend proxy first (avoids CORS), fall back to direct fetch
  const proxyUrl = `/api/google-sheets-proxy?spreadsheetId=${encodeURIComponent(spreadsheetId)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'Sheet is not public. Please set sharing to "Anyone with the link can view".'
      );
    }
    if (response.status === 404) {
      throw new Error('Sheet not found. Please check the URL.');
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `Failed to fetch Google Sheet (${response.status})`
    );
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('Received empty file. The sheet may be private or deleted.');
  }

  return new File([blob], 'google-sheet-import.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
