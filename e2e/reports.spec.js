const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp} = require('./launch');

const DAY = 24 * 60 * 60;

function madridDay(daysAgo) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(Date.now() - daysAgo * DAY * 1000));
}

function order(daysAgo) {
  return {
    secondsAgo: daysAgo * DAY,
    lines: [{name: 'Milk', barcode: '8400000000318', price: 1, quantity: 1}]
  };
}

const SHOP = {
  categories: ['Dairy'],
  products: [{
    name: 'Milk',
    barcode: '8400000000318',
    price: 1,
    basePrice: 1,
    stock: 20,
    stockMin: 1,
    category: 'Dairy'
  }],
  orders: [200, 60, 44, 29, 6, 0].map(order)
};

test.beforeAll(() => {
  assertDist();
});

test('keeps the sales chart inside the card at every window', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp({shop: SHOP});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await window.getByRole('heading', {name: 'Vender'}).waitFor();
    await window.getByRole('link', {name: /^Informes\b/}).click();
    await window.getByRole('heading', {name: 'Resumen', exact: true}).waitFor();
    await expect(window.locator('.report-chart-card .om-card-title')).toHaveText('Ventas por día');
    await expect(window.locator('.report-column')).toHaveCount(7);
    await expectFits(window);

    await pickPreset(window, 'Hoy');
    await expect(window.locator('.report-column')).toHaveCount(1);
    await expectFits(window);

    await pickPreset(window, '30 días');
    await expect(window.locator('.report-column')).toHaveCount(30);
    await expectFits(window);

    await pickPreset(window, '7 días');
    await expect(window.locator('.report-column')).toHaveCount(7);
    await expectFits(window);

    await window.setViewportSize({width: 1024, height: 700});
    await pickCustom(window, madridDay(44), madridDay(0));
    await expect(window.locator('.report-chart-card .om-card-title')).toHaveText('Ventas por día');
    await expect(window.locator('.report-column')).toHaveCount(45);
    await expectFits(window);

    await pickCustom(window, madridDay(60), madridDay(0));
    await expect(window.locator('.report-chart-card .om-card-title')).toHaveText('Ventas por semana');
    await expectFits(window);

    await pickCustom(window, madridDay(90), madridDay(0));
    await expect(window.locator('.report-chart-note')).toContainText('Sin ventas antes del');
    await expectFits(window);

    await pickCustom(window, madridDay(200), madridDay(0));
    await expect(window.locator('.report-chart-card .om-card-title')).toHaveText('Ventas por mes');
    await expectFits(window);

    await window.setViewportSize({width: 1920, height: 1080});
    await pickPreset(window, 'Hoy');
    await expect(window.locator('.report-column')).toHaveCount(1);
    const ratio = await window.evaluate(() => {
      const card = document.querySelector('.report-chart-card').getBoundingClientRect();
      const column = document.querySelector('.report-column').getBoundingClientRect();
      return column.width / card.width;
    });
    expect(ratio).toBeLessThan(0.5);
    await expectFits(window);
  } finally {
    await closeApp(app, userData);
  }
});

/**
 * @param {import('@playwright/test').Page} window
 * @param {string} label
 */
async function pickPreset(window, label) {
  const previous = await window.locator('.om-page-header-subtitle').innerText();
  await window.getByRole('button', {name: label, exact: true}).click();
  await subtitleChanged(window, previous);
}

/**
 * @param {import('@playwright/test').Page} window
 * @param {string} from
 * @param {string} to
 */
async function pickCustom(window, from, to) {
  const previous = await window.locator('.om-page-header-subtitle').innerText();
  await window.getByRole('button', {name: 'Personalizado', exact: true}).click();
  const dialog = window.getByRole('dialog');
  await dialog.locator('#report-range-from').fill(from);
  await dialog.locator('#report-range-to').fill(to);
  await dialog.getByRole('button', {name: 'Aplicar', exact: true}).click();
  await subtitleChanged(window, previous);
}

/**
 * @param {import('@playwright/test').Page} window
 * @param {string} previous
 */
async function subtitleChanged(window, previous) {
  await window.waitForFunction(text => {
    const node = document.querySelector('.om-page-header-subtitle');
    return node && node.textContent && node.textContent !== text;
  }, previous);
  await expect(window.locator('.report-body')).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} window
 */
async function expectFits(window) {
  const overflow = await window.evaluate(() => {
    const page = document.documentElement;
    const pageOverflow = page.scrollWidth > page.clientWidth;
    const bar = Array.from(document.querySelectorAll('body *')).some(node => {
      const style = window.getComputedStyle(node);
      const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
      return scrolls && node.scrollWidth > node.clientWidth;
    });
    return pageOverflow || bar;
  });
  expect(overflow).toBe(false);
}
