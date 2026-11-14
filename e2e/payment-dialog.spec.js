const path = require('path');
const {test, expect} = require('@playwright/test');
const {root, assertDist, launchApp, closeApp, chooseMenu, scanBarcode} = require('./launch');

const SHOP = {
  categories: ['Shop'],
  products: [{
    name: 'Queso',
    barcode: '8400000001315',
    price: 13.13,
    basePrice: 10,
    stock: 20,
    stockMin: 1,
    category: 'Shop'
  }]
};

const SIZES = [
  {width: 1024, height: 700},
  {width: 1366, height: 768},
  {width: 1920, height: 1080}
];

test.beforeAll(() => {
  assertDist();
});

test('keeps the Cobrar dialog inside the window at every size', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp({shop: SHOP});
  const shots = path.join(root, 'test-results');
  try {
    await chooseMenu(window, 'Orders', 'new Order!');
    await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
    await scanBarcode(window, '8400000001315');
    await expect(window.getByRole('button', {name: /^Cobrar /})).toBeEnabled();

    for (const size of SIZES) {
      await window.setViewportSize(size);
      await window.getByRole('button', {name: /^Cobrar /}).click();
      const dialog = window.getByRole('dialog');
      await expect(dialog.getByRole('heading', {name: /Cobrar/})).toBeVisible();
      await expect(dialog.locator('.checkout-keypad')).toBeVisible();
      await expect(dialog.locator('.payment-notes .om-button').first()).toBeVisible();
      const fit = await measurePayment(window);
      expect(fit.pageOverflow).toBe(false);
      expect(fit.horizontalScroll).toBe(false);
      expect(fit.dialogOutside).toBe(false);
      expect(fit.clipped).toBe(false);
      expect(fit.overlap).toBe(false);
      expect(fit.smallTarget).toBe(false);
      expect(Math.abs(fit.width - fit.expectedWidth)).toBeLessThan(2);
      await window.screenshot({
        path: path.join(shots, `payment-dialog-${size.width}x${size.height}.png`)
      });
      await dialog.getByRole('button', {name: 'Volver', exact: true}).click();
      await expect(dialog).toHaveCount(0);
    }
  } finally {
    await closeApp(app, userData);
  }
});

/**
 * @param {import('@playwright/test').Page} window
 */
async function measurePayment(window) {
  return window.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const space7 = parseFloat(styles.getPropertyValue('--om-space-7'));
    const space9 = parseFloat(styles.getPropertyValue('--om-space-9'));
    const dialog = document.querySelector('.payment-dialog');
    const box = dialog.getBoundingClientRect();
    const page = document.documentElement;
    const keypad = document.querySelector('.checkout-keypad').getBoundingClientRect();
    const quick = document.querySelector('.payment-notes').getBoundingClientRect();
    const targets = Array.from(dialog.querySelectorAll('.checkout-keypad .om-button, .payment-notes .om-button'));
    const separated = keypad.right <= quick.left + 1 || quick.right <= keypad.left + 1
      || keypad.bottom <= quick.top + 1 || quick.bottom <= keypad.top + 1;
    const inside = rect => rect.width > 0 && rect.height > 0
      && rect.left >= box.left - 1 && rect.top >= box.top - 1
      && rect.right <= box.right + 1 && rect.bottom <= box.bottom + 1;
    const horizontalScroll = Array.from(dialog.querySelectorAll('*')).some(node => {
      const style = getComputedStyle(node);
      const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
      return scrolls && node.scrollWidth > node.clientWidth + 1;
    });
    return {
      pageOverflow: page.scrollWidth > page.clientWidth + 1,
      horizontalScroll,
      dialogOutside: box.left < -1 || box.top < -1 || box.right > window.innerWidth + 1 || box.bottom > window.innerHeight + 1,
      clipped: !targets.every(node => inside(node.getBoundingClientRect())) || !inside(keypad) || !inside(quick),
      overlap: !separated,
      smallTarget: targets.some(node => {
        const rect = node.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      }),
      width: box.width,
      expectedWidth: Math.min(space9 * 17, window.innerWidth * 0.9, window.innerWidth - space7)
    };
  });
}
