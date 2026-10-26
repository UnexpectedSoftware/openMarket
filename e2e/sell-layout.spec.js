const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {root, assertDist, launchApp, closeApp, chooseMenu, orderRow, scanBarcode} = require('./launch');

const SHOP = {
  categories: ['Shop'],
  products: [{
    name: 'Lentejas',
    barcode: '8400000000417',
    price: 2,
    basePrice: 1,
    stock: 20,
    stockMin: 2,
    category: 'Shop'
  }]
};

test.beforeAll(() => {
  assertDist();
});

async function openSell(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
  await window.setViewportSize({width: 1366, height: 768});
}

async function chooseLayout(window, name) {
  await window.getByRole('link', {name: 'Ajustes', exact: true}).click();
  await expect(window.getByRole('heading', {name: 'Apariencia'})).toBeVisible();
  await window.getByRole('radio', {name}).click();
  await window.getByRole('button', {name: 'Guardar', exact: true}).click();
  await expect(window.getByText('Ajustes guardados').first()).toBeVisible();
}

test('switches Mostrador, Escáner, and Táctil without reloading', async () => {
  test.setTimeout(90000);
  const {app, window, userData} = await launchApp({shop: SHOP});
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await window.evaluate(() => {
      window.__omBoot = 1;
    });
    await openSell(window);
    await expect.poll(() => window.evaluate(() => document.documentElement.dataset.layout)).toBe('mostrador');
    await expect(window.locator('.sell-layout-mostrador')).toBeVisible();
    await expect(window.locator('.sell-tile-name', {hasText: /^Lentejas$/})).toBeVisible();
    await expect(window.getByRole('button', {name: 'Shop', exact: true})).toBeVisible();
    await expect(window.locator('.sell-keypad')).toHaveCount(0);
    await scanBarcode(window, '8400000000417');
    await expect(orderRow(window, 'Lentejas')).toBeVisible();
    await window.screenshot({path: path.join(after, 'sell-layout-mostrador.png')});
    await window.getByRole('button', {name: 'Quitar', exact: true}).click();
    await expect(window.getByText('El ticket está vacío')).toBeVisible();

    await chooseLayout(window, 'Escáner');
    await openSell(window);
    expect(await window.evaluate(() => window.__omBoot)).toBe(1);
    await expect.poll(() => window.evaluate(() => document.documentElement.dataset.layout)).toBe('escaner');
    await expect(window.locator('.sell-layout-escaner')).toBeVisible();
    await expect(window.locator('.sell-grid')).toHaveCount(0);
    await expect(window.locator('.sell-chips')).toHaveCount(0);
    await expect(window.locator('input[name="barcode"]')).toBeVisible();
    await scanBarcode(window, '8400000000417');
    await expect(orderRow(window, 'Lentejas')).toBeVisible();
    await expect(window.getByRole('button', {name: 'Cobrar'})).toBeEnabled();
    await window.screenshot({path: path.join(after, 'sell-layout-escaner.png')});

    await chooseLayout(window, 'Táctil');
    await openSell(window);
    expect(await window.evaluate(() => window.__omBoot)).toBe(1);
    await expect.poll(() => window.evaluate(() => document.documentElement.dataset.layout)).toBe('tactil');
    await expect(window.locator('.sell-layout-tactil .sell-tile-name', {hasText: /^Lentejas$/})).toBeVisible();
    await expect(window.locator('.sell-keypad')).toBeVisible();
    await scanBarcode(window, '8400000000417');
    await expect(orderRow(window, 'Lentejas').locator('input')).toHaveValue('1');
    await window.getByRole('button', {name: '2', exact: true}).click();
    await expect(orderRow(window, 'Lentejas').locator('input')).toHaveValue('12');
    await window.screenshot({path: path.join(after, 'sell-layout-tactil.png')});
  } finally {
    await closeApp(app, userData);
  }
});
