// Renders the A-plugins-* mockups to PNG with headless Chromium, then plugins.py's list.
// NODE_PATH must reach playwright-core (any OpenMarket checkout with node_modules).
// Usage: python3 plugins.py && node render-plugins.js [outDir]  (writes PNG; the repo keeps WebP copies in ..)
const path = require('path');
const fs = require('fs');
const {chromium} = require('playwright-core');
(async () => {
  const out = process.argv[2] || path.resolve(__dirname, '..');
  const shots = JSON.parse(fs.readFileSync(path.join(__dirname, 'plugins-shots.json'), 'utf8'));
  const browser = await chromium.launch({executablePath: process.env.CHROME || '/usr/bin/google-chrome'});
  for (const [name, width, height] of shots) {
    const page = await browser.newPage({viewport: {width, height}});
    await page.goto('file://' + path.join(__dirname, name + '.html'));
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth
      || [...document.querySelectorAll('.main *')].some(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible'));
    await page.screenshot({path: path.join(out, name + '.png')});
    console.log(name, width + 'x' + height, overflow ? 'HORIZONTAL OVERFLOW' : 'ok');
    await page.close();
  }
  await browser.close();
})();
