const path = require('path');
const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp} = require('./launch');

const SCREENS = [
  {link: 'Vender', heading: "Vender", shot: 'vender'},
  {link: 'Pedidos', heading: 'Pedidos', shot: 'pedidos'},
  {link: 'Productos', heading: 'Productos', shot: 'productos'},
  {link: 'Categorías', heading: 'Categorías', shot: 'categorias'},
  {link: 'Informes', heading: 'Most sold', shot: 'informes'},
  {link: 'Plugins', heading: 'Plugins', shot: 'plugins'}
];

test.beforeAll(() => {
  assertDist();
});

test('navigates from the rail with a click or a shortcut', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await expect(window.locator('.header')).toHaveCount(0);
    await expect(window.locator('.app-version')).toHaveCount(0);
    await expect(window.getByRole('heading', {name: 'OpenMarket', exact: true})).toHaveCount(0);
    const mark = window.locator('.nav-rail-mark');
    await expect(mark).toHaveText('OM');
    await expect(mark).toHaveAttribute('aria-label', 'OpenMarket');
    const markBox = await mark.boundingBox();
    const railBox = await window.locator('.nav-rail').boundingBox();
    const mainBox = await window.locator('#main').boundingBox();
    const side = markBox.x - railBox.x;
    const sideRight = railBox.x + railBox.width - (markBox.x + markBox.width);
    expect(mainBox.y).toBeLessThanOrEqual(1);
    expect(markBox.width).toBeGreaterThan(32);
    expect(markBox.width).toBeLessThan(42);
    expect(markBox.height).toBeGreaterThan(32);
    expect(markBox.height).toBeLessThan(42);
    expect(side).toBeGreaterThan(16);
    expect(sideRight).toBeGreaterThan(16);
    expect(markBox.y).toBeGreaterThan(8);
    expect(markBox.y).toBeLessThan(28);
    const fontSize = await mark.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(15);
    expect(fontSize).toBeLessThanOrEqual(17);

    for (const screen of SCREENS) {
      await window.getByRole('link', {name: screen.link, exact: true}).click();
      await expect(window.getByRole('heading', {name: screen.heading})).toBeVisible();
      await expect(window.getByRole('link', {name: screen.link, exact: true})).toHaveAttribute('aria-current', 'page');
      await window.screenshot({path: path.join('test-results', `shell-${screen.shot}.png`)});
    }

    await window.getByRole('link', {name: 'Takings', exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Last 7 days'})).toBeVisible();
    await expect(window.getByRole('link', {name: 'Takings', exact: true})).toHaveAttribute('aria-current', 'page');
    await expect(window.getByRole('link', {name: 'Informes', exact: true})).not.toHaveAttribute('aria-current', 'page');

    await window.getByRole('link', {name: 'Ajustes', exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Ajustes'})).toBeVisible();

    await window.getByRole('link', {name: 'Productos', exact: true}).click();
    const content = await window.locator('#main .container-fluid').evaluate(element => element.getBoundingClientRect().width);
    expect(content).toBeGreaterThan(1250);
    await window.getByRole('link', {name: 'Nuevo producto', exact: true}).click();
    await expect(window.getByRole('heading', {name: 'Nuevo producto', exact: true})).toBeVisible();
    await window.keyboard.press('Escape');
    await expect(window.getByRole('heading', {name: 'Nuevo producto', exact: true})).toHaveCount(0);

    const skip = window.getByRole('link', {name: 'Saltar al contenido'});
    const hiddenBox = await skip.boundingBox();
    expect(hiddenBox == null || hiddenBox.width < 5).toBe(true);
    await window.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await window.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    const shownBox = await skip.boundingBox();
    expect(shownBox.width).toBeGreaterThan(40);
    await window.keyboard.press('Tab');
    const vender = window.getByRole('link', {name: 'Vender', exact: true});
    await expect(vender).toBeFocused();
    const outline = await vender.evaluate(element => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');

    await window.keyboard.press('F2');
    await expect(window.getByRole('heading', {name: "Vender"})).toBeVisible();
    await expect(window.getByRole('link', {name: 'Vender', exact: true})).toHaveAttribute('aria-current', 'page');
  } finally {
    await closeApp(app, userData);
  }
});
