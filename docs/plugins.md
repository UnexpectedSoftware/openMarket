# Plugins

A plugin is a folder you copy into the running app. OpenMarket does not bundle it. The code in `src/openMarket/infrastructure/plugins/` is only the loader: it finds those folders, reads `plugin.json`, and calls `register` for the ones that are enabled.

Plugins run with full trust. `register` receives the shared SQLite connection and the domain event bus. There is no sandbox. A plugin can read and write the shop database.

## Install

A plugin lives in its own repository. A release is a zip of one folder (`plugin.json`, `index.js`, and any files that folder needs). Install it by unzipping that folder into the plugins directory and restarting OpenMarket.

On this machine the directory is `~/.config/OpenMarket/plugins`, next to `openmarket.sqlite`. The Plugins page shows the path the running app is using. The installed application directory is not writable.

```
~/.config/OpenMarket/plugins/verifactu/
  plugin.json
  index.js
```

There is no shared `plugin-api` package yet. The context below is the whole public API. A later package can hold types and test helpers when a plugin repository needs them.

## plugin.json

```json
{
  "id": "verifactu",
  "name": "VeriFactu",
  "description": "AEAT electronic invoicing compliance",
  "version": "1.0.0",
  "openmarket": ">=1.15.0 <2",
  "main": "index.js",
  "settings": []
}
```

`id` matches the folder name: a lower-case letter, then lower-case letters, digits, or hyphens. `main` is optional and must stay inside the folder. `openmarket` is an optional version range. Comparisons are space-separated and must all match (`>=1.15.0 <2`). `||` separates alternatives. Do not put a space between an operator and its number. A plugin whose range does not include this OpenMarket version is not loaded. The Plugins page shows the reason.

`settings` lists text values the Plugins page asks for before it can enable the plugin: `{ "key", "label", "required" }`.

A folder with a bad manifest is skipped. One bad folder does not hide the others, and it does not stop the app.

## register

`index.js` is CommonJS. The loader does not run it until the plugin is enabled and OpenMarket starts.

```js
module.exports = {
  register({apiVersion, eventBus, connection, config, events}) {
    eventBus.subscribeSync(events.OrderCreated, event => {
      // fast, local, deterministic
    });
    eventBus.subscribeDurable('verifactu:send', events.OrderCreated, event => {
      // network and other external work
    });
  }
};
```

`apiVersion` is `1`. The fields of this object are the public API:

| Field | Meaning |
| --- | --- |
| `apiVersion` | `1` |
| `eventBus` | `subscribeSync`, `subscribeDurable`, and `ofType` only |
| `connection` | The shared SQLite connection. Use `connection.database` |
| `config` | Saved settings for this plugin |
| `events` | The event classes from `domain/event/registry.js` |

Use `events.OrderCreated` and the other classes on `events`. They are the same functions the bus uses. Anything else in OpenMarket is internal.

`subscribeDurable` names must belong to the plugin. A name with no colon is prefixed (`send` becomes `verifactu:send`). A name that already starts with `verifactu:` is kept. Any other prefix is rejected and the plugin does not stay registered.

## Subscribers

`subscribeSync` runs inside `save`, before the `domain_event` row is inserted, while the sale transaction is still open. The handler must be fast, local, and deterministic. It must not call the network. A throw rolls the sale back. That is the point of a sync handler: the local write and the sale commit together, or neither does.

Network and other external work, such as sending a registration to AEAT, belongs only in `subscribeDurable`. A durable handler runs after commit, is retried, and cannot roll the sale back.

`ofType` is the live stream after commit. A throw there is logged and does not fail the sale.

Enabling or disabling a plugin applies on the next start. The first time a durable name is registered, that time is stored. Events saved before it are not delivered. Turning a plugin off leaves its tables and any processing rows in place. The next process simply does not call `register`.

## Tables

A plugin creates its own tables from `register`, with the prefix `<pluginId>_` (`verifactu_registration`). It keeps its own schema version in its own row and migrates those tables itself. OpenMarket does not migrate plugin tables.

## Plugins page

The page lists every valid folder as soon as it is opened. Code runs only after a restart, and only for plugins that are enabled. Disabling a plugin asks for confirmation, because some plugins are legally required. Already stored plugin data is left as it is.
