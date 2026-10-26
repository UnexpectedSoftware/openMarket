const {expect, _electron: electron} = require('@playwright/test');
const {createRequire} = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {seedShop, seedTheme} = require('./seed');

const electronPath = createRequire(__filename)('electron');
const root = path.join(__dirname, '..');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function assertDist() {
  const main = path.join(root, 'dist/main.js');
  const page = path.join(root, 'dist/app.html');
  if (!fs.existsSync(main) || !fs.existsSync(page)) {
    throw new Error('Run npm run build before npm run test:ui');
  }
  fs.mkdirSync(path.join(root, 'test-results'), {recursive: true});
}

function prepareUserData(existing) {
  if (existing) {
    return {userData: existing, created: false};
  }
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  fs.writeFileSync(path.join(userData, 'pixel.png'), PNG);
  fs.writeFileSync(path.join(userData, 'note.txt'), 'hello');
  return {userData, created: true};
}

function launchElectron(userData, env) {
  return electron.launch({
    env: Object.assign({}, process.env, env || {}),
    executablePath: electronPath,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=${userData}`,
      path.join(root, 'dist/main.js')
    ]
  });
}

async function discardFailedLaunch(app, prepared) {
  if (app) {
    await app.close();
  }
  if (prepared.created) {
    fs.rmSync(prepared.userData, {recursive: true, force: true});
  }
}

async function launchApp({userData: existing, env, shop} = {}) {
  const prepared = prepareUserData(existing);
  let app;
  try {
    if (shop) {
      await seedShop(prepared.userData, shop);
    }
    app = await launchElectron(prepared.userData, env);
    const window = await app.firstWindow();
    return {app, window, userData: prepared.userData};
  } catch (error) {
    await discardFailedLaunch(app, prepared);
    throw error;
  }
}

async function closeApp(app, userData, {keep = false} = {}) {
  await app.close();
  if (!keep) {
    fs.rmSync(userData, {recursive: true, force: true});
  }
}

function euros(amount) {
  return new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(amount);
}

const RAIL_LINKS = {
  'new Order!': 'Vender',
  'List Orders!': 'Pedidos',
  'List Products!': 'Productos'
};

function railPattern(label) {
  return new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
}

async function chooseMenu(window, _menu, linkName) {
  if (linkName === 'new Product!') {
    await window.getByRole('link', {name: railPattern('Productos')}).click();
    await window.getByRole('link', {name: 'Nuevo producto', exact: true}).click();
    return;
  }
  const label = RAIL_LINKS[linkName] || linkName;
  await window.getByRole('link', {name: railPattern(label)}).click();
}

async function fillProduct(window, product) {
  await window.locator('input[name="name"]').fill(product.name);
  await window.locator('input[name="barcode"]').fill(product.barcode);
  await window.locator('input[name="price"]').fill(String(product.price));
  await window.locator('input[name="basePrice"]').fill(String(product.basePrice));
  await window.locator('input[name="stock"]').fill(String(product.stock));
  await window.locator('input[name="stockMin"]').fill(String(product.stockMin));
  if (product.weighted) {
    await window.locator('input[name="weighted"]').check();
  }
  if (product.vat) {
    await window.locator('select[name="vatRate"]').selectOption(product.vat);
  }
  const category = window.locator('select[name="categoryId"]');
  await expect(category.locator('option', {hasText: product.category})).toHaveCount(1);
  await category.selectOption({label: product.category});
}

function productRow(window, name) {
  return window.locator('tbody tr').filter({
    has: window.locator('.products-name', {hasText: new RegExp(`^${name}$`)})
  });
}

async function openProductList(window) {
  await chooseMenu(window, 'Products', 'List Products!');
  await expect(window.getByRole('heading', {name: 'Productos', exact: true})).toBeVisible();
}

function orderRow(window, name) {
  return window.locator('.sell-line').filter({hasText: name});
}

async function scanBarcode(window, barcode) {
  const input = window.locator('input[name="barcode"]');
  await input.fill(barcode);
  await input.press('Enter');
}

async function setQuantity(window, name, quantity) {
  const input = orderRow(window, name).locator('input');
  await input.evaluate((element, value) => {
    const prototype = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    prototype.set.call(element, value);
    element.dispatchEvent(new Event('input', {bubbles: true}));
  }, String(quantity));
  await expect(input).toHaveValue(String(quantity));
}

async function expectOrderTotal(window, amount) {
  await expect(window.locator('.order-total')).toContainText(euros(amount));
}

async function confirmPayment(window, {method = 'cash', tendered} = {}) {
  const sheet = window.getByRole('dialog');
  await expect(sheet.getByRole('heading', {name: 'Cobrar'})).toBeVisible();
  if (method === 'card') {
    await sheet.getByRole('button', {name: 'Tarjeta', exact: true}).click();
  } else if (tendered != null) {
    await sheet.locator('#payment-tendered').fill(String(tendered));
  } else {
    await sheet.getByRole('button', {name: 'Exacto', exact: true}).click();
  }
  await sheet.getByRole('button', {name: 'Confirmar'}).click();
  await expect(window.getByRole('heading', {name: 'Cobrar'})).toHaveCount(0);
}

async function dismissTicket(window) {
  const print = window.getByRole('button', {name: 'Imprimir ticket'});
  await expect(print).toBeVisible();
  await window.locator('.notification').filter({hasText: 'Imprimir ticket'}).locator('.notification-dismiss').click();
  await expect(print).toHaveCount(0);
}

module.exports = {
  root,
  assertDist,
  launchApp,
  closeApp,
  seedShop,
  seedTheme,
  euros,
  chooseMenu,
  fillProduct,
  productRow,
  openProductList,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  confirmPayment,
  dismissTicket
};
