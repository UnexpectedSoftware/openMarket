const {test, expect} = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {assertDist, launchApp, closeApp, chooseMenu} = require('./launch');

test.beforeAll(() => {
  assertDist();
});

test('saves the shop and shows its NIF on a new order', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  const first = await launchApp({userData});
  try {
    await first.window.setViewportSize({width: 1366, height: 768});
    await first.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(first.window.getByRole('heading', {name: 'Comercio'})).toBeVisible();
    await first.window.getByRole('textbox', {name: 'NIF'}).fill('B12345674');
    await first.window.getByRole('textbox', {name: 'Razón social'}).fill('Ultramarinos Pérez SL');
    await first.window.getByRole('textbox', {name: 'Nombre comercial'}).fill('Ultramarinos Pérez');
    await first.window.getByRole('button', {name: 'Save'}).click();
    await expect(first.window.getByRole('status')).toHaveText('Shop saved');
    await first.window.screenshot({path: path.join('test-results', 'settings-1366x768.png')});
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const second = await launchApp({userData});
  try {
    await second.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(second.window.getByRole('textbox', {name: 'NIF'})).toHaveValue('B12345674');
    await expect(second.window.getByRole('textbox', {name: 'Razón social'})).toHaveValue('Ultramarinos Pérez SL');
    await chooseMenu(second.window, 'Orders', 'new Order!');
    await expect(second.window.locator('.shop-issuer')).toContainText('NIF B12345674');
  } finally {
    await closeApp(second.app, userData);
  }
});
