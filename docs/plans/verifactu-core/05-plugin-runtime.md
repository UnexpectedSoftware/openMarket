# 05 — Plugin runtime: process, Node APIs and secrets

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/05-plugin-runtime.md` in OpenMarket. Document and test that plugins run in the renderer with Node APIs (fs, tls, https, crypto) available, add a `secrets` capability to the plugin context backed by Electron `safeStorage` through IPC to the main process, store secret settings encrypted instead of in `plugin_state.config_json`, and bump the plugin `apiVersion` contract docs accordingly. One PR, `Version: minor`.

## Goal
Resolve the plugin plan's open question before plugin phase 4: where plugins run, which Node APIs they can use for mTLS to the AEAT, and how a certificate password is stored safely.

## Findings (master b34f77b)
- `application/index.js` starts `PluginHost` (`infrastructure/plugins/PluginHost.js`), and `application/index.js` is bundled into the **renderer** (`webpack.config.{development,production}.js` → `target: 'electron-renderer'`). So plugins run in the renderer, in the same process as the UI and SQLite.
- `user_interface/main.development.js:84-90`: `nodeIntegration: true`, `contextIsolation: false`, `sandbox: false`. Node built-ins (`fs`, `tls`, `https`, `crypto`) are available to plugins; `infrastructure/plugins/loadPlugin.js` uses `createRequire(entry)`, so plugin code can `require('node:https')` and its own bundled deps.
- Plugin settings are plain text in `plugin_state.config_json` (`infrastructure/plugins/SqlitePluginRepository.js`), shown/edited on `user_interface/plugin/PluginsPage.js`.

## Decision
- **Keep plugins in the renderer for apiVersion 1.** Moving them to main would split SQLite (the sync subscriber must share the sale transaction's connection, which lives in the renderer). mTLS works in the renderer via `https.request({pfx, passphrase})`. Long network calls happen only in durable subscribers, which run after commit and don't block the sale transaction; they must be async (no sync network APIs).
- Revisit (apiVersion 2) when the app moves to `contextIsolation: true` — then core and plugins would move to a utility/main process together with SQLite.

## Secrets
- `safeStorage` is main-process only. Add IPC: main registers `ipcMain.handle('openmarket:secrets:encrypt' | ':decrypt', …)` using `safeStorage.encryptString` / `decryptString` (check `safeStorage.isEncryptionAvailable()`; on Linux without a keyring report "basic" backend via `safeStorage.getSelectedStorageBackend()` and warn on the Plugins page).
- Port `domain/plugin/SecretStore.js` (`put({pluginId, key, value})`, `get({pluginId, key})`, `remove`) — adapter `infrastructure/plugins/SafeStorageSecretStore.js` (renderer side, calls IPC via `ipcRenderer.invoke`, stores ciphertext base64 in a new table `plugin_secret (plugin_id, key, ciphertext, PRIMARY KEY(plugin_id, key))`).
- `plugin.json` settings gain `"secret": true` (e.g. `certificatePassword`). `PluginsPage` renders a password input; the value goes to `SecretStore`, never to `config_json`; `config` passed to `register` excludes secrets.
- Plugin context gains `secrets: {get(key): Promise<string|null>}` scoped to the plugin id (async because of IPC). Document: call it from durable handlers only (never in sync handlers).
- Certificate files stay on disk; only their path is a (non-secret) setting.

## Steps
1. IPC handlers in `user_interface/main.development.js` (or a new `user_interface/main/secretsIpc.js` imported there).
2. `SecretStore` port, adapter, table, container factory `_secretStore()`.
3. `PluginHost`: build `secrets` per plugin; strip `secret` keys from `config`; validate required secret settings exist before enabling (`PluginSettingsIncompleteError`).
4. `PluginsPage`: password inputs for `secret` settings; "stored securely"/"stored with basic encryption" notice.
5. Docs: `docs/plugins.md` — "Where plugins run", "Node APIs", "Secrets" sections; context table adds `secrets`. apiVersion stays 1 (additive).

## Tests
- Unit: `PluginHost` passes `secrets` scoped to the plugin and excludes secret keys from `config`; fake `SecretStore`.
- Unit: `SafeStorageSecretStore` with a fake `ipcRenderer` round-trips and never writes plaintext.
- itest: `plugin_secret` table stores ciphertext only.
- e2e (`e2e/plugins.spec.js`): a fixture plugin with a secret setting can be configured; `config_json` in the DB doesn't contain the value; the plugin reads it via `secrets.get`.
- A fixture plugin test that `require('node:https')` and `require('node:tls')` work inside `register`.

## Acceptance criteria
- Documented decision (renderer, Node APIs available, durable handlers async).
- Secret settings encrypted with `safeStorage`, never in `config_json`, available to plugins via `context.secrets`.
- Tests + typecheck + e2e green.

## Out of scope
Moving core to a utility process, sandboxing plugins, contextIsolation migration.

**Version: minor**
