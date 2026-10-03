const {test, expect} = require('@playwright/test');
const {
  assertDist,
  launchApp,
  closeApp,
  chooseMenu,
  createCategory,
  createProduct,
  productCard,
  openProductList,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  dismissTicket
} = require('./launch');

test.beforeAll(() => {
  assertDist();
});

async function openNewOrder(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: "Let's create a new order!"})).toBeVisible();
}

async function saveOrder(window) {
  await window.locator('h3 a.button', {hasText: 'Save'}).click();
}

async function expectSubtotal(window, name, amount) {
  await expect(orderRow(window, name).locator('.rt-td').nth(3)).toHaveText(`${amount} €`);
}

async function openStartCalendar(window) {
  await window.locator('.FilterCalendar-item').first().locator('input').click();
  await expect(window.locator('.react-datepicker')).toBeVisible();
}

async function chooseCalendarDay(window, dayText) {
  await window.locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)', {
    hasText: new RegExp(`^${dayText}$`)
  }).click();
}

test('sells, edits quantity, and warns on low stock', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Dairy');
    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 5,
      stockMin: 4,
      category: 'Dairy'
    });
    await createProduct(window, {
      name: 'Bread',
      barcode: '8400000000028',
      price: 1,
      basePrice: 1,
      stock: 20,
      stockMin: 2,
      category: 'Dairy'
    });
    await openNewOrder(window);
    await scanBarcode(window, '8400000000011');
    await expect(orderRow(window, 'Milk').locator('input')).toHaveValue('1');
    await expectSubtotal(window, 'Milk', 2);
    await expectOrderTotal(window, 2);

    await setQuantity(window, 'Milk', 3);
    await expectSubtotal(window, 'Milk', 6);
    await expectOrderTotal(window, 6);

    await setQuantity(window, 'Milk', 1);
    await expectSubtotal(window, 'Milk', 2);
    await expectOrderTotal(window, 2);

    await setQuantity(window, 'Milk', 0);
    await expectSubtotal(window, 'Milk', 0);
    await expectOrderTotal(window, 0);
    await saveOrder(window);
    await expect(window.getByText('Order was not saved')).toBeVisible();
    await expect(window.getByText('Quantity must be greater than 0')).toBeVisible();
    await expect(window.getByText('Order saved!')).toHaveCount(0);
    await expect(window.getByText('Do you want a ticket?!')).toHaveCount(0);
    await expect(orderRow(window, 'Milk')).toBeVisible();

    await setQuantity(window, 'Milk', 2);
    await scanBarcode(window, '8400000000028');
    await expect(orderRow(window, 'Bread').locator('input')).toHaveValue('1');
    await expectOrderTotal(window, 5);
    await saveOrder(window);
    await expect(window.getByText('Order saved!')).toBeVisible();
    await expect(window.getByText('Order is saved in database')).toBeVisible();
    await expect(window.getByText('Stock is low')).toHaveCount(1);
    await expect(window.getByText('Milk has 3 left (minimum 4).')).toBeVisible();
    await expect(window.getByText(/Bread has \d+ left/)).toHaveCount(0);
    await dismissTicket(window);
    await expect(orderRow(window, 'Milk')).toHaveCount(0);
    await expect(window.getByText('No rows found')).toBeVisible();

    await openProductList(window);
    await expect(productCard(window, 'Milk').locator('.product-card-stock')).toHaveText('3');
    await expect(productCard(window, 'Bread').locator('.product-card-stock')).toHaveText('19');
  } finally {
    await closeApp(app, userData);
  }
});

test('lists an order and opens its detail', async () => {
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
    await openNewOrder(window);
    await scanBarcode(window, '8400000000011');
    await expect(orderRow(window, 'Milk').locator('input')).toHaveValue('1');
    await saveOrder(window);
    await dismissTicket(window);

    await chooseMenu(window, 'Orders', 'List Orders!');
    await expect(window.getByRole('heading', {name: 'List Order!'})).toBeVisible();
    const row = window.locator('.rt-tbody .rt-tr').filter({hasText: '2 €'});
    await expect(row).toBeVisible();
    await expect(window.locator('h3')).toHaveText('2 €');

    await openStartCalendar(window);
    await window.locator('.react-datepicker__navigation--next').click();
    await chooseCalendarDay(window, '15');
    await window.getByRole('button', {name: 'Filter'}).click();
    await expect(window.locator('.rt-tbody').getByText('View', {exact: true})).toHaveCount(0);
    await expect(window.locator('h3')).toHaveText('0 €');

    await openStartCalendar(window);
    await window.locator('.react-datepicker__navigation--previous').click();
    await chooseCalendarDay(window, '1');
    await window.getByRole('button', {name: 'Filter'}).click();
    await expect(row).toBeVisible();
    await expect(window.locator('h3')).toHaveText('2 €');

    await row.getByText('View', {exact: true}).click();
    await expect(window.getByRole('heading', {name: "Let's edit an order!"})).toBeVisible();
    await expect(window.locator('input[name="barcode"]')).toHaveCount(0);
    await expect(window.locator('a.button', {hasText: 'Save'})).toHaveCount(0);
    const quantity = orderRow(window, 'Milk').locator('input');
    await expect(quantity).toHaveValue('1');
    await expect(quantity).toHaveAttribute('readonly', '');
    await expectSubtotal(window, 'Milk', 2);
    await expect(window.locator('a.button', {hasText: 'Print!'})).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});
