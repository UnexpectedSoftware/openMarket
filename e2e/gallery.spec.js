const path = require('path');
const {test, expect} = require('@playwright/test');
const {assertDist, launchApp, closeApp} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test.beforeAll(() => {
  assertDist();
});

test('screenshots every theme and keeps dialog focus inside', async () => {
  const {app, window, userData} = await launchApp({env: {OPENMARKET_GALLERY: '1'}});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await window.evaluate(() => {
      window.location.hash = '/gallery';
    });
    await expect(window.getByRole('heading', {name: 'Component gallery'})).toBeVisible();

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join('test-results', `gallery-${theme}.png`)});
    }

    const buttons = window.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      expect(box, `button ${index}`).not.toBeNull();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    await window.getByRole('button', {name: 'Open dialog'}).click();
    const dialog = window.getByRole('dialog');
    await expect(dialog.getByRole('heading', {name: 'Example dialog'})).toBeVisible();
    await window.keyboard.press('Tab');
    const focused = await window.evaluate(() => {
      const active = document.activeElement;
      const panel = document.querySelector('[role="dialog"]');
      return !!(active && panel && panel.contains(active));
    });
    expect(focused).toBe(true);
    await window.keyboard.press('Escape');
    await expect(window.getByRole('heading', {name: 'Example dialog'})).toHaveCount(0);
  } finally {
    await closeApp(app, userData);
  }
});
