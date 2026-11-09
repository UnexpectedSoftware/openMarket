const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  chooseMenu,
  productRow,
  openProductList,
  orderRow,
  scanBarcode,
  expectOrderTotal
} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

const SHOP = {
  categories: [
    {name: 'Lácteos', image: true},
    {name: 'Fruta'},
    {name: 'Panadería'},
    'Limpieza'
  ],
  products: [
    {
      name: 'Leche',
      barcode: '8400000001018',
      price: 2,
      basePrice: 1,
      stock: 20,
      stockMin: 4,
      category: 'Lácteos'
    },
    {
      name: 'Manzana',
      barcode: '8400000001025',
      price: 1.2,
      basePrice: 0.7,
      stock: 12.4,
      stockMin: 2,
      weighted: true,
      category: 'Fruta'
    },
    {
      name: 'Pan',
      barcode: '8400000001032',
      price: 1,
      basePrice: 0.4,
      stock: 1,
      stockMin: 3,
      category: 'Panadería'
    },
    {
      name: 'Queso',
      barcode: '8400000001049',
      price: 3,
      basePrice: 2,
      stock: 4,
      stockMin: 1,
      status: 'DISABLED',
      category: 'Lácteos'
    },
    {
      name: 'Nata',
      barcode: '8400000001056',
      price: 1.85,
      basePrice: 1.15,
      stock: 10,
      stockMin: 1,
      category: 'Lácteos'
    },
    {
      name: 'Arroz',
      barcode: '8400000000219',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 1,
      category: 'Panadería'
    },
    {
      name: 'Ham',
      barcode: '8400000000226',
      price: 18.5,
      basePrice: 10,
      stock: 8,
      stockMin: 1,
      category: 'Fruta',
      weighted: true
    }
  ],
  orders: [
    {
      secondsAgo: 2,
      lines: [{name: 'Leche', barcode: '8400000001018', price: 2, quantity: 1}]
    },
    {
      secondsAgo: 0,
      lines: [{name: 'Pan', barcode: '8400000001032', price: 1, quantity: 1}]
    }
  ]
};

function cardNamed(window, name) {
  return window.locator('.category-card').filter({
    has: window.locator('.category-card-name', {hasText: new RegExp(`^${name}$`)})
  });
}

/**
 * @param {import('@playwright/test').Page} window
 * @param {string} name
 */
async function shotThemes(window, name) {
  const after = path.join(root, 'docs/design/after');
  for (const theme of THEMES) {
    await window.evaluate(themeName => {
      document.documentElement.dataset.theme = themeName;
    }, theme);
    await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
    await window.screenshot({path: path.join(after, `${name}-${theme}.png`)});
  }
  await window.evaluate(() => {
    document.documentElement.dataset.theme = 'mercado';
  });
}

/**
 * @param {import('@playwright/test').Page} window
 * @param {string} heading
 */
async function closeDialog(window, heading) {
  await window.keyboard.press('Escape');
  await expect(window.getByRole('heading', {name: heading})).toHaveCount(0);
}

test.beforeAll(() => {
  assertDist();
});

