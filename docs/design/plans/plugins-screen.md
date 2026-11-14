# Plugins screen (plan)

> Status: planned. Docs only; this plan and its mockups carry `Version: none`.
> Mockups: `mockups/A-plugins-empty`, `A-plugins-list`, `A-plugins-list-compact` (1024×700), `A-plugins-list-mostrador-noche`, `A-plugins-needs-setup`, `A-plugins-detail`, `A-plugins-errors`. Source: `mockups/src/plugins.py` (tokens only, from `themes/all-themes.css`); render with `node mockups/src/render-plugins.js`.
> Load `openmarket-design` and `pos-layout` before any UI chunk, and run `ui-review` before opening the PR. Backend chunks follow `openmarket-architecture`.
> Related: #105 (named UI slots, `settings.section`), #103 (Verifactu plugin UI), #74 (Playwright flakiness), OM-25 #88 (Spanish copy).

Anything tagged **nuevo** in the mockups needs data or an action the host does not have today. Every other field is already in `ListPlugins` or `plugin.json`.

## What exists today (verified on master 63cb394)

- Route `/plugins` → `user_interface/plugin/ReduxConnector.js` → `PluginsPage.js`. English copy: "Copy a plugin folder into …, then restart OpenMarket.", "No plugins are installed.", "Enabled", "Save", "Stored", "Restart OpenMarket to apply this change.", a `window.confirm` on disable.
- **Discovery** (`FolderPluginSource`): one child folder per plugin, `plugin.json` read, `index.js` not run. Kept fields: `id` (must equal the folder name, `^[a-z][a-z0-9-]*$`), `name`, `description`, `version`, `openmarket` (range or null), `main` (must stay inside the folder), `settings[]` as `{key, label, required, secret}`. Any other field is dropped. A bad manifest (missing file, bad JSON, id ≠ folder, `main` escaping) is **skipped silently**. An unreadable directory lists as empty.
- **Read** (`ListPlugins.list()`): `{directory, encryption: {available, backend}, plugins: [{id, name, description, version, settings, storedSecrets, enabled, config (no secrets), lastError}]}`. It does **not** return `openmarket`, and it has no status.
- **Write** (`SavePlugin.save({pluginId, enabled, config})`): splits secrets from config, writes secrets to `SecretStore`, refuses enabling with a blank required setting (`PluginSettingsIncompleteError`, `PLUGIN_SETTINGS_INCOMPLETE`, `context.keys`), stores `enabled`, `config`, `lastError: null`. It does not check the range, so an incompatible plugin can be "enabled".
- **Start** (`PluginHost.start()`, once per app start): for each manifest, range check (`PluginIncompatibleError`, stored as `lastError` even when disabled) → skip disabled → required **secret** settings check (`PluginSettingsIncompleteError`; required public settings are not rechecked at start) → `loadPlugin` + `register(context)`; a throw is stored as `lastError` (e.g. `Plugin must export register`). `lastError` is the English `error.message`, **no code**. `apiVersion` (`1`) is passed to the plugin; `plugin.json` has no `apiVersion` field and the host checks none.
- **Context:** `eventBus.subscribeSync / subscribeDurable / ofType`, `connection`, `config`, `secrets.get`, `receipt.register` (`receipt.header.fiscal`, `receipt.footer`), `events`. Subscriptions are tracked in a local `undo` list only, so nobody can ask "what does this plugin use".
- **Restart:** `restartRequired` is a renderer flag set after any save. No relaunch action. No IPC to open the folder (`main.development.js` only has `shell.openExternal`).
- **Secrets:** `encryption.backend === 'basic_text'` or `available === false` shows "Secrets are stored with basic encryption".
- `PluginSlot.js` renders nothing (#105 open).
- Verifactu `plugin.json` (0.1.0, `>=1.22.0 <2`): `environment` (free text "pruebas | produccion"), `nif`, `softwareId`, `certificatePath` required; `certificatePassword` secret, not required. Labels are English. Phase 1 registers sync `InvoiceIssued`/`InvoiceCancelled` and durable `verifactu:send`/`verifactu:send-cancellation`; no receipt slot yet.

## Statuses

One status per plugin, computed in one place (P1), in this order:

| Status | Badge | Rule | Host data |
|---|---|---|---|
| Incompatible | `⊘ Incompatible` (danger) | range set and does not include the app version, or the range is invalid | manifest + app version (exists) |
| Necesita configuración | `⚠ Necesita configuración` (warning) | a required setting is blank in `config` and, for secrets, not in `storedSecrets` | manifest + state (exists) |
| Error de carga | `✕ Error de carga` (danger) | enabled and `lastError` set and none of the above | `lastError` (exists, text only) |
| Activo | `✓ Activo` (success) | enabled, no error | exists |
| Desactivado | `○ Desactivado` (muted) | not enabled | exists |
| Se activa / se desactiva al reiniciar | `↻` (warning) | stored `enabled` ≠ loaded this session | **nuevo** (P4) |

Badges carry an icon and text, never colour alone. Warning has no soft token, so its badge is a `--om-color-warning` outline on `--om-color-surface`. No new tokens.

## Chunks

Each chunk is one PR, branched from master, smallest first. P1–P3 do not depend on each other except where noted.

### P1 — plugin list read model with statuses (application + domain; small host change)

- `domain/plugin/pluginStatus.js`, pure: `pluginStatus({manifest, state, storedSecrets, compatibility})` → `{status, missingSettings: [{key, label}]}`. `missingSettings(manifest, config, storedSecrets)` is its own exported function.
- Move `openMarketCompatibility` from `infrastructure/plugins/semverRange.js` to `domain/plugin/` (it is pure) so `ListPlugins` can use it without importing infrastructure. Inject `appVersion` into `ListPlugins` from the container.
- `ListPlugins` adds `openmarket`, `status`, `missingSettings` and `appVersion` to each item / the page. Nothing else changes.
- `PluginHost._startOne` and `SavePlugin` call the same `missingSettings` (host change: the start check now covers required public settings too, so a manifest update that adds a required field shows "Necesita configuración" instead of loading half-configured).
- **Acceptance:** unit tests for every row of the status table, including invalid range and a stored secret that satisfies a required secret; `ListPlugins` spec with a fake source/repository; architecture test still passes (no application → infrastructure import); mutation clean on the new domain files. `Version: none`.

### P2 — list and empty state in Spanish (UI only, needs P1)

- Mockups `A-plugins-empty`, `A-plugins-list`, `A-plugins-list-compact`, `A-plugins-needs-setup`.
- `PageHeader` "Plugins" + "Amplían OpenMarket. Se cargan al iniciar la aplicación." One card per plugin: icon well, name, `v{version}`, status badge, description, a chip `OpenMarket {range}` (or "Cualquier versión" when null), enable switch on the right (≥ 44 px), "Ajustes" button when the plugin has settings.
- "Necesita configuración": the switch is disabled and the card lists `missingSettings` labels plus a primary "Configurar {name} →" (opens the inline form today; P5 makes it the detail route).
- Empty state: "Aún no hay plugins instalados", three numbered steps, the real `directory` in mono, the trust note. Encryption line becomes a banner: "Las contraseñas de los plugins se guardan cifradas en este equipo." / "… con cifrado básico en este equipo."
- Disable confirm in Spanish ("¿Desactivar {name}? Algunos plugins son obligatorios por ley. Deja de ejecutarse al reiniciar.").
- Keep the current inline settings form until P5. CSS: tokens only, cards `min-width: 0`, chips wrap, no horizontal scroll at 1024×700.
- **Acceptance:** Playwright at 1024×700 and 1366×768: empty state shows the directory; a fixture plugin with a blank required setting shows "Necesita configuración", lists the label and has the switch disabled; `scrollWidth <= clientWidth`. Screenshots in Mercado and Mostrador Noche. `Version: minor` (visible change).

### P3 — "Abrir carpeta de plugins" (main process; host change)

- Main-process IPC `plugins:open-directory` → `shell.openPath(pluginDirectory())`; the renderer never passes a path. Returns the error string from `openPath` when it fails, shown inline under the button.
- Button in the header (list) and as the primary action of the empty state; "Copiar ruta" (`clipboard.writeText(directory)`) as a ghost button in the empty state.
- **Acceptance:** unit test for the IPC handler with a fake `shell` (path comes from `pluginDirectory`, not the message); Playwright stubs the IPC and asserts the call. `Version: none` (or ride with P2).

### P4 — enable/disable that says when it applies (host change)

- `PluginHost` records the ids it loaded this session in memory and exposes them through a small port (`PluginRuntime.loaded(): string[]`) that `ListPlugins` reads. Status "Se activa al reiniciar" / "Se desactiva al reiniciar" when stored `enabled` differs from loaded. The page banner is derived from that (no renderer `restartRequired` flag), so it survives navigation and disappears after a restart.
- `SavePlugin` refuses `enabled: true` for an incompatible plugin (`PluginIncompatibleError`), so the switch is disabled with "No se puede activar".
- Optional, behind its own button: "Reiniciar ahora" through an IPC that calls `app.relaunch(); app.exit(0)`. Only when no sale is open; otherwise hide it.
- **Acceptance:** itest: enable → list says restart pending → new host start → Activo. Unit: incompatible enable refused. Playwright for the banner. `Version: minor`.

### P5 — plugin detail and settings view (UI; no host change)

- Mockup `A-plugins-detail`. Route `/plugins/:id`, "← Plugins" back link, header with status and switch.
- Form from `manifest.settings`: label, `*` for required, text input; secret settings are password inputs showing `••••••••` and a "✓ guardado" badge when the key is in `storedSecrets`, with the hint "Déjalo vacío para conservar la guardada. Se cifra en este equipo." Guardar / Cancelar, footer note "Los cambios se aplican al reiniciar".
- `PLUGIN_SETTINGS_INCOMPLETE` maps `context.keys` to field errors ("Obligatorio para activar el plugin") with `aria-describedby`; other errors inline above the footer.
- Aside "Información": id, version, compatibility with the app version, folder (`directory/id`).
- Remove the inline form from the list card; "Ajustes" and "Configurar" link here.
- **Acceptance:** Playwright: open detail, Guardar with a blank required field shows the error on that field; a saved secret shows "guardado" and survives a save with the field empty. 1024×700 layout: aside drops below the form (container query), no horizontal scroll. `Version: minor`.

### P6 — manifest additions: author, select settings, optional apiVersion (host change)

- `FolderPluginSource` keeps `author` (string), a setting `type` of `text` (default) or `select` with `options: [{value, label}]`, and an optional `apiVersion` number. A select with no valid options, or an `apiVersion` the host does not support, makes the plugin "Incompatible" with a clear reason (not a silent skip).
- `SavePlugin` rejects a select value outside its options. P5's form renders `select` as the segmented control in the mockup (Pruebas / Producción).
- `docs/plugins.md` documents the fields. Follow-up PR in `openmarket-plugin-verifactu`: `"type": "select"` for `environment`, Spanish labels, `author`.
- **Acceptance:** source and save specs for each new field and each rejection. `Version: none`.

### P7 — diagnostics: bad folders and "Usa" (host change)

- `PluginSource.list()` also reports rejected folders `{folder, reason}` (Spanish reason codes mapped in the UI: id ≠ folder, JSON inválido, `main` fuera de la carpeta). The list shows them as "Error de carga" cards with no switch (bottom card in `A-plugins-errors`).
- `PluginHost` records, per loaded plugin, the event types of sync/durable subscriptions, durable names, and receipt slots, through the same `PluginRuntime` port. Cards and the detail aside show them as chips ("Usa"). Disabled plugins show nothing, because the host only knows after `register`.
- Store `lastErrorCode` next to `lastError` (`plugin_state` column, migration) so the UI maps codes to Spanish text instead of showing the English message; keep the raw message in a mono block for support.
- **Acceptance:** itest with a broken folder and a plugin that subscribes to `OrderCreated`; unit for the code → text map. `Version: none`.

### P8 — plugin settings UI through `settings.section` (#105 chunk 1)

- After #105 adds the slot registry, a plugin can add a `settings.section` block; the detail view renders `<PluginSlot name="settings.section" pluginId={id}>` under the "Información" aside (dashed box in `A-plugins-detail`, e.g. Verifactu's "Probar conexión"). Only that plugin's blocks show on its own detail page.
- The host-rendered form from P5 stays the place for `plugin.json` settings; the slot is for plugin-specific status and actions, not for duplicating fields.
- Ajustes keeps no plugin list (phase 8 plan); if a "Plugins" entry is wanted there it links to `/plugins`.
- **Acceptance:** lives in #105's slot tests: empty slot renders nothing; a fixture plugin's block renders only on its own detail page. Version as #105 decides.

## Order

P1 → P2 → P5 is the shortest path to a usable screen with no main-process work. P3 and P4 can go in any order after P2. P6 before the Verifactu plugin ships its real settings. P7 when a second plugin exists. P8 waits on #105.

## Ready-to-paste Cursor agent prompt (P1)

```
Implement chunk P1 of docs/design/plans/plugins-screen.md in UnexpectedSoftware/openMarket.
Fresh branch from master. Follow AGENTS.md and the openmarket-architecture skill.
Add domain/plugin/pluginStatus.js (pure) and move openMarketCompatibility into domain/plugin/.
ListPlugins returns openmarket, status, missingSettings and appVersion; PluginHost and SavePlugin
use the same missingSettings. No UI change. Inject the Clock if anything needs time (it should not).
Run npm test, npm run test:integration, npm run typecheck and mutation on the new domain files.
PR body: exactly one "Version: none" line. Do not merge.
```

The P2 and P5 prompts are the same with their section, plus: load `openmarket-design` and `pos-layout`, attach 1366×768 and 1024×700 screenshots in Mercado and Mostrador Noche, run `ui-review`, `Version: minor`.
