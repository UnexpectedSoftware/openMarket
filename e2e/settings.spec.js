const {test, expect} = require('@playwright/test');
const {DatabaseSync} = require('node:sqlite');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {assertDist, launchApp, closeApp, chooseMenu} = require('./launch');

const FAKE_PRINTER = {OPENMARKET_FAKE_PRINTER: '1'};

function storedLocale(userData) {
  const database = new DatabaseSync(path.join(userData, 'openmarket.sqlite'), {readOnly: true});
  try {
    const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('language');
    if (!row) {
      return 'es';
    }
    return JSON.parse(row.value_json).locale;
  } finally {
    database.close();
  }
}

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
    await expect(first.window.locator('.nav-rail-mark')).toHaveText('UP');
    await expect(first.window.locator('.nav-rail-mark')).toHaveAttribute('aria-label', 'Ultramarinos Pérez');
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
    await expect(second.window.locator('.nav-rail-mark')).toHaveText('UP');
    await chooseMenu(second.window, 'Orders', 'new Order!');
    await expect(second.window.locator('.om-page-header-subtitle')).toContainText('NIF B12345674');
  } finally {
    await closeApp(second.app, userData);
  }
});

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test('saves the printer, prints a sample, and keeps Español', async () => {
  test.setTimeout(90000);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  const first = await launchApp({userData, env: FAKE_PRINTER});
  try {
    await first.window.setViewportSize({width: 1366, height: 768});
    await first.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(first.window.getByRole('heading', {name: 'Impresora'})).toBeVisible();
    await first.window.getByRole('textbox', {name: 'Nombre comercial'}).fill('Ultramarinos Pérez');
    await first.window.getByRole('combobox', {name: 'Tipo'}).selectOption({label: 'Star'});
    await first.window.getByRole('textbox', {name: 'Interfaz'}).fill('tcp://127.0.0.1:9100');
    await first.window.getByRole('button', {name: 'Guardar', exact: true}).click();
    await expect(first.window.getByText('Ajustes guardados').first()).toBeVisible();
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const second = await launchApp({userData, env: FAKE_PRINTER});
  const logFile = path.join(userData, 'printer-log.jsonl');
  try {
    await second.window.setViewportSize({width: 1366, height: 768});
    await second.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(second.window.getByRole('combobox', {name: 'Tipo'})).toHaveValue('star');
    await expect(second.window.getByRole('textbox', {name: 'Interfaz'})).toHaveValue('tcp://127.0.0.1:9100');
    await expect(second.window.getByRole('combobox', {name: 'Idioma'})).toHaveValue('es');
    await expect(second.window.locator('#language-locale option')).toHaveText('Español');
    expect(storedLocale(userData)).toBe('es');
    await expect.poll(() => second.window.evaluate(() => document.documentElement.dataset.theme)).toBe('mercado');
    const after = path.join(__dirname, '..', 'docs', 'design', 'after');
    fs.mkdirSync(after, {recursive: true});
    await second.window.screenshot({
      path: path.join(after, 'settings-printer-mercado.png'),
      fullPage: true
    });
    await second.window.getByRole('button', {name: 'Imprimir prueba'}).click();
    await expect.poll(() => fs.existsSync(logFile) && fs.readFileSync(logFile, 'utf8')).toContain('Prueba de impresión');
    const log = fs.readFileSync(logFile, 'utf8');
    expect(log).toContain('Ultramarinos Pérez');
    expect(log).toContain('Prueba de impresión');
  } finally {
    await closeApp(second.app, userData);
  }
});

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
