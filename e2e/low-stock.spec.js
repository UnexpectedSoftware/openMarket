const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {root, assertDist, launchApp, closeApp, scanBarcode, confirmPayment, dismissTicket} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test.beforeAll(() => {
  assertDist();
});

test('sells down to the minimum and updates the tile badge and the nav count', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Dairy'],
      products: [{
        name: 'Milk',
        barcode: '8400000000318',
        price: 1,
        basePrice: 1,
        stock: 2,
        stockMin: 1,
        category: 'Dairy'
      }]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await window.getByRole('link', {name: 'Vender', exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
    await expect(window.locator('.sell-tile', {hasText: 'Milk'}).getByText(/Quedan/)).toHaveCount(0);
    await expect(window.locator('.nav-rail-count')).toHaveCount(0);

    await scanBarcode(window, '8400000000318');
    await expect(window.locator('.sell-line', {hasText: 'Milk'}).getByText(/Quedan/)).toHaveCount(0);
    await window.getByRole('button', {name: 'Cobrar'}).click();
    await confirmPayment(window);
    await expect(window.getByText('Quedan 1 de Milk (mínimo 1).')).toBeVisible();
    await expect(window.locator('.sell-tile', {hasText: 'Milk'}).getByText('Quedan 1', {exact: true})).toBeVisible();
    await expect(window.getByRole('link', {name: /^Productos\b/}).locator('.om-badge')).toHaveText('1');
    await expect(window.getByRole('link', {name: /^Informes\b/}).locator('.om-badge')).toHaveText('1');
    await dismissTicket(window);
    const stockNotice = window.locator('.notification').filter({hasText: 'Stock bajo'});
    if (await stockNotice.count()) {
      await stockNotice.locator('.notification-dismiss').click();
    }
    await expect(stockNotice).toHaveCount(0);

    await scanBarcode(window, '8400000000318');
    await expect(window.locator('.sell-line', {hasText: 'Milk'}).getByText('Quedan 1', {exact: true})).toBeVisible();

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `low-stock-sell-${theme}.png`)});
    }

    await window.getByRole('link', {name: /^Informes\b/}).click();
    await expect(window.getByRole('heading', {name: 'Most sold'})).toBeVisible();
    await expect(window.getByRole('link', {name: 'Stock bajo 1'})).toBeVisible();
    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `low-stock-informes-${theme}.png`)});
    }
  } finally {
    await closeApp(app, userData);
  }
});
