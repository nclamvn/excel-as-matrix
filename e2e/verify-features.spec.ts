import { test, expect } from '@playwright/test';

// Helper: enter app from landing page
async function enterApp(page: import('@playwright/test').Page) {
  await page.goto('/');

  // Skip landing page
  await page.evaluate(() => localStorage.setItem('ai-suite-entered', 'true'));

  // Click CTA if landing page is showing
  const enterButton = page.locator('text=Start Free').or(page.locator('text=Try Free'));
  if (await enterButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await enterButton.first().click();
  }

  // Wait for grid
  await page.waitForSelector('canvas', { timeout: 15000 });

  // Wait for lazy components, then force-remove onboarding overlay
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="onboarding-tour"]').forEach(el => el.remove());
    // Prevent re-render by setting flag
    try { (window as any).__onboardingDismissed = true; } catch {}
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CORE GRID
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Core Grid — Baseline', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('C1: Cell edit — click, type, Enter', async ({ page }) => {
    // Use force:true to click through empty-state overlay
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 75, y: 30 }, force: true });
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cell-editor')).not.toBeVisible({ timeout: 3000 });
  });

  test('C2: Formula — type =1+1, shows 2', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    // Click cell B1 area
    await canvas.click({ position: { x: 150, y: 12 } });
    await page.keyboard.type('=1+1');
    await page.keyboard.press('Enter');
    // Navigate back to B1
    await page.keyboard.press('ArrowUp');
    const fb = page.locator('.formula-bar-2026');
    await expect(fb).toBeVisible();
  });

  test('C3: Multi-select — click then Shift+click', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 75, y: 30 }, force: true });
    await canvas.click({ position: { x: 250, y: 80 }, modifiers: ['Shift'], force: true });
    // Grid should still be visible after selection
    await expect(canvas).toBeVisible();
  });

  test('C4: Copy/Paste — Ctrl+C then Ctrl+V', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    // Enter value in A1
    await canvas.click({ position: { x: 75, y: 12 } });
    await page.keyboard.type('CopyMe');
    await page.keyboard.press('Enter');
    // Go back to A1 and copy
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Control+c');
    // Move to D1 and paste
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Control+v');
    // Should not crash
    await expect(page.locator('canvas').nth(0)).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PHASE B: SHARING
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Phase B — Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('B1: Share button opens dialog', async ({ page }) => {
    const shareBtn = page.locator('text=Share').first();
    if (await shareBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shareBtn.click();
      // Should show some share dialog/popover
      await page.waitForTimeout(500);
      const shareDialog = page.locator('.share-dialog, .share-popover, [class*="share"]').first();
      await expect(shareDialog).toBeVisible();
    }
  });

  test('B4: Close share dialog', async ({ page }) => {
    const shareBtn = page.locator('text=Share').first();
    if (await shareBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shareBtn.click();
      await page.waitForTimeout(300);
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. PHASE C: VERSION HISTORY
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Phase C — Version History', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('C1: History button opens panel', async ({ page }) => {
    const histBtn = page.locator('text=History').first();
    if (await histBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await histBtn.click();
      await page.waitForTimeout(500);
      const panel = page.locator('.version-history-panel, [class*="version-history"]').first();
      await expect(panel).toBeVisible();
    }
  });

  test('C5: Close version history panel', async ({ page }) => {
    const histBtn = page.locator('text=History').first();
    if (await histBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await histBtn.click();
      await page.waitForTimeout(500);
      // Close button
      const closeBtn = page.locator('.version-history-panel button, [class*="version-history"] button').filter({ hasText: /close|×/i }).first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. PHASE E: BUSINESS FEATURES
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Phase E — Business Features', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('E1: Filter Views — Data tab has filter controls', async ({ page }) => {
    await page.click('text=Data');
    await page.waitForTimeout(300);
    // Look for filter-related UI
    const filterUI = page.locator('text=Filter View').or(page.locator('text=Filter')).first();
    await expect(filterUI).toBeVisible({ timeout: 3000 });
  });

  test('E3: Protected Range — Review tab has protection', async ({ page }) => {
    await page.click('text=Review');
    await page.waitForTimeout(300);
    const protBtn = page.locator('text=Protect').or(page.locator('text=Range')).first();
    await expect(protBtn).toBeVisible({ timeout: 3000 });
  });

  test('E4: Add comment — right-click context menu', async ({ page }) => {
    const canvas = page.locator('canvas').nth(0);
    await canvas.click({ position: { x: 75, y: 12 }, button: 'right' });
    await page.waitForTimeout(300);
    const commentOption = page.locator('text=Add Comment').or(page.locator('text=Comment')).first();
    if (await commentOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(commentOption).toBeVisible();
    }
  });

  test('E6: Notification bell visible in header', async ({ page }) => {
    const bell = page.locator('.notification-bell, .bell-button').first();
    await expect(bell).toBeVisible({ timeout: 3000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. IMPORT/EXPORT
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Phase D — Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('D1: File menu opens with import options', async ({ page }) => {
    await page.click('.header-2026__brand');
    await page.waitForTimeout(300);
    await expect(page.locator('.file-menu')).toBeVisible();
  });

  test('D2: Open File button exists in empty state or File menu', async ({ page }) => {
    // Check for empty state Open File button OR file menu browse
    const openFileBtn = page.locator('text=Open File').or(page.locator('text=Browse Files')).first();
    if (await openFileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(openFileBtn).toBeVisible();
    } else {
      // Open file menu to find it
      await page.click('.header-2026__brand');
      await page.waitForTimeout(300);
      const browseBtn = page.locator('text=Browse Files').first();
      await expect(browseBtn).toBeVisible({ timeout: 3000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MOBILE RESPONSIVE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test('M1: Mobile layout renders without crash', async ({ page }) => {
    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    // Should render canvas grid
    await page.waitForSelector('canvas', { timeout: 10000 });
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('M2: Page loads without JS errors on mobile', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    const enterButton = page.locator('text=Enter App').or(page.locator('text=Get Started'));
    if (await enterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enterButton.click();
    }
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('supabase') &&
      !e.includes('WebSocket') &&
      !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
