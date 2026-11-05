const path = require('path');
const fs = require('fs');
const os = require('os');
const {DatabaseSync} = require('node:sqlite');
const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp, seedTheme} = require('./launch');

function storedTheme(userData) {
  const database = new DatabaseSync(path.join(userData, 'openmarket.sqlite'), {
    readOnly: true,
    timeout: 5000
  });
  try {
    const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('appearance');
    return row ? JSON.parse(row.value_json).theme : null;
  } finally {
    database.close();
  }
}

const THEMES = [
  {id: 'mercado', name: 'Mercado'},
  {id: 'mostrador-noche', name: 'Mostrador Noche'},
  {id: 'ultramarinos', name: 'Ultramarinos'},
  {id: 'unexpected-neon', name: 'Unexpected Neon'}
];

test.beforeAll(() => {
  assertDist();
});

test('a saved theme stays after leaving Settings', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  const session = await launchApp({userData});
  try {
    await session.window.setViewportSize({width: 1366, height: 768});
    await session.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await session.window.getByRole('radio', {name: 'Mostrador Noche', exact: true}).click();
    await expect.poll(() => session.window.evaluate(() => document.documentElement.dataset.theme))
      .toBe('mostrador-noche');
    await session.window.getByRole('button', {name: 'Guardar', exact: true}).click();
    await expect(session.window.getByText('Ajustes guardados').first()).toBeVisible();

    await session.window.getByRole('link', {name: 'Vender', exact: true}).click();
    await expect(session.window.getByRole('heading', {name: "Vender"})).toBeVisible();
    await expect.poll(() => session.window.evaluate(() => document.documentElement.dataset.theme))
      .toBe('mostrador-noche');

    await session.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(session.window.getByRole('radio', {name: 'Mostrador Noche', exact: true}))
      .toHaveAttribute('aria-checked', 'true');

    expect(storedTheme(userData)).toBe('mostrador-noche');
  } finally {
    await closeApp(session.app, userData);
  }
});

test('the shop Save confirmation keeps the theme after leaving Settings', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  const session = await launchApp({userData});
  try {
    await session.window.setViewportSize({width: 1366, height: 768});
    await session.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(session.window.getByRole('heading', {name: 'Comercio'})).toBeVisible();
    await session.window.getByRole('radio', {name: 'Mostrador Noche', exact: true}).click();
    await expect.poll(() => session.window.evaluate(() => document.documentElement.dataset.theme))
      .toBe('mostrador-noche');

    await session.window.getByRole('button', {name: 'Guardar', exact: true}).click();
    await expect(session.window.getByText('Ajustes guardados').first()).toBeVisible();

    await session.window.getByRole('link', {name: 'Vender', exact: true}).click();
    await expect(session.window.getByRole('heading', {name: "Vender"})).toBeVisible();
    await expect.poll(() => session.window.evaluate(() => document.documentElement.dataset.theme))
      .toBe('mostrador-noche');
    expect(storedTheme(userData)).toBe('mostrador-noche');
  } finally {
    await closeApp(session.app, userData, {keep: true});
  }

  const restarted = await launchApp({userData});
  try {
    await restarted.window.waitForURL(/app\.html/, {waitUntil: 'domcontentloaded'});
    await expect.poll(() => restarted.window.evaluate(() => document.documentElement.dataset.theme))
      .toBe('mostrador-noche');
    await restarted.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(restarted.window.getByRole('radio', {name: 'Mostrador Noche', exact: true}))
      .toHaveAttribute('aria-checked', 'true');
  } finally {
    await closeApp(restarted.app, userData);
  }
});

test('each theme persists and is applied before the first paint', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  let mercadoBackground = '';
  let nocheBackground = '';

  try {
    for (const theme of THEMES) {
      await seedTheme(userData, theme.id);
      const restarted = await launchApp({userData});
      try {
        // firstWindow() can still be about:blank. The app document's
        // DOMContentLoaded is after the blocking bundle, which sets data-theme.
        await restarted.window.waitForURL(/app\.html/, {waitUntil: 'domcontentloaded'});
        const paint = await restarted.window.evaluate(() => ({
          theme: document.documentElement.dataset.theme || '',
          readyState: document.readyState
        }));
        expect(paint.readyState).not.toBe('loading');
        expect(paint.theme).toBe(theme.id);
        await restarted.window.waitForLoadState('load');
        const background = await restarted.window.evaluate(
          () => getComputedStyle(document.body).backgroundColor
        );
        if (theme.id === 'mercado') {
          mercadoBackground = background;
        }
        if (theme.id === 'mostrador-noche') {
          nocheBackground = background;
        }

        await restarted.window.setViewportSize({width: 1366, height: 768});
        await restarted.window.getByRole('link', {name: 'Vender', exact: true}).click();
        await expect(restarted.window.getByRole('heading', {name: 'Vender'})).toBeVisible();
      } finally {
        await closeApp(restarted.app, userData, {keep: true});
      }
    }
  } finally {
    fs.rmSync(userData, {recursive: true, force: true});
  }

  expect(mercadoBackground).not.toBe('');
  expect(nocheBackground).not.toBe(mercadoBackground);
});
