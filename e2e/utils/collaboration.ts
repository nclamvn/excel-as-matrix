import { Browser, BrowserContext, Page } from '@playwright/test';

export interface CollaborationSession {
  context: BrowserContext;
  page: Page;
  userId: string;
  userName: string;
}

/**
 * Create multiple browser contexts simulating different users.
 * Each context has isolated localStorage and cookies.
 */
export async function createCollaborators(
  browser: Browser,
  count: number,
  baseUrl: string
): Promise<CollaborationSession[]> {
  const sessions: CollaborationSession[] = [];

  for (let i = 0; i < count; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Pre-set user identity + skip landing page
    const userData = {
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@test.com`,
    };

    await page.addInitScript((data) => {
      localStorage.setItem('ai-suite-entered', 'true');
      localStorage.setItem('excelai-user', JSON.stringify(data));
    }, userData);

    await page.goto(baseUrl);

    // Wait for app to load
    await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => {
      // Might be on landing page, try clicking CTA
    });

    // Click through landing if still showing
    const cta = page.locator('text=Start Free').or(page.locator('text=Try Free'));
    if (await cta.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await cta.first().click();
      await page.waitForSelector('canvas', { timeout: 10000 });
    }

    // Remove onboarding overlay
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="onboarding-tour"]').forEach(el => el.remove());
    });

    sessions.push({
      context,
      page,
      userId: userData.id,
      userName: userData.name,
    });
  }

  return sessions;
}

/**
 * Cleanup all collaboration sessions.
 */
export async function closeCollaborators(sessions: CollaborationSession[]): Promise<void> {
  for (const session of sessions) {
    await session.context.close();
  }
}

/**
 * Wait for presence avatars to show expected count.
 */
export async function waitForPresenceSync(
  page: Page,
  expectedCount: number,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForFunction(
      (count) => {
        const avatars = document.querySelectorAll('[data-testid="presence-avatar"]');
        return avatars.length >= count;
      },
      expectedCount,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Supabase Realtime is actually connected.
 */
export async function isRealtimeConnected(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Check if connection status indicator shows "Live"
    const statusEl = document.querySelector('[title*="Live"]');
    return !!statusEl;
  });
}
