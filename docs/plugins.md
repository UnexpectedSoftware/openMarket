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

## Public event payloads

A fiscal plugin reads `InvoiceIssued` and `InvoiceCancelled` and does not query core tables. Both payloads are schema version 1, built in `domain/invoice/invoicePayload.js`. The fixtures are the contract:

- `src/test/openMarket/contracts/fixtures/InvoiceIssued.v1.json`
- `src/test/openMarket/contracts/fixtures/InvoiceCancelled.v1.json`

Amounts are integer cents. A missing value is null. Adding a field stays on version 1. Removing or renaming a field means version 2, with both versions documented. `static schemaVersion` on the event class is 1.

`InvoiceCancelled` repeats the identifying fields and adds `cancelledAt` and `reason`. It does not repeat lines.

| Field | Type | Meaning | Since |
| --- | --- | --- | --- |
| `schemaVersion` | number | Contract version, `1` | 1 |
| `invoiceId` | string | Invoice id. Also the `aggregate_id` | 1 |
| `type` | string | `F2` now. `R5` is reserved for a corrective | 1 |
| `series` | string | Series, such as `2026` | 1 |
| `number` | number | Integer within the series | 1 |
| `invoiceNumber` | string | Formatted number, such as `2026/000042` | 1 |
| `issueDate` | string | Shop-local `YYYY-MM-DD` | 1 |
| `issuedAt` | string | Issue time with a numeric offset | 1 |
| `orderId` | string or null | Placed order. Issued payload only | 1 |
| `currency` | string | `EUR`. Issued payload only | 1 |
| `issuer` | object or null | Shop snapshot. Null when the profile was incomplete | 1 |
| `nif` | string | Issuer tax id, inside `issuer` | 1 |
| `legalName` | string | Issuer legal name, inside `issuer` | 1 |
| `tradeName` | string or null | Trade name, inside `issuer` | 1 |
| `address` | object | Issuer address | 1 |
| `street` | string | Address street | 1 |
| `postalCode` | string | Address postal code | 1 |
| `city` | string | Address city | 1 |
| `province` | string | Address province | 1 |
| `country` | string | Address country, such as `ES` | 1 |
| `lines` | array | Issued lines. Issued payload only | 1 |
| `position` | number | Zero-based line position | 1 |
| `barcode` | string | Line barcode | 1 |
| `name` | string | Line name | 1 |
| `unitPriceCents` | number | VAT-included unit price in cents | 1 |
| `quantityMilli` | number | Quantity in milli-units. `1000` is one unit | 1 |
| `amountCents` | number | VAT-included line amount in cents | 1 |
| `vat` | object | Line rate | 1 |
| `kind` | string | `S1`, `E`, or `N` | 1 |
| `percent` | number | Rate percent. `0` for exempt and not subject | 1 |
| `cause` | string or null | Exemption or not-subject cause | 1 |
| `vatBreakdown` | array | One row per rate. Issued payload only | 1 |
| `baseCents` | number | Taxable base in cents | 1 |
| `quotaCents` | number | VAT quota in cents | 1 |
| `grossCents` | number | VAT-included amount in cents | 1 |
| `totalCents` | number | Invoice total in cents | 1 |
| `vatTotalCents` | number | Sum of `quotaCents`. Issued payload only | 1 |
| `corrects` | object or null | Null for `F2`. Reserved for `R5` | 1 |
| `cancelledAt` | string | Cancellation time with a numeric offset. Cancelled payload only | 1 |
| `reason` | string or null | Cancellation reason. Cancelled payload only | 1 |

A stored row with no `schemaVersion` is version 0. Hydrate does not upcast it. A durable subscriber registered after version 1 shipped does not receive those rows.

## Subscribers

`subscribeSync` runs inside `save`, before the `domain_event` row is inserted, while the sale transaction is still open. The handler must be fast, local, and deterministic. It must not call the network. A throw rolls the sale back. That is the point of a sync handler: the local write and the sale commit together, or neither does.

Network and other external work, such as sending a registration to AEAT, belongs only in `subscribeDurable`. A durable handler runs after commit, is retried, and cannot roll the sale back.

`ofType` is the live stream after commit. A throw there is logged and does not fail the sale.

Enabling or disabling a plugin applies on the next start. The first time a durable name is registered, that time is stored. Events saved before it are not delivered. Turning a plugin off leaves its tables and any processing rows in place. The next process simply does not call `register`.

## Tables

A plugin creates its own tables from `register`, with the prefix `<pluginId>_` (`verifactu_registration`). It keeps its own schema version in its own row and migrates those tables itself. OpenMarket does not migrate plugin tables.

## Plugins page

The page lists every valid folder as soon as it is opened. Code runs only after a restart, and only for plugins that are enabled. Disabling a plugin asks for confirmation, because some plugins are legally required. Already stored plugin data is left as it is.
