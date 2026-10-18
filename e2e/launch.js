const {expect, _electron: electron} = require('@playwright/test');
const {createRequire} = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

async function launchApp({userData: existing, env} = {}) {
  const userData = existing || fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  if (!existing) {
    fs.writeFileSync(path.join(userData, 'pixel.png'), PNG);
    fs.writeFileSync(path.join(userData, 'note.txt'), 'hello');
  }
  const app = await electron.launch({
    env: Object.assign({}, process.env, env || {}),
    executablePath: electronPath,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=${userData}`,
      path.join(root, 'dist/main.js')
    ]
  });
  const window = await app.firstWindow();
  return {app, window, userData};
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

async function chooseMenu(window, _menu, linkName) {
  if (linkName === 'new Product!') {
    await window.getByRole('link', {name: 'Productos', exact: true}).click();
    await window.getByRole('link', {name: 'Nuevo producto', exact: true}).click();
    return;
  }
  const label = RAIL_LINKS[linkName] || linkName;
  await window.getByRole('link', {name: label, exact: true}).click();
}

async function createCategory(window, name) {
  await window.getByRole('link', {name: 'Categorías', exact: true}).click();
  const draft = window.locator('.category-card.is-draft');
  await expect(draft).toBeVisible();
  await draft.getByRole('textbox', {name: 'Category name'}).fill(name);
  await draft.getByRole('button', {name: 'Save'}).click();
  await expect(window.getByText('Category saved!').first()).toBeVisible();
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

async function createProduct(window, product) {
  await chooseMenu(window, 'Products', 'new Product!');
  await expect(window.getByRole('heading', {name: "Let's create a new product!"})).toBeVisible();
  await fillProduct(window, product);
  await window.getByRole('button', {name: 'Save'}).click();
  await expect(window.getByText('Product saved!').first()).toBeVisible();
  await expect(window.getByText('Product saved in database').first()).toBeVisible();
  await expect(window.locator('input[name="name"]')).toHaveValue('');
}

function productCard(window, name) {
  return window.locator('.product-card').filter({
    has: window.locator('.product-card-name', {hasText: new RegExp(`^${name}$`)})
  });
}

async function openProductList(window) {
  await chooseMenu(window, 'Products', 'List Products!');
  await expect(window.getByRole('heading', {name: 'List Products'})).toBeVisible();
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

async function dismissTicket(window) {
  await expect(window.getByRole('heading', {name: '¿Imprimir ticket?'})).toBeVisible();
  await expect(window.getByRole('button', {name: 'YES!'})).toBeVisible();
  await window.getByRole('button', {name: 'NO'}).click();
  await expect(window.getByText('¿Imprimir ticket?')).toHaveCount(0);
}

module.exports = {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  chooseMenu,
  createCategory,
  fillProduct,
  createProduct,
  productCard,
  openProductList,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  dismissTicket
};