test('writes the four-theme screen gallery', async () => {
  test.setTimeout(180000);
  const {app, window, userData} = await launchApp({shop: SHOP});
  fs.mkdirSync(path.join(root, 'docs/design/after'), {recursive: true});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await shootProducts(window);
    await shootCategories(window);
    await shootOrders(window);
    await shootSell(window);
    await shootLowStock(window);
    await shootPayment(window);
    await shootSettings(window);
  } finally {
    await closeApp(app, userData);
  }
});

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootProducts(window) {
  await openProductList(window);
  await expect(productRow(window, 'Leche')).toContainText('50 %');
  await expect(productRow(window, 'Leche').getByText('Activo', {exact: true})).toBeVisible();
  await expect(productRow(window, 'Manzana').locator('.products-stock-qty')).toHaveText('12,4 kg');
  await expect(productRow(window, 'Manzana')).toContainText('42 %');
  await expect(productRow(window, 'Pan').getByText('bajo', {exact: true})).toBeVisible();
  await expect(productRow(window, 'Queso').getByText('Inactivo', {exact: true})).toBeVisible();
  await shotThemes(window, 'products');

  await productRow(window, 'Nata').getByRole('button', {name: 'Editar'}).click();
  const drawer = window.getByRole('dialog');
  await expect(drawer.getByRole('heading', {name: 'Editar producto'})).toBeVisible();
  await expect(drawer.getByRole('switch', {name: 'Activo'})).toBeVisible();
  await expect(drawer.locator('input[name="barcode"]')).toHaveAttribute('readonly', '');
  await expect(drawer.getByText('38 %')).toBeVisible();
  await shotThemes(window, 'products-drawer');
  await closeDialog(window, 'Editar producto');
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootCategories(window) {
  await window.getByRole('link', {name: 'Categorías', exact: true}).click();
  await expect(window.getByRole('heading', {name: 'Categorías', exact: true})).toBeVisible();
  await expect(cardNamed(window, 'Lácteos')).toBeVisible();
  await shotThemes(window, 'categories');

  await cardNamed(window, 'Lácteos').getByRole('button', {name: 'Editar'}).click();
  await expect(window.getByRole('heading', {name: 'Editar categoría'})).toBeVisible();
  await shotThemes(window, 'categories-dialog');
  await closeDialog(window, 'Editar categoría');
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootOrders(window) {
  await chooseMenu(window, 'Orders', 'List Orders!');
  await expect(window.getByRole('heading', {name: 'Pedidos'})).toBeVisible();
  const rows = window.locator('.orders-row');
  await expect(rows).toHaveCount(2);
  await shotThemes(window, 'orders');

  await rows.nth(0).click();
  await expect(window.getByText('Factura simplificada')).toBeVisible();
  await shotThemes(window, 'order-detail');
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootSell(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
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
  await shotThemes(window, 'sell');

  await scanBarcode(window, '8400000000226');
  await expect(window.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
  await shotThemes(window, 'sell-weighted');
  await closeDialog(window, 'Peso (kg)');
  await window.getByRole('button', {name: 'Vaciar ticket', exact: true}).click();
  await window.getByRole('alertdialog').getByRole('button', {name: 'Vaciar', exact: true}).click();
  await expect(window.getByText('El ticket está vacío')).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootLowStock(window) {
  await expect(window.locator('.sell-tile', {hasText: 'Pan'}).getByText('Quedan 1', {exact: true})).toBeVisible();
  await shotThemes(window, 'low-stock-sell');

  await window.getByRole('link', {name: /^Informes\b/}).click();
  await expect(window.getByRole('heading', {name: 'Resumen'})).toBeVisible();
  await expect(window.getByRole('heading', {name: 'Stock bajo'})).toBeVisible();
  await expect(window.locator('.report-stock-row', {hasText: 'Pan'})).toBeVisible();
  await shotThemes(window, 'low-stock-informes');
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootPayment(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
  await scanBarcode(window, '8400000000226');
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
  await expect(sheet.locator('.checkout-tile-change').getByText(euros(2.62))).toBeVisible();
  await shotThemes(window, 'payment');
  await sheet.getByRole('button', {name: 'Volver', exact: true}).click();
  await expect(window.getByRole('heading', {name: 'Cobrar'})).toHaveCount(0);
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function shootSettings(window) {
  await window.getByRole('link', {name: 'Ajustes', exact: true}).click();
  await expect(window.getByRole('heading', {name: 'Ajustes'})).toBeVisible();
  await expect(window.getByRole('heading', {name: 'Comercio'})).toBeVisible();
  await expect(window.getByRole('heading', {name: 'Apariencia'})).toBeVisible();
  await shotThemes(window, 'settings');
}
