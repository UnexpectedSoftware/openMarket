## Recipe 6: add a plugin

The loader is `src/openMarket/infrastructure/plugins/`. A plugin is not source in this repository. It is a folder in the user-data `plugins` directory (`~/.config/OpenMarket/plugins` on this machine). Read `docs/plugins.md` before adding loader behaviour.

- `plugin.json` plus CommonJS `index.js` that exports `register`. The loader reads the manifest without running the file. `PluginHost.start()` runs `register` only for an enabled plugin whose `openmarket` range matches the app, and it runs before `domainEventDispatcher.start()`.
- `register({apiVersion, eventBus, connection, config, events})` is the public API (`apiVersion` is `1`). `events` comes from `domain/event/registry.js` (`eventClasses()`). Do not import OpenMarket source from the plugin.
- The wrapper prefixes durable names with `<pluginId>:` (`send` becomes `verifactu:send`) and throws `PluginSubscriberNameError` for another prefix.
- `subscribeSync` runs inside `save` while the transaction is open. It must be fast, local, and deterministic. A throw rolls the sale back. Network work uses `subscribeDurable`.
- Plugin tables use the prefix `<pluginId>_`. The plugin stores its own schema version and migrates itself. Do not add those tables to core `SCHEMA`.
- Enabling a plugin requires a restart. Domain and application do not import a plugin. Receipt or UI extension points need Victor's OK before they are added.
