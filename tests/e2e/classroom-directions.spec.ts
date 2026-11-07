import { expect, test } from '@playwright/test';

test('generated directions show both building maps before clicking the building', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'From room', exact: true })
    .selectOption('ocon-2-room-208');
  await page
    .getByRole('combobox', { name: 'To building', exact: true })
    .selectOption('langdon');
  await page
    .getByRole('combobox', { name: 'To room', exact: true })
    .selectOption('langdon-2-room-206');
  await page
    .getByRole('button', { name: 'Get directions', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Outdoor walk:');
  await expect(
    page.locator('.leaflet-overlay-pane path').first()
  ).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: "O'Connell Technology Center, floor 2",
      exact: true
    })
  ).toBeVisible();
  await expect(
    page.getByRole('img', {
      name: 'Langdon Engineering Center, floor 1',
      exact: true
    })
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Continue indoors at Langdon/ })
    .click();
  await expect(
    page.getByRole('heading', { name: /3\. Langdon/ })
  ).toBeFocused();
  await expect(
    page.getByRole('img', {
      name: 'Langdon Engineering Center, floor 1',
      exact: true
    })
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Floor 2', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('img', {
      name: 'Langdon Engineering Center, floor 2',
      exact: true
    })
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('both-plain-maps.png'),
    fullPage: true
  });
  await page
    .getByRole('combobox', { name: 'To building', exact: true })
    .selectOption('ayres');
  await expect(
    page.getByRole('combobox', { name: 'To room', exact: true })
  ).toHaveValue('');
  await expect(
    page.getByRole('heading', { name: 'Your directions', exact: true })
  ).toHaveCount(0);
  await page.screenshot({
    path: test.info().outputPath('desktop-indoor.png'),
    fullPage: true
  });
  expect(errors).toEqual([]);
});

test('mobile same-building route opens on the starting floor without an outdoor handoff', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'From room', exact: true })
    .selectOption('ocon-2-room-208');
  await page
    .getByRole('combobox', { name: 'To room', exact: true })
    .selectOption('ocon-1-room-114');
  await page
    .getByRole('button', { name: 'Get directions', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('same building');
  await expect(
    page.getByRole('img', {
      name: "O'Connell Technology Center, floor 2",
      exact: true
    })
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('mobile-indoor.png'),
    fullPage: true
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('Holt uses the same plain map viewer as O’Connell', async ({ page }) => {
  await page.goto('/#/buildings/holt');
  await expect(
    page.getByRole('img', { name: 'Holt Hall, floor 1', exact: true })
  ).toBeVisible();
  await expect(page.locator('object, iframe, embed')).toHaveCount(0);
  await expect(page.locator('.floor-plan .route-line')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('holt-plain-map.png'),
    fullPage: true
  });
});
