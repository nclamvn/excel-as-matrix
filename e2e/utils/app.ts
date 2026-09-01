import { expect, Page } from '@playwright/test';

// Local-mode scenarios deliberately make only /api/* return 503. Chromium reports
// those responses as console errors even though the app correctly falls back.
const EXPECTED_CONSOLE_ERRORS = [
  /^console: Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)$/,
];

export interface BrowserErrorMonitor {
  assertClean(): void;
}

export function monitorBrowserErrors(page: Page): BrowserErrorMonitor {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  return {
    assertClean() {
      const unexpected = errors.filter(
        (message) => !EXPECTED_CONSOLE_ERRORS.some((pattern) => pattern.test(message))
      );
      expect(unexpected, 'unexpected browser errors').toEqual([]);
    },
  };
}

export async function openLocalWorkbook(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('ai-suite-entered', 'true');
    localStorage.setItem('excelai-onboarding-completed', 'true');
  });

  await page.goto('/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.formula-bar-2026__cell')).toHaveText('A1');
}
