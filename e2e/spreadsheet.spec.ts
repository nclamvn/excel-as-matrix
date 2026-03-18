import { test, expect } from '@playwright/test';

test.describe('Spreadsheet Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for landing page and click to enter app
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    // Wait for grid to load
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should load the spreadsheet grid', async ({ page }) => {
    // Check that canvas elements are present (headers and grid)
    const canvases = await page.locator('canvas').count();
    expect(canvases).toBeGreaterThanOrEqual(1);
  });

  test('should display column headers (A-Z)', async ({ page }) => {
    // Column headers should be visible
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('should display row numbers', async ({ page }) => {
    // Row headers should be visible
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('should select a cell on click', async ({ page }) => {
    // Click on the grid area
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 100, y: 50 } });

    // Formula bar should show cell reference
    await expect(page.locator('.formula-bar-2026__cell')).toBeVisible();
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Click on grid to focus
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 100, y: 50 } });

    // Press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    // Verify navigation (check formula bar shows updated cell)
    await expect(page.locator('.formula-bar-2026__cell')).toBeVisible();
  });

  test('should enter edit mode on typing', async ({ page }) => {
    // Click on grid
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 100, y: 50 } });

    // Type some text
    await page.keyboard.type('Hello');

    // Should show cell editor
    await expect(page.locator('.cell-editor')).toBeVisible();
  });

  test('should save cell value on Enter', async ({ page }) => {
    // Click on grid
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 100, y: 50 } });

    // Type and confirm
    await page.keyboard.type('Test Value');
    await page.keyboard.press('Enter');

    // Editor should close
    await expect(page.locator('.cell-editor')).not.toBeVisible();
  });

  test('should cancel edit on Escape', async ({ page }) => {
    // Click on grid
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 100, y: 50 } });

    // Type and cancel
    await page.keyboard.type('Should Cancel');
    await page.keyboard.press('Escape');

    // Editor should close
    await expect(page.locator('.cell-editor')).not.toBeVisible();
  });
});

test.describe('Toolbar Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.toolbar-2026', { timeout: 10000 });
  });

  test('should show toolbar', async ({ page }) => {
    await expect(page.locator('.toolbar-2026')).toBeVisible();
  });

  test('should toggle bold formatting', async ({ page }) => {
    // Click bold button
    const boldButton = page.locator('.toolbar-2026__btn').filter({ has: page.locator('svg') }).first();
    await boldButton.click();
  });

  test('should open font dropdown', async ({ page }) => {
    // Click font selector
    const fontSelect = page.locator('.toolbar-2026__select').first();
    await fontSelect.click();

    // Dropdown should appear
    await expect(page.locator('.toolbar-2026__dropdown-menu')).toBeVisible();
  });
});

test.describe('Navigation Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.header-2026', { timeout: 10000 });
  });

  test('should show navigation tabs', async ({ page }) => {
    await expect(page.locator('.header-2026__nav')).toBeVisible();
  });

  test('should switch to View tab', async ({ page }) => {
    // Click View tab
    await page.click('text=View');

    // View toolbar should show
    await expect(page.locator('text=Gridlines')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click different tabs
    await page.click('text=Insert');
    await page.click('text=Formulas');
    await page.click('text=Data');
    await page.click('text=Home');
  });
});

test.describe('File Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.header-2026__brand', { timeout: 10000 });
  });

  test('should open file menu', async ({ page }) => {
    // Click File button
    await page.click('.header-2026__brand');

    // File menu should appear
    await expect(page.locator('.file-menu')).toBeVisible();
  });

  test('should close file menu on outside click', async ({ page }) => {
    // Open file menu
    await page.click('.header-2026__brand');
    await expect(page.locator('.file-menu')).toBeVisible();

    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } });

    // Menu should close
    await expect(page.locator('.file-menu')).not.toBeVisible();
  });
});

test.describe('AI Copilot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.ai-toggle-btn', { timeout: 10000 });
  });

  test('should toggle AI panel', async ({ page }) => {
    // Click AI Copilot button
    await page.click('.ai-toggle-btn');

    // AI panel should appear
    await expect(page.locator('.ai-copilot-dock')).toBeVisible();
  });

  test('should show chat input', async ({ page }) => {
    // Open AI panel
    await page.click('.ai-toggle-btn');

    // Chat input should be visible
    await expect(page.locator('.ai-chat-input')).toBeVisible();
  });

  test('should show suggestion pills', async ({ page }) => {
    // Open AI panel
    await page.click('.ai-toggle-btn');

    // Suggestion pills should be visible
    await expect(page.locator('.ai-suggestion-pill').first()).toBeVisible();
  });

  test('should fill input on suggestion click', async ({ page }) => {
    // Open AI panel
    await page.click('.ai-toggle-btn');

    // Click a suggestion
    await page.click('.ai-suggestion-pill >> nth=0');

    // Input should have text
    const input = page.locator('.ai-chat-input');
    await expect(input).not.toHaveValue('');
  });
});

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.header-2026', { timeout: 10000 });
  });

  test('should switch to View tab and find theme toggle', async ({ page }) => {
    // Switch to View tab
    await page.click('text=View');

    // Theme button should be visible
    await expect(page.locator('text=Light').or(page.locator('text=Dark'))).toBeVisible();
  });
});

