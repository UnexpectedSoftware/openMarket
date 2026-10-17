const path = require('path');
const fs = require('fs');
const os = require('os');
const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp} = require('./launch');

const THEMES = [
  {id: 'mercado', name: 'Mercado'},
  {id: 'mostrador-noche', name: 'Mostrador Noche'},
  {id: 'ultramarinos', name: 'Ultramarinos'},
  {id: 'unexpected-neon', name: 'Unexpected Neon'}
];

const SCREENS = [
  {link: 'Vender', heading: "Let's create a new order!", shot: 'vender'},
  {link: 'Pedidos', heading: 'List Order!', shot: 'pedidos'},
  {link: 'Productos', heading: 'List Products', shot: 'productos'},
  {link: 'Categorías', heading: 'Categories', shot: 'categorias'},
  {link: 'Informes', heading: 'Most sold', shot: 'informes'},
  {link: 'Ajustes', heading: 'Settings', shot: 'ajustes'}
];

test.beforeAll(() => {
  assertDist();
});

test('each theme persists and is applied before the first paint', async () => {
  test.setTimeout(240000);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  let mercadoBackground = '';
  let nocheBackground = '';

  try {
    for (const theme of THEMES) {
      const session = await launchApp({userData});
      try {
        await session.window.setViewportSize({width: 1366, height: 768});
        await session.window.getByRole('link', {name: 'Ajustes', exact: true}).click();
        await expect(session.window.getByRole('heading', {name: 'Apariencia'})).toBeVisible();
        await session.window.getByRole('radio', {name: theme.name, exact: true}).click();
        await session.window.getByRole('button', {name: 'Guardar', exact: true}).click();
        await expect(session.window.getByText('Tema guardado').first()).toBeVisible();
      } finally {
        await closeApp(session.app, userData, {keep: true});
      }

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
        for (const screen of SCREENS) {
          await restarted.window.getByRole('link', {name: screen.link, exact: true}).click();
          await expect(restarted.window.getByRole('heading', {name: screen.heading})).toBeVisible();
          await restarted.window.screenshot({
            path: path.join('test-results', `theme-${theme.id}-${screen.shot}.png`)
          });
        }
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
