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
    await first.window.getByRole('textbox', {name: 'Teléfono'}).fill('600111222');
    await first.window.getByRole('textbox', {name: 'Correo'}).fill('perez@example.com');
    await first.window.getByRole('button', {name: 'Guardar', exact: true}).click();
    await expect(first.window.getByText('Ajustes guardados').first()).toBeVisible();
    await first.window.screenshot({path: path.join('test-results', 'settings-1366x768.png')});
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const second = await launchApp({userData});
  try {
    await second.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(second.window.getByRole('textbox', {name: 'NIF'})).toHaveValue('B12345674');
    await expect(second.window.getByRole('textbox', {name: 'Razón social'})).toHaveValue('Ultramarinos Pérez SL');
    await expect(second.window.getByRole('textbox', {name: 'Teléfono'})).toHaveValue('600111222');
    await expect(second.window.getByRole('textbox', {name: 'Correo'})).toHaveValue('perez@example.com');
    await chooseMenu(second.window, 'Orders', 'new Order!');
    await expect(second.window.locator('.om-page-header-subtitle')).toContainText('NIF B12345674');
  } finally {
    await closeApp(second.app, userData);
  }
});

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test('screenshots the settings page in the four themes', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  const session = await launchApp({userData});
  const after = path.join(__dirname, '..', 'docs', 'design', 'after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await session.window.setViewportSize({width: 1366, height: 768});
    await session.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(session.window.getByRole('heading', {name: 'Ajustes'})).toBeVisible();
    await expect(session.window.getByRole('heading', {name: 'Comercio'})).toBeVisible();
    await expect(session.window.getByRole('heading', {name: 'Apariencia'})).toBeVisible();
    for (const theme of THEMES) {
      await session.window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => session.window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await session.window.screenshot({path: path.join(after, `settings-${theme}.png`)});
    }
  } finally {
    await closeApp(session.app, userData);
  }
});
