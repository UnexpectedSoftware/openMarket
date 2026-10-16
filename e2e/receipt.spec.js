const {test, expect} = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  assertDist,
  launchApp,
  closeApp,
  chooseMenu,
  createCategory,
  createProduct,
  scanBarcode
} = require('./launch');

const FAKE_PRINTER = {OPENMARKET_FAKE_PRINTER: '1'};

function installFiscal(userData) {
  const folder = path.join(userData, 'plugins', 'fiscal');
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'plugin.json'), JSON.stringify({
    id: 'fiscal',
    name: 'Fiscal',
    description: 'Prints a QR',
    version: '1.0.0'
  }));
  fs.writeFileSync(path.join(folder, 'index.js'), [
    'module.exports = {',
    '  register({receipt}) {',
    "    receipt.register('receipt.header.fiscal', () => [",
    "      {type: 'text', text: 'QR tributario:', align: 'center'},",
    "      {type: 'qr', data: 'https://aeat.example/qr', sizeMm: 35, correction: 'M'}",
    '    ]);',
    '  }',
    '};',
    ''
  ].join('\n'));
}

async function openNewOrder(window) {
  await chooseMenu(window, 'Orders', 'new Order!');
  await expect(window.getByRole('heading', {name: "Let's create a new order!"})).toBeVisible();
}

test.beforeAll(() => {
  assertDist();
});

test('prints a plugin QR before the shop header', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  installFiscal(userData);
  const first = await launchApp({userData, env: FAKE_PRINTER});
  try {
    await first.window.getByRole('link', {name: 'Plugins'}).click();
    await first.window.getByRole('checkbox', {name: 'Enabled Fiscal'}).click();
    await expect(first.window.getByText('Restart OpenMarket to apply this change.')).toBeVisible();
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const second = await launchApp({userData, env: FAKE_PRINTER});
  try {
    await createCategory(second.window, 'Dairy');
    await createProduct(second.window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 2,
      category: 'Dairy'
    });
    await openNewOrder(second.window);
    await scanBarcode(second.window, '8400000000011');
    await second.window.locator('h3 a.button', {hasText: 'Save'}).click();
    await expect(second.window.getByRole('heading', {name: 'Do you want a ticket?!'})).toBeVisible();
    await second.window.getByRole('button', {name: 'YES!'}).click();
    const logFile = path.join(userData, 'printer-log.jsonl');
    await expect.poll(() => fs.existsSync(logFile)).toBe(true);
    const calls = fs.readFileSync(logFile, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    const legend = calls.findIndex(call => call.name === 'println' && call.args[0] === 'QR tributario:');
    const qr = calls.findIndex(call => call.name === 'printQR');
    const date = calls.findIndex(call => call.name === 'println' && String(call.args[0]).indexOf('Date ') === 0);
    expect(legend).toBeGreaterThan(-1);
    expect(qr).toBeGreaterThan(legend);
    expect(date).toBeGreaterThan(qr);
    expect(calls[qr].args[1].correction).toBe('M');
  } finally {
    await closeApp(second.app, userData);
  }
});
