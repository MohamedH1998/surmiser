import { test, expect } from '@playwright/test';

test.describe('Mobile Gestures', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows "tap" badge on mobile', async ({ page }) => {
    const input = page.getByPlaceholder('Type dev terms...');
    await input.tap();
    await input.type('tha', { delay: 100 }); // thanks

    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'thanks' });
    await expect(ghost).toBeVisible();
    const badge = ghost.locator('span', { hasText: 'tap' });
    await expect(badge).toBeVisible();
  });

  test('accepts suggestion on touch/tap', async ({ page }) => {
    const input = page.getByPlaceholder('Type dev terms...');
    await input.tap();
    await input.type('fea', { delay: 100 });

    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'feature request' });
    await expect(ghost).toBeVisible();

    const suggestionText = ghost.locator('span', { hasText: 'ture request' });

    await suggestionText.tap();

    await expect(input).toHaveValue('feature request');
    await expect(ghost).not.toBeVisible();
  });
});
