import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test('a sidebar link navigates before mouse release and only adds one history entry', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('complementary').getByRole('link', { name: 'Search', exact: true });
    await search.hover();
    const bounds = await search.boundingBox();
    if (!bounds) throw new Error('Expected the search link to have a visible bounding box');
    const historyLength = await page.evaluate(() => history.length);

    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    try {
      await expect(page).toHaveURL('/search');
      await expect(search).toHaveAttribute('aria-current', 'page');
    } finally {
      await page.mouse.up();
    }

    await expect.poll(() => page.evaluate(() => history.length)).toBe(historyLength + 1);
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('initial page load shows nav links while playlists stream', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/');
      await expect(page.locator('aside a[aria-label="Home"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Search"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Library"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Liked Tracks"]')).toBeVisible();
      await expect(page.locator('aside a[href^="/playlist/"]')).toHaveCount(0);
    });

    // Dynamic, cookie-gated content streams in after the shell.
    await expect(page.locator('aside a[href^="/playlist/"]').first()).toBeVisible({ timeout: 15000 });
  });
});
