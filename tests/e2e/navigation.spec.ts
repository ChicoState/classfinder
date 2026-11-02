import { expect, test } from '@playwright/test';

test('building directions support floor changes and a same-node route', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/buildings/oconnell');
  await expect(
    page.getByRole('heading', { name: "O'Connell Technology Center" })
  ).toBeVisible();
  await expect(page.locator('.route-line')).toBeVisible();
  await page.getByRole('tab', { name: 'Floor 4', exact: true }).click();
  await expect(
    page.getByRole('tab', { name: 'Floor 4', exact: true })
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByRole('img', { name: "O'Connell Technology Center, floor 4" })
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Floor 1', exact: true }).click();
  await page
    .getByLabel('Destination node')
    .selectOption('ocon-1-exit-lower-ao');
  await expect(page.locator('.route-line')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByLabel('Destination node').selectOption('ocon-1-room-114');
  await expect(page.locator('.route-line')).toBeVisible();
  expect(errors).toEqual([]);
});

test('unknown buildings show a recoverable message', async ({ page }) => {
  // Campus tiles are external decoration; checks must work without their service.
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.abort()
  );
  await page.goto('/#/buildings/unknown-building');
  await expect(
    page.getByRole('heading', { name: 'Building unavailable' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to campus map' }).click();
  await expect(page.getByText(/Enter your class schedule/)).toBeVisible();
});