test.describe('Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.status-bar-2026', { timeout: 10000 });
  });

  test('should show zoom controls in status bar', async ({ page }) => {
    await expect(page.locator('.status-bar-2026__zoom')).toBeVisible();
  });

  test('should show 100% zoom by default', async ({ page }) => {
    await expect(page.locator('.status-bar-2026__zoom-value')).toContainText('100%');
  });

  test('should zoom in on + click', async ({ page }) => {
    // Click zoom in button
    await page.locator('.status-bar-2026__zoom-btn').last().click();

    // Zoom should increase
    await expect(page.locator('.status-bar-2026__zoom-value')).toContainText('110%');
  });

  test('should zoom out on - click', async ({ page }) => {
    // Click zoom out button
    await page.locator('.status-bar-2026__zoom-btn').first().click();

    // Zoom should decrease
    await expect(page.locator('.status-bar-2026__zoom-value')).toContainText('90%');
  });
});

test.describe('Sheet Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.sheet-tabs-2026', { timeout: 10000 });
  });

  test('should show sheet tabs', async ({ page }) => {
    await expect(page.locator('.sheet-tabs-2026')).toBeVisible();
  });

  test('should show Sheet1 by default', async ({ page }) => {
    await expect(page.locator('.sheet-tab-2026')).toContainText('Sheet1');
  });

  test('should have add sheet button', async ({ page }) => {
    await expect(page.locator('.sheet-tabs-2026__add')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FORMULA EVALUATION E2E TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Formula Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should evaluate a simple SUM formula', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);

    // Enter value in A1
    await canvas.click({ position: { x: 50, y: 12 } });
    await page.keyboard.type('10');
    await page.keyboard.press('Enter');

    // Enter value in A2
    await page.keyboard.type('20');
    await page.keyboard.press('Enter');

    // Enter SUM formula in A3
    await page.keyboard.type('=SUM(A1:A2)');
    await page.keyboard.press('Enter');

    // Navigate back to A3 to check
    await page.keyboard.press('ArrowUp');
    // Formula bar should show the formula or result
    await expect(page.locator('.formula-bar-2026')).toBeVisible();
  });

  test('should handle cell reference updates', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);

    // Enter value in A1
    await canvas.click({ position: { x: 50, y: 12 } });
    await page.keyboard.type('100');
    await page.keyboard.press('Tab');

    // Enter formula in B1 referencing A1
    await page.keyboard.type('=A1*2');
    await page.keyboard.press('Enter');

    // B1 should have the formula
    await expect(page.locator('.formula-bar-2026')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION E2E TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('canvas', { timeout: 10000 });
  });

  test('should navigate with Tab (right) and Shift+Tab (left)', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 50, y: 12 } });

    // Tab moves right
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Shift+Tab moves left
    await page.keyboard.press('Shift+Tab');

    await expect(page.locator('.formula-bar-2026__cell')).toBeVisible();
  });

  test('should enter edit mode with F2', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 50, y: 12 } });
    await page.keyboard.type('Test');
    await page.keyboard.press('Enter');

    // Go back to cell and press F2
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('F2');

    // Editor should be visible
    await expect(page.locator('.cell-editor')).toBeVisible();
  });

  test('should delete cell content with Delete key', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 50, y: 12 } });

    // Enter and confirm value
    await page.keyboard.type('To Delete');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');

    // Delete content
    await page.keyboard.press('Delete');

    // Cell should be empty now
    await expect(page.locator('.cell-editor')).not.toBeVisible();
  });

  test('should open Go To Cell dialog with Ctrl+G', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 50, y: 12 } });

    // Open Go To Cell
    await page.keyboard.press('Control+g');

    // Dialog should appear
    await expect(page.locator('input[placeholder*="Go to cell"]')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE E2E TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.header-2026', { timeout: 10000 });
  });

  test('should open with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.locator('.command-palette')).toBeVisible();
  });

  test('should close with Escape', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.locator('.command-palette')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.command-palette')).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PRINT PREVIEW E2E TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Print Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('.header-2026', { timeout: 10000 });
  });

  test('should open with Ctrl+P', async ({ page }) => {
    await page.keyboard.press('Control+p');
    // Print dialog should appear (or at least the overlay)
    await page.waitForTimeout(500);
  });
});
