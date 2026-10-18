const {test, expect} = require('@playwright/test');
const {
  assertDist,
  launchApp,
  closeApp,
  chooseMenu,
  euros,
  createCategory,
  createProduct,
  productCard,
  openProductList,
  orderRow,
  scanBarcode,
  setQuantity,
  expectOrderTotal,
  confirmPayment,
  dismissTicket
} = require('./launch');

test.beforeAll(() => {
  assertDist();
});

async function openNewOrder(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
}

async function saveOrder(window) {
  await window.getByRole('button', {name: 'Cobrar'}).click();
  await confirmPayment(window);
}

async function expectSubtotal(window, name, amount) {
  await expect(orderRow(window, name).locator('.sell-line-subtotal')).toHaveText(euros(amount));
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
    await expect(orderRow(window, 'Milk')).toHaveAttribute('aria-invalid', 'true');
    await expect(window.getByText('Cantidad no válida')).toBeVisible();
    await expect(window.getByRole('button', {name: 'Cobrar'})).toBeDisabled();
    await expect(window.getByText('Order saved!')).toHaveCount(0);
    await expect(window.getByText('¿Imprimir ticket?')).toHaveCount(0);
    await expect(orderRow(window, 'Milk')).toBeVisible();

    await setQuantity(window, 'Milk', 2);
    await scanBarcode(window, '8400000000028');
    await expect(orderRow(window, 'Bread').locator('input')).toHaveValue('1');
    await expectOrderTotal(window, 5);
    await saveOrder(window);
    await expect(window.getByText('Order saved!')).toBeVisible();
    await expect(window.getByText(/Cambio/)).toBeVisible();
    await expect(window.getByText('Stock is low')).toHaveCount(1);
    await expect(window.getByText('Milk has 3 left (minimum 4).')).toBeVisible();
    await expect(window.getByText(/Bread has \d+ left/)).toHaveCount(0);
    await dismissTicket(window);
    await expect(orderRow(window, 'Milk')).toHaveCount(0);
    await expect(window.getByText('El ticket está vacío')).toBeVisible();

    await openProductList(window);
    await expect(productCard(window, 'Milk').locator('.product-card-stock')).toHaveText('3');
    await expect(productCard(window, 'Bread').locator('.product-card-stock')).toHaveText('19');
  } finally {
    await closeApp(app, userData);
  }
});

test('shows the VAT breakdown for the sold rate', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Dairy');
    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000042',
      price: 1.1,
      basePrice: 1,
      stock: 5,
      stockMin: 1,
      category: 'Dairy',
      vat: 'S1:10'
    });
    await openNewOrder(window);
    await scanBarcode(window, '8400000000042');
    await expect(window.locator('.order-vat')).toContainText('10 %');
    await expect(window.locator('.order-vat')).toContainText(euros(1));
    await expect(window.locator('.order-vat')).toContainText(euros(0.1));
  } finally {
    await closeApp(app, userData);
  }
});

test('sells a weighed product for 6,48 €', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Deli');
    await createProduct(window, {
      name: 'Ham',
      barcode: '8400000000035',
      price: 18.5,
      basePrice: 10,
      stock: 5,
      stockMin: 1,
      category: 'Deli',
      weighted: true
    });
    await openNewOrder(window);
    await scanBarcode(window, '8400000000035');
    const dialog = window.getByRole('dialog');
    await expect(dialog.getByRole('heading', {name: 'Peso (kg)'})).toBeVisible();
    await dialog.locator('input[name="quantity"]').fill('0.35');
    await dialog.getByRole('button', {name: 'Añadir'}).click();
    await expect(orderRow(window, 'Ham').locator('input')).toHaveValue('0.35');
    await expectSubtotal(window, 'Ham', 6.48);
    await expectOrderTotal(window, 6.48);
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
    const row = window.locator('.rt-tbody .rt-tr').filter({hasText: euros(2)});
    await expect(row).toBeVisible();
    await expect(window.locator('h3')).toHaveText(euros(2));

    await openStartCalendar(window);
    await window.locator('.react-datepicker__navigation--next').click();
    await chooseCalendarDay(window, '15');
    await window.getByRole('button', {name: 'Filter'}).click();
    await expect(window.locator('.rt-tbody').getByText('View', {exact: true})).toHaveCount(0);
    await expect(window.locator('h3')).toHaveText(euros(0));

    await openStartCalendar(window);
    await window.locator('.react-datepicker__navigation--previous').click();
    await chooseCalendarDay(window, '1');
    await window.getByRole('button', {name: 'Filter'}).click();
    await expect(row).toBeVisible();
    await expect(window.locator('h3')).toHaveText(euros(2));

    await row.getByText('View', {exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Pedido'})).toBeVisible();
    await expect(window.locator('input[name="barcode"]')).toHaveCount(0);
    await expect(window.getByRole('button', {name: 'Save'})).toHaveCount(0);
    const quantity = orderRow(window, 'Milk').locator('input');
    await expect(quantity).toHaveValue('1');
    await expect(quantity).toHaveAttribute('readonly', '');
    await expectSubtotal(window, 'Milk', 2);
    await expect(window.getByRole('button', {name: 'Imprimir'})).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('offers the ticket from the saved toast and dismisses it without printing', async () => {
  const {app, window, userData} = await launchApp();
  const pageErrors = [];
  window.on('pageerror', error => pageErrors.push(error.message));
  try {
    await createCategory(window, 'Dairy');
    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000097',
      price: 2,
      basePrice: 1,
      stock: 5,
      stockMin: 1,
      category: 'Dairy'
    });
    await openNewOrder(window);
    await scanBarcode(window, '8400000000097');
    await saveOrder(window);
    await expect(window.getByRole('heading', {name: '¿Imprimir ticket?'})).toHaveCount(0);
    await expect(window.getByRole('button', {name: 'Imprimir ticket'})).toBeVisible();
    await dismissTicket(window);
    await expect(window.getByRole('button', {name: 'Imprimir ticket'})).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  } finally {
    await closeApp(app, userData);
  }
});
