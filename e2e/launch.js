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

async function launchApp() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  fs.writeFileSync(path.join(userData, 'pixel.png'), PNG);
  fs.writeFileSync(path.join(userData, 'note.txt'), 'hello');
  const app = await electron.launch({
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

async function closeApp(app, userData) {
  await app.close();
  fs.rmSync(userData, {recursive: true, force: true});
}

function euros(amount) {
  return new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(amount);
}

async function chooseMenu(window, menu, linkName) {
  const title = window.locator('.rc-menu-submenu-title', {hasText: menu}).first();
  const link = window.getByRole('link', {name: linkName});
  // The horizontal menu closes about 100ms after the pointer leaves it.
  // Re-enter from the title and click before that timer wins.
  await expect(async () => {
    await window.locator('h1').hover();
    await title.hover();
    await link.click({timeout: 1000});
  }).toPass({timeout: 8000});
}

async function createCategory(window, name) {
  await window.getByRole('link', {name: 'Categories'}).click();
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
  return window.locator('.rt-tbody .rt-tr').filter({hasText: name});
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
  await expect(window.locator('h3')).toContainText(`${amount} €`);
}

async function dismissTicket(window) {
  await expect(window.getByRole('heading', {name: 'Do you want a ticket?!'})).toBeVisible();
  await expect(window.getByRole('button', {name: 'YES!'})).toBeVisible();
  await window.getByRole('button', {name: 'NO'}).click();
  await expect(window.getByText('Do you want a ticket?!')).toHaveCount(0);
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
