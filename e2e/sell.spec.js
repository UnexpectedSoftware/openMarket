const fs = require('fs');
const path = require('path');
const {DatabaseSync} = require('node:sqlite');
const {test, expect} = require('@playwright/test');
const {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  chooseMenu,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  confirmPayment,
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

test('filters the product grid with a category chip', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop', 'Other'],
      products: [
        {
          name: 'Lentejas',
          barcode: '8400000000516',
          price: 2,
          basePrice: 1,
          stock: 20,
          stockMin: 2,
          category: 'Shop'
        },
        {
          name: 'Agua',
          barcode: '8400000000523',
          price: 1,
          basePrice: 1,
          stock: 20,
          stockMin: 2,
          category: 'Other'
        }
      ]
    }
  });
  try {
    await openSell(window);
    await expect(window.locator('.sell-tile-name', {hasText: /^Lentejas$/})).toBeVisible();
    await expect(window.locator('.sell-tile-name', {hasText: /^Agua$/})).toBeVisible();
    await window.getByRole('button', {name: 'Other', exact: true}).click();
    await expect(window.locator('.sell-tile-name', {hasText: /^Agua$/})).toBeVisible();
    await expect(window.locator('.sell-tile-name', {hasText: /^Lentejas$/})).toHaveCount(0);
    await window.getByRole('button', {name: 'Todos', exact: true}).click();
    await expect(window.locator('.sell-tile-name', {hasText: /^Lentejas$/})).toBeVisible();
    await expect(window.locator('.sell-tile-name', {hasText: /^Agua$/})).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('removes a unit line, a weighed line, and the whole ticket', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop'],
      products: [
        {
          name: 'Arroz',
          barcode: '8400000000615',
          price: 2,
          basePrice: 1,
          stock: 20,
          stockMin: 2,
          category: 'Shop'
        },
        {
          name: 'Ham',
          barcode: '8400000000622',
          price: 18.5,
          basePrice: 10,
          stock: 5,
          stockMin: 1,
          category: 'Shop',
          weighted: true
        }
      ]
    }
  });
  try {
    await openSell(window);
    await scanBarcode(window, '8400000000615');
    await expect(orderRow(window, 'Arroz').locator('input')).toHaveValue('1');
    await expect(orderRow(window, 'Arroz').getByRole('button', {name: 'Menos'})).toHaveCount(0);
    await orderRow(window, 'Arroz').getByRole('button', {name: 'Quitar', exact: true}).click();
    await expect(window.getByText('El ticket está vacío')).toBeVisible();

    await scanBarcode(window, '8400000000615');
    await orderRow(window, 'Arroz').getByRole('button', {name: 'Más'}).click();
    await expect(orderRow(window, 'Arroz').locator('input')).toHaveValue('2');
    await window.keyboard.press('Delete');
    await expect(window.getByText('El ticket está vacío')).toBeVisible();

    await scanBarcode(window, '8400000000622');
    const weight = window.getByRole('dialog');
    await expect(weight.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
    await weight.locator('input[name="quantity"]').fill('0,750');
    await weight.getByRole('button', {name: 'Añadir'}).click();
    await expect(orderRow(window, 'Ham')).toContainText('0,75 kg');
    await orderRow(window, 'Ham').getByRole('button', {name: 'Quitar', exact: true}).click();
    await expect(window.getByText('El ticket está vacío')).toBeVisible();

    await scanBarcode(window, '8400000000615');
    await scanBarcode(window, '8400000000622');
    const again = window.getByRole('dialog');
    await again.locator('input[name="quantity"]').fill('0,500');
    await again.getByRole('button', {name: 'Añadir'}).click();
    await expect(orderRow(window, 'Arroz')).toBeVisible();
    await expect(orderRow(window, 'Ham')).toBeVisible();
    await window.getByRole('button', {name: 'Vaciar ticket', exact: true}).click();
    const confirm = window.getByRole('alertdialog');
    await expect(confirm.getByRole('heading', {name: 'Vaciar ticket'})).toBeVisible();
    await confirm.getByRole('button', {name: 'Cancelar'}).click();
    await expect(orderRow(window, 'Arroz')).toBeVisible();
    await window.getByRole('button', {name: 'Vaciar ticket', exact: true}).click();
    await window.getByRole('alertdialog').getByRole('button', {name: 'Vaciar', exact: true}).click();
    await expect(window.getByText('El ticket está vacío')).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('shows the product grid when Vender opens', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
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
    }
  });
  try {
    await openSell(window);
    const tile = window.locator('.sell-tile-name', {hasText: /^Lentejas$/});
    await expect(tile).toBeVisible();
    await expect(window.getByText('No hay productos')).toHaveCount(0);
    await expect(window.locator('input[name="barcode"]')).toHaveValue('');
    await expect(tile).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('sells scanned, weighed, and free lines and blocks an invalid quantity', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop'],
      products: [
        {
          name: 'Arroz',
          barcode: '8400000000110',
          price: 2,
          basePrice: 1,
          stock: 20,
          stockMin: 2,
          category: 'Shop'
        },
        {
          name: 'Leche',
          barcode: '8400000000127',
          price: 1,
          basePrice: 1,
          stock: 20,
          stockMin: 2,
          category: 'Shop',
          vat: 'S1:10'
        },
        {
          name: 'Ham',
          barcode: '8400000000134',
          price: 18.5,
          basePrice: 10,
          stock: 8,
          stockMin: 1,
          category: 'Shop',
          weighted: true
        }
      ]
    }
  });
  try {
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

    const rows = window.locator('.order-vat');
    await expect(rows).toContainText('Base imponible');
    await expect(rows).toContainText(euros(18.87));
    await expect(rows).toContainText('IVA incluido (21 % · 10 %)');
    await expect(rows).toContainText(euros(3.51));
    await expect(window.locator('.sell-ticket-count')).toHaveText('4 líneas · 5 artículos');
    await expect(orderRow(window, 'Arroz')).toContainText('/ ud');
    await expect(orderRow(window, 'Ham')).toContainText('0,75 kg');

    await window.getByRole('button', {name: 'Cobrar'}).click();
    await confirmPayment(window);
    await expect(window.getByText('Order saved!')).toBeVisible();
    await dismissTicket(window);
    await expect(window.getByText('El ticket está vacío')).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('screenshots the sell screen and the weighted dialog in every theme', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop'],
      products: [
        {
          name: 'Arroz',
          barcode: '8400000000219',
          price: 2,
          basePrice: 1,
          stock: 10,
          stockMin: 1,
          category: 'Shop'
        },
        {
          name: 'Ham',
          barcode: '8400000000226',
          price: 18.5,
          basePrice: 10,
          stock: 5,
          stockMin: 1,
          category: 'Shop',
          weighted: true
        }
      ]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await openSell(window);
    await expect(window.locator('.sell-tile', {hasText: 'Ham'}).locator('.sell-tile-peso')).toContainText('peso');
    await expect(window.locator('.sell-tile', {hasText: 'Ham'}).locator('.sell-tile-unit')).toHaveText('/kg');
    await expect(window.locator('.sell-tile', {hasText: 'Arroz'}).locator('.sell-tile-initials')).toHaveText('AR');
    await expect(window.locator('.sell-tile', {hasText: 'Ham'}).locator('.sell-tile-initials')).toHaveText('HA');
    await scanBarcode(window, '8400000000219');
    await expect(orderRow(window, 'Arroz')).toBeVisible();
    await scanBarcode(window, '8400000000226');
    const weighed = window.getByRole('dialog');
    await expect(weighed.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
    await weighed.locator('input[name="quantity"]').fill('1');
    await weighed.getByRole('button', {name: 'Añadir'}).click();
    await expect(orderRow(window, 'Ham').locator('.sell-weight')).toHaveText('1 kg');
    await expect(orderRow(window, 'Ham')).toContainText('1 kg ×');

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

function latestPayment(userData) {
  const database = new DatabaseSync(path.join(userData, 'openmarket.sqlite'), {
    readOnly: true,
    timeout: 5000
  });
  try {
    return database.prepare(
      'SELECT payment_method, tendered_cents, change_cents FROM "order" ORDER BY created_at DESC LIMIT 1'
    ).get();
  } finally {
    database.close();
  }
}

test('pays cash with change, shows the ticket preview, and pays by card', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Shop'],
      products: [
        {
          name: 'Ham',
          barcode: '8400000000318',
          price: 18.5,
          basePrice: 10,
          stock: 8,
          stockMin: 1,
          category: 'Shop',
          weighted: true
        },
        {
          name: 'Milk',
          barcode: '8400000000325',
          price: 2,
          basePrice: 1,
          stock: 10,
          stockMin: 1,
          category: 'Shop'
        }
      ]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await openSell(window);
    await scanBarcode(window, '8400000000318');
    const weight = window.getByRole('dialog');
    await weight.locator('input[name="quantity"]').fill('0,750');
    await weight.getByRole('button', {name: 'Añadir'}).click();
    await window.getByRole('button', {name: 'Venta libre'}).click();
    const free = window.getByRole('dialog');
    await free.locator('#free-amount').fill('3,50');
    await free.locator('#free-vat').selectOption('S1:10');
    await free.getByRole('button', {name: 'Guardar'}).click();
    await expectOrderTotal(window, 17.38);

    await window.getByRole('button', {name: 'Cobrar'}).click();
    const sheet = window.getByRole('dialog');
    await expect(sheet.getByRole('heading', {name: 'Cobrar'})).toBeVisible();
    await expect(sheet.locator('.om-receipt')).toContainText('Ham');
    await expect(sheet.locator('.om-receipt')).toContainText('Venta libre');
    await sheet.getByRole('button', {name: euros(20)}).click();
    await expect(sheet.getByText(euros(2.62))).toBeVisible();
    await expect(window.locator('.notification')).toHaveCount(0);

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `payment-${theme}.png`)});
      await window.screenshot({path: path.join(root, 'test-results', `payment-${theme}.png`)});
    }

    await sheet.getByRole('button', {name: 'Confirmar'}).click();
    await expect(window.getByText('Order saved!')).toBeVisible();
    await expect(window.getByText(euros(2.62))).toBeVisible();
    await expect.poll(() => latestPayment(userData)).toEqual({
      payment_method: 'cash',
      tendered_cents: 2000,
      change_cents: 262
    });
    await dismissTicket(window);

    await scanBarcode(window, '8400000000325');
    await window.getByRole('button', {name: 'Cobrar'}).click();
    await confirmPayment(window, {method: 'card'});
    await expect(window.getByText('Pagado con tarjeta')).toBeVisible();
    await expect.poll(() => latestPayment(userData)).toEqual({
      payment_method: 'card',
      tendered_cents: 200,
      change_cents: 0
    });
    await dismissTicket(window);
  } finally {
    await closeApp(app, userData);
  }
});
