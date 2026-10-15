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

function installSecret(userData) {
  const folder = path.join(userData, 'plugins', 'secret');
  fs.mkdirSync(folder, {recursive: true});
  fs.writeFileSync(path.join(folder, 'plugin.json'), JSON.stringify({
    id: 'secret',
    name: 'Secret',
    description: 'Reads a password',
    version: '1.0.0',
    settings: [{key: 'certificatePassword', label: 'Certificate password', secret: true, required: true}]
  }));
  fs.writeFileSync(path.join(folder, 'index.js'), [
    "const fs = require('fs');",
    "const path = require('path');",
    "const https = require('node:https');",
    "const tls = require('node:tls');",
    'module.exports = {',
    '  register({config, secrets}) {',
    "    secrets.get('certificatePassword').then(value => {",
    "      fs.writeFileSync(path.join(__dirname, 'secret.txt'), JSON.stringify({",
    '        value,',
    "        https: typeof https.request,",
    "        tls: typeof tls.connect,",
    '        configKeys: Object.keys(config)',
    '      }));',
    '    }, error => {',
    "      fs.writeFileSync(path.join(__dirname, 'secret.txt'), JSON.stringify({error: String(error)}));",
    '    });',
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

test('stores a plugin secret outside config and lets the plugin read it', async () => {
  const {DatabaseSync} = require('node:sqlite');
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-ui-'));
  installSecret(userData);
  const marker = path.join(userData, 'plugins', 'secret', 'secret.txt');
  const first = await launchApp({userData});
  try {
    await first.window.getByRole('link', {name: 'Plugins'}).click();
    await expect(first.window.getByRole('heading', {name: 'Secret'})).toBeVisible();
    await first.window.getByRole('textbox', {name: 'Certificate password'}).fill('s3cret');
    await first.window.getByRole('checkbox', {name: 'Enabled Secret'}).click();
    await expect(first.window.getByText('Restart OpenMarket to apply this change.')).toBeVisible();
  } finally {
    await closeApp(first.app, userData, {keep: true});
  }

  const database = new DatabaseSync(path.join(userData, 'openmarket.sqlite'));
  const config = database.prepare('SELECT config_json AS configJson FROM plugin_state WHERE plugin_id = ?').get('secret');
  const secret = database.prepare('SELECT ciphertext FROM plugin_secret WHERE plugin_id = ? AND key = ?')
    .get('secret', 'certificatePassword');
  expect(config.configJson).not.toContain('s3cret');
  expect(secret.ciphertext).not.toContain('s3cret');
  database.close();

  const second = await launchApp({userData});
  try {
    await expect.poll(() => fs.existsSync(marker), {timeout: 8000}).toBe(true);
    const read = JSON.parse(fs.readFileSync(marker, 'utf8'));
    expect(read.value).toBe('s3cret');
    expect(read.https).toBe('function');
    expect(read.tls).toBe('function');
    expect(read.configKeys).not.toContain('certificatePassword');
  } finally {
    await closeApp(second.app, userData);
  }
});
