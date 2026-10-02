const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 90000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list'
});
