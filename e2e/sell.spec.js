const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  createCategory,
  createProduct,
  chooseMenu,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  dismissTicket
} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test.beforeAll(() => {
  assertDist();
});

async function openSell(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
  await window.setViewportSize({width: 1366, height: 768});
}

test('sells scanned, weighed, and free lines and blocks an invalid quantity', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Shop');
    await createProduct(window, {
      name: 'Arroz',
      barcode: '8400000000110',
      price: 2,
      basePrice: 1,
      stock: 20,
      stockMin: 2,
      category: 'Shop'
    });
    await createProduct(window, {
      name: 'Leche',
      barcode: '8400000000127',
      price: 1,
      basePrice: 1,
      stock: 20,
      stockMin: 2,
      category: 'Shop',
      vat: 'S1:10'
    });
    await createProduct(window, {
      name: 'Ham',
      barcode: '8400000000134',
      price: 18.5,
      basePrice: 10,
      stock: 8,
      stockMin: 1,
      category: 'Shop',
      weighted: true
    });

    await openSell(window);
    await scanBarcode(window, '8400000000110');
    await expect(orderRow(window, 'Arroz').locator('input')).toHaveValue('1');
    await orderRow(window, 'Arroz').getByRole('button', {name: 'Más'}).click();
    await expect(orderRow(window, 'Arroz').locator('input')).toHaveValue('2');

    await scanBarcode(window, '8400000000127');
    await expect(orderRow(window, 'Leche').locator('input')).toHaveValue('1');

    await scanBarcode(window, '8400000000134');
    const weight = window.getByRole('dialog');
    await expect(weight.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
    await weight.locator('input[name="quantity"]').fill('0,750');
    await weight.getByRole('button', {name: 'Añadir'}).click();
    await expect(orderRow(window, 'Ham').locator('input')).toHaveValue('0.75');
    await expect(orderRow(window, 'Ham').locator('.sell-line-subtotal')).toHaveText(euros(13.88));

    await window.getByRole('button', {name: 'Venta libre'}).click();
    const free = window.getByRole('dialog');
    await expect(free.getByRole('heading', {name: 'Venta libre'})).toBeVisible();
    await free.locator('#free-amount').fill('3,50');
    await free.locator('#free-vat').selectOption('S1:10');
    await free.getByRole('button', {name: 'Guardar'}).click();
    await expect(orderRow(window, 'Venta libre').locator('.sell-line-subtotal')).toHaveText(euros(3.5));

    await setQuantity(window, 'Arroz', 0);
    await expect(orderRow(window, 'Arroz')).toHaveAttribute('aria-invalid', 'true');
    await expect(window.getByText('Cantidad no válida')).toBeVisible();
    await expect(window.getByRole('button', {name: 'Cobrar'})).toBeDisabled();

    await setQuantity(window, 'Arroz', 2);
    await expect(orderRow(window, 'Arroz')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(orderRow(window, 'Arroz').locator('.sell-line-subtotal')).toHaveText(euros(4));
    await expect(orderRow(window, 'Leche').locator('.sell-line-subtotal')).toHaveText(euros(1));
    await expectOrderTotal(window, 22.38);

    const rows = window.locator('.order-vat li');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('21 %');
    await expect(rows.nth(0)).toContainText(euros(14.78));
    await expect(rows.nth(0)).toContainText(euros(3.1));
    await expect(rows.nth(1)).toContainText('10 %');
    await expect(rows.nth(1)).toContainText(euros(4.09));
    await expect(rows.nth(1)).toContainText(euros(0.41));

    await window.getByRole('button', {name: 'Cobrar'}).click();
    await expect(window.getByText('Order saved!')).toBeVisible();
    await dismissTicket(window);
    await expect(window.getByText('El ticket está vacío')).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('screenshots the sell screen and the weighted dialog in every theme', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp();
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await createCategory(window, 'Shop');
    await createProduct(window, {
      name: 'Arroz',
      barcode: '8400000000219',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 1,
      category: 'Shop'
    });
    await createProduct(window, {
      name: 'Ham',
      barcode: '8400000000226',
      price: 18.5,
      basePrice: 10,
      stock: 5,
      stockMin: 1,
      category: 'Shop',
      weighted: true
    });
    await openSell(window);
    await scanBarcode(window, '8400000000219');
    await expect(orderRow(window, 'Arroz')).toBeVisible();

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `sell-${theme}.png`)});
    }

    await scanBarcode(window, '8400000000226');
    await expect(window.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `sell-weighted-${theme}.png`)});
    }
  } finally {
    await closeApp(app, userData);
  }
});
