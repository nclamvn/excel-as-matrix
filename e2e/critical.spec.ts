import { expect, test } from '@playwright/test';
import { monitorBrowserErrors, openLocalWorkbook } from './utils/app';

const BACKEND_API = /^https?:\/\/[^/]+\/api(?:\/|$)/;
const serviceUnavailable = (route: import('@playwright/test').Route) =>
  route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'service unavailable in local-mode test' }),
  });

test.describe('Critical local workbook release gate', () => {
  test('persists edits, calculates formulas, and navigates by keyboard', async ({ page }) => {
    const browserErrors = monitorBrowserErrors(page);
    await page.route(BACKEND_API, serviceUnavailable);
    await openLocalWorkbook(page);

    const grid = page.getByTestId('grid-viewport');
    const cellRef = page.locator('.formula-bar-2026__cell');
    const formulaInput = page.locator('.formula-bar-2026__input');

    await grid.click({ position: { x: 50, y: 12 } });
    await page.keyboard.press('F2');
    await expect(page.locator('.cell-editor')).toBeVisible();
    await page.locator('.cell-editor').fill('Durable');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cell-editor')).not.toBeVisible();
    await expect(cellRef).toHaveText('A2');
    await grid.click({ position: { x: 50, y: 12 } });
    await expect(cellRef).toHaveText('A1');
    await expect(formulaInput).toHaveValue('Durable');

    await page.keyboard.press('ArrowRight');
    await expect(cellRef).toHaveText('B1');
    await page.keyboard.press('F2');
    await expect(page.locator('.cell-editor')).toBeVisible();
    await page.locator('.cell-editor').fill('=1+1');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cell-editor')).not.toBeVisible();
    await expect(cellRef).toHaveText('B2');
    await grid.click({ position: { x: 150, y: 12 } });
    await expect(cellRef).toHaveText('B1');
    await expect(formulaInput).toHaveValue('=1+1');
    await expect(page.locator('#sr-announce-polite')).toContainText('value 2');

    await page.keyboard.press('ArrowDown');
    await expect(cellRef).toHaveText('B2');
    await page.keyboard.press('ArrowLeft');
    await expect(cellRef).toHaveText('A2');
    browserErrors.assertClean();
  });

  test('opens and closes the file menu without hidden conditional passes', async ({ page }) => {
    const browserErrors = monitorBrowserErrors(page);
    await page.route(BACKEND_API, serviceUnavailable);
    await openLocalWorkbook(page);

    await page.locator('.header-2026__brand').click();
    await expect(page.locator('.file-menu')).toBeVisible();
    await expect(page.getByText('Browse Files', { exact: true })).toBeVisible();

    await page.locator('.file-menu__overlay').click({ position: { x: 1_000, y: 40 } });
    await expect(page.locator('.file-menu')).not.toBeVisible();
    browserErrors.assertClean();
  });

  test('remains editable when every backend API request is unavailable', async ({ page }) => {
    const browserErrors = monitorBrowserErrors(page);
    let blockedRequests = 0;
    await page.route(BACKEND_API, async (route) => {
      blockedRequests += 1;
      await serviceUnavailable(route);
    });

    await openLocalWorkbook(page);
    expect(blockedRequests).toBeGreaterThan(0);

    const grid = page.getByTestId('grid-viewport');
    await grid.click({ position: { x: 50, y: 12 } });
    await page.keyboard.press('F2');
    await expect(page.locator('.cell-editor')).toBeVisible();
    await page.locator('.cell-editor').fill('Offline-safe');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cell-editor')).not.toBeVisible();
    await expect(page.locator('.formula-bar-2026__cell')).toHaveText('A2');
    await grid.click({ position: { x: 50, y: 12 } });
    await expect(page.locator('.formula-bar-2026__input')).toHaveValue('Offline-safe');
    browserErrors.assertClean();
  });

  test('shows offline AI and requires explicit demo opt-in', async ({ page }) => {
    const browserErrors = monitorBrowserErrors(page);
    await page.route(BACKEND_API, serviceUnavailable);
    await openLocalWorkbook(page);

    await page.getByTitle('AI Copilot').click();
    await expect(page.getByTestId('ai-runtime-status')).toHaveText('Offline');
    await expect(page.locator('.ai-chat-input')).toBeDisabled();
    await expect(page.getByTestId('ai-availability-message')).toContainText('AI offline');

    await page.getByRole('button', { name: 'Enable demo' }).click();
    await expect(page.getByTestId('ai-runtime-status')).toHaveText('Demo');
    await expect(page.locator('.ai-chat-input')).toBeEnabled();
    await expect(page.locator('.ai-chat-mode-indicator')).toContainText('simulated answers');
    browserErrors.assertClean();
  });

  test('previews, applies, audits, and rolls back an explicit demo write', async ({ page }) => {
    const browserErrors = monitorBrowserErrors(page);
    await page.route(BACKEND_API, serviceUnavailable);
    await openLocalWorkbook(page);

    await page.getByTitle('AI Copilot').click();
    await page.getByRole('button', { name: 'Enable demo' }).click();
    await page.locator('.ai-chat-input').fill('demo write A1=Trusted-AI');
    await page.locator('.ai-chat-input').press('Enter');

    const actionsTab = page.locator('.ai-copilot-tab').filter({ hasText: 'Actions' });
    await expect(actionsTab.locator('.ai-copilot-badge--count')).toHaveText('1');
    await actionsTab.click();
    await page.locator('.ai-action-card-description').click();
    await expect(page.getByTestId('ai-action-preview-diff')).toContainText('Trusted-AI');
    await expect(page.getByTestId('ai-action-preview-diff')).toContainText('null');

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.locator('.formula-bar-2026__input')).toHaveValue('Trusted-AI');

    await page.locator('.ai-copilot-tab').filter({ hasText: 'History' }).click();
    await expect(page.locator('.ai-history-item-outcome')).toContainText('success');
    await page.getByRole('button', { name: 'Rollback' }).click();
    await expect(page.locator('.formula-bar-2026__input')).toHaveValue('');
    await expect(page.locator('.ai-history-item-outcome')).toContainText('reverted');
    await expect(page.getByRole('button', { name: 'Rollback' })).toHaveCount(0);
    browserErrors.assertClean();
  });
});
