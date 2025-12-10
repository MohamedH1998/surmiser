import { test, expect } from '@playwright/test';

test.describe('Basic Usage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows suggestion and accepts with Tab', async ({ page }) => {
    // Target the Custom Simple Corpus input
    const input = page.getByPlaceholder('Type dev terms...');
    await expect(input).toBeVisible();

    await input.focus();
    await input.type('fea', { delay: 100 });
    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'feature request' });
    await expect(ghost).toBeVisible();

    await input.press('Tab');

    await expect(input).toHaveValue('feature request');
    await expect(ghost).not.toBeVisible();
  });

  test('dismisses suggestion on Escape', async ({ page }) => {
    const input = page.getByPlaceholder('Type dev terms...');

    await input.focus();
    await input.type('bug', { delay: 100 });

    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'bug report' });
    await expect(ghost).toBeVisible();

    await input.press('Escape');
    await expect(ghost).not.toBeVisible();

    // Text remains "bug"
    await expect(input).toHaveValue('bug');
  });

  test('clears suggestion on blur', async ({ page }) => {
    const input = page.getByPlaceholder('Type dev terms...');

    await input.focus();
    await input.type('dep', { delay: 100 }); // deploy to prod

    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'deploy to prod' });
    await expect(ghost).toBeVisible();

    // Click outside
    await page.locator('h1').click();

    await expect(ghost).not.toBeVisible();
  });
});
