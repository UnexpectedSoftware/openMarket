const {test, expect} = require('@playwright/test');
const {
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
  scanBarcode
} = require('./launch');

test.beforeAll(() => {
  assertDist();
});

test('creates a product', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Dairy');
    await chooseMenu(window, 'Products', 'new Product!');
    await expect(window.getByRole('heading', {name: "Let's create a new product!"})).toBeVisible();
    await window.getByRole('button', {name: 'Save'}).click();
    await expect(window.locator('.error', {hasText: 'Required'}).first()).toBeVisible();
    await expect(window.getByText('Product saved!')).toHaveCount(0);

    await fillProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 2,
      category: 'Dairy'
    });
    await window.getByRole('button', {name: 'Save'}).click();
    await expect(window.getByText('Product saved!')).toBeVisible();
    await expect(window.getByText('Product saved in database')).toBeVisible();
    await expect(window.locator('input[name="name"]')).toHaveValue('');

    await openProductList(window);
    const card = productCard(window, 'Milk');
    await expect(card).toBeVisible();
    await expect(card.locator('.product-card-barcode')).toContainText('8400000000011');
    await expect(card.locator('.product-card-stock')).toHaveText('10');
    await expect(card.locator('.product-card-status')).toHaveText('Enabled');
    await expect(card.locator('.product-card-price')).toHaveText(euros(2));
  } finally {
    await closeApp(app, userData);
  }
});

test('edits a product from the catalog', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Dairy');
    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 2,
      category: 'Dairy'
    });
    await openProductList(window);
    await productCard(window, 'Milk').getByRole('button', {name: 'View'}).click();

    await expect(window.getByRole('heading', {name: "Let's edit a product!"})).toBeVisible();
    const barcode = window.locator('input[name="barcode"]');
    await expect(barcode).toHaveValue('8400000000011');
    await expect(barcode).toHaveAttribute('readonly', '');
    await expect(window.locator('input[name="name"]')).toHaveValue('Milk');
    await expect(window.locator('input[name="price"]')).toHaveValue('2');

    await window.locator('input[name="name"]').fill('Whole milk');
    await window.locator('input[name="price"]').fill('3');
    await window.getByRole('button', {name: 'Save'}).click();
    await expect(window.getByText('Changes applied')).toBeVisible();
    await expect(window.getByText('Your changes were applied')).toBeVisible();
    await expect(window.locator('input[name="name"]')).toHaveValue('Whole milk');
    await expect(window.getByRole('heading', {name: "Let's edit a product!"})).toBeVisible();

    await openProductList(window);
    await expect(productCard(window, 'Milk')).toHaveCount(0);
    const card = productCard(window, 'Whole milk');
    await expect(card).toBeVisible();
    await expect(card.locator('.product-card-price')).toHaveText(euros(3));
  } finally {
    await closeApp(app, userData);
  }
});

test('filters the catalog and disables a product', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Dairy');
    await createCategory(window, 'Bakery');
    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 2,
      category: 'Dairy'
    });
    await createProduct(window, {
      name: 'Bread',
      barcode: '8400000000028',
      price: 1,
      basePrice: 1,
      stock: 1,
      stockMin: 3,
      category: 'Bakery'
    });
    await openProductList(window);
    await expect(window.getByRole('button', {name: 'Print product list'})).toBeVisible();
    await expect(window.locator('.product-card')).toHaveCount(2);

    const search = window.getByPlaceholder('Search products');
    await search.fill('Mil');
    await expect(productCard(window, 'Milk')).toBeVisible();
    await expect(productCard(window, 'Bread')).toHaveCount(0);
    await search.fill('8400000000028');
    await expect(productCard(window, 'Bread')).toBeVisible();
    await expect(productCard(window, 'Milk')).toHaveCount(0);
    await search.fill('');
    await expect(window.locator('.product-card')).toHaveCount(2);

    await window.getByRole('checkbox', {name: 'Low stock'}).check();
    await expect(productCard(window, 'Bread')).toBeVisible();
    await expect(productCard(window, 'Milk')).toHaveCount(0);
    await window.getByRole('checkbox', {name: 'Low stock'}).uncheck();
    await expect(window.locator('.product-card')).toHaveCount(2);

    await window.getByRole('radio', {name: 'Dairy'}).check();
    await expect(productCard(window, 'Milk')).toBeVisible();
    await expect(productCard(window, 'Bread')).toHaveCount(0);
    await window.getByRole('group', {name: 'Category'}).getByRole('radio', {name: 'All'}).check();
    await expect(window.locator('.product-card')).toHaveCount(2);

    const milk = productCard(window, 'Milk');
    await milk.getByRole('button', {name: 'Disable'}).click();
    await expect(window.getByText('Product disabled')).toBeVisible();
    await expect(window.getByText('It stays on the catalog and drops out of the low stock list.')).toBeVisible();
    await expect(milk.locator('.product-card-status')).toHaveText('Disabled');
    await expect(milk.getByRole('button', {name: 'Disable'})).toHaveCount(0);
    await expect(window.locator('.product-card-name')).toHaveText(['Bread', 'Milk']);

    const status = window.getByRole('group', {name: 'Status'});
    await status.getByRole('radio', {name: 'Enabled'}).check();
    await expect(productCard(window, 'Bread')).toBeVisible();
    await expect(productCard(window, 'Milk')).toHaveCount(0);

    await status.getByRole('radio', {name: 'Disabled'}).check();
    await expect(productCard(window, 'Milk')).toBeVisible();
    await expect(productCard(window, 'Bread')).toHaveCount(0);

    await status.getByRole('radio', {name: 'All'}).check();
    await expect(window.locator('.product-card')).toHaveCount(2);

    await productCard(window, 'Bread').getByRole('button', {name: 'Disable'}).click();
    await expect(productCard(window, 'Bread').locator('.product-card-status')).toHaveText('Disabled');
    await window.getByRole('checkbox', {name: 'Low stock'}).check();
    await expect(productCard(window, 'Bread')).toBeVisible();
    await expect(productCard(window, 'Milk')).toHaveCount(0);
    await status.getByRole('radio', {name: 'Enabled'}).check();
    await expect(productCard(window, 'Bread')).toHaveCount(0);
    await expect(productCard(window, 'Milk')).toHaveCount(0);
    await expect(window.getByText('No products match these filters')).toBeVisible();
    await status.getByRole('radio', {name: 'All'}).check();
    await window.getByRole('checkbox', {name: 'Low stock'}).uncheck();

    await chooseMenu(window, 'Orders', 'new Order!');
    await expect(window.getByRole('heading', {name: "Let's create a new order!"})).toBeVisible();
    await scanBarcode(window, '8400000000011');
    await expect(window.getByText('Product enabled')).toBeVisible();
    await expect(window.getByText('Milk has been enabled again and the stock was increased by +1.')).toBeVisible();
    const quantity = window.locator('.rt-tbody .rt-tr').filter({hasText: 'Milk'}).locator('input');
    await expect(quantity).toHaveValue('1');
    await expect(window.getByText('Order saved!')).toHaveCount(0);
  } finally {
    await closeApp(app, userData);
  }
});
