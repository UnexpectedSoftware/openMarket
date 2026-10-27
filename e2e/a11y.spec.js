const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp} = require('./launch');

test.beforeAll(() => {
  assertDist();
});

test('sell screen exposes a labelled barcode field, a named button and a focus outline', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop'],
      products: [{
        name: 'Leche',
        barcode: '8400000000714',
        price: 1,
        basePrice: 1,
        stock: 10,
        stockMin: 1,
        category: 'Shop'
      }]
    }
  });
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await window.getByRole('link', {name: 'Vender', exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();

    const search = window.getByLabel('Buscar o escanear');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('name', 'barcode');
    await expect(window.getByRole('button', {name: /Cobrar/})).toBeVisible();
    const tile = window.getByRole('button', {name: /Leche/});
    await expect(tile).toBeVisible();

    await window.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await focusByTab(window, search);
    expect(await outlineStyle(search)).not.toBe('none');
    await focusByTab(window, tile);
    expect(await outlineStyle(tile)).not.toBe('none');

    await window.screenshot({path: 'test-results/a11y-sell-mercado.png'});
  } finally {
    await closeApp(app, userData);
  }
});

/**
 * @param {import('@playwright/test').Page} window
 * @param {import('@playwright/test').Locator} locator
 */
async function focusByTab(window, locator) {
  for (let step = 0; step < 40; step += 1) {
    if (await locator.evaluate(element => element === document.activeElement)) {
      return;
    }
    await window.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
}

/**
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<string>}
 */
function outlineStyle(locator) {
  return locator.evaluate(element => getComputedStyle(element).outlineStyle);
}
