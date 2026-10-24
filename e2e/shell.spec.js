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
    await expect(window.getByRole('heading', {name: 'Settings'})).toBeVisible();

    await window.getByRole('link', {name: 'Productos', exact: true}).click();
    const content = await window.locator('#main .container-fluid').evaluate(element => element.getBoundingClientRect().width);
    expect(content).toBeGreaterThan(1250);
    await window.getByRole('link', {name: 'Nuevo producto', exact: true}).click();
    await expect(window.getByRole('heading', {name: "Let's create a new product!"})).toBeVisible();

    await window.locator('.header').click({position: {x: 700, y: 20}});
    await window.keyboard.press('Tab');
    await expect(window.getByRole('link', {name: 'Saltar al contenido'})).toBeFocused();
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
