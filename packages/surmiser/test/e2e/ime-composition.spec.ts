import { test, expect } from '@playwright/test';

test.describe('IME Composition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('pauses suggestions during composition', async ({ page }) => {
    const input = page.getByPlaceholder('Type dev terms...');
    await input.focus();

    await input.type('f');
    const ghost = page
      .locator('div[style*="z-index: 9999"]')
      .filter({ hasText: 'feature request' });
    await expect(ghost).toBeVisible();

    // Start composition (simulating IME)
    await input.evaluate(el => {
      const event = new CompositionEvent('compositionstart', { bubbles: true });
      el.dispatchEvent(event);
    });

    // Ghost should disappear immediately on composition start
    await expect(ghost).not.toBeVisible();

    // Type more during composition
    await input.type('e');
    // Still shouldn't see ghost because we are "composing"
    await expect(ghost).not.toBeVisible();

    // End composition
    await input.evaluate(el => {
      const event = new CompositionEvent('compositionend', { bubbles: true });
      el.dispatchEvent(event);
    });

    // Trigger input event to signal completion (normally happens after compositionend)
    await input.evaluate(el => {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Now ghost should reappear for "fe" -> "feature request"
    await expect(ghost).toBeVisible();
    await expect(ghost).toContainText('feature request');
  });
});
