const {test, expect} = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {assertDist, launchApp, closeApp} = require('./launch');

function installSample(userData) {
  const folder = path.join(userData, 'plugins', 'sample');
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'plugin.json'), JSON.stringify({
    id: 'sample',
    name: 'Sample',
    description: 'A fixture plugin',
    version: '1.0.0'
  }));
  fs.writeFileSync(path.join(folder, 'index.js'), [
    "const fs = require('fs');",
    "const path = require('path');",
    'module.exports = {',
    '  register() {',
    "    fs.writeFileSync(path.join(__dirname, 'loaded.txt'), 'ok');",
    '  }',
    '};',
    ''
  ].join('\n'));
}

test.beforeAll(() => {
  assertDist();
});

test('lists a dropped plugin and loads it after a restart', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  installSample(userData);
  const marker = path.join(userData, 'plugins', 'sample', 'loaded.txt');
  const first = await launchApp({userData});
  try {
    await first.window.getByRole('link', {name: 'Plugins'}).click();
    await expect(first.window.getByRole('heading', {name: 'Sample'})).toBeVisible();
    await expect(first.window.getByText('A fixture plugin')).toBeVisible();
    expect(fs.existsSync(marker)).toBe(false);
    await first.window.getByRole('checkbox', {name: 'Enabled Sample'}).click();
    await expect(first.window.getByText('Restart OpenMarket to apply this change.')).toBeVisible();
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const second = await launchApp({userData});
  try {
    await expect.poll(() => fs.existsSync(marker)).toBe(true);
    expect(fs.readFileSync(marker, 'utf8')).toBe('ok');
    await second.window.getByRole('link', {name: 'Plugins'}).click();
    const checkbox = second.window.getByRole('checkbox', {name: 'Enabled Sample'});
    await expect(checkbox).toBeChecked();
    second.window.once('dialog', dialog => {
      expect(dialog.message()).toContain('Disable Sample?');
      return dialog.dismiss();
    });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  } finally {
    await closeApp(second.app, userData);
  }
});
