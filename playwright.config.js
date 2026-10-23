const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list'
});
