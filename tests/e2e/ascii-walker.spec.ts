import { expect, test } from '@playwright/test';

test('campus stroll loops, pauses, and respects reduced motion', async ({
  page
}) => {
  await page.goto('/');
  const traveler = page.locator('.ascii-walk-traveler');
  await expect(traveler).toBeVisible();
  await expect(traveler).toHaveCSS('animation-iteration-count', 'infinite');
  await page.getByRole('button', { name: 'Pause walking animation' }).click();
  await expect(traveler).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Resume walking animation' }).click();
  await expect(traveler).toHaveCSS('animation-play-state', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(traveler).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.ascii-walk-stride pre').first()).toHaveCSS(
    'opacity',
    '1'
  );
  await expect(
    page.getByRole('button', { name: 'Pause walking animation' })
  ).toBeHidden();
});
