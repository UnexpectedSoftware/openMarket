# VeriFactu: OpenMarket core prerequisites

The VeriFactu plugin ([UnexpectedSoftware/openmarket-plugin-verifactu](https://github.com/UnexpectedSoftware/openmarket-plugin-verifactu), plan in its `docs/PLAN.md`) must not import core source or query core tables. It needs the core to issue complete, immutable invoices and to publish them through a stable event payload. These plans add exactly that. **One plan = one PR**, in this order:

| # | Plan | Issues | Depends on | Unblocks plugin phase |
|---|---|---|---|---|
| 01 | [Money in integer cents](01-money-cents.md) | #102, OM-02 #65, OM-29 #92 | — | 2 (hash input uses exact amounts), 3 |
| 02 | [VAT rate per product and per line](02-product-vat.md) | OM-28 #91 | 01 | 3 (registration needs the per-rate breakdown) |
| 03 | [Issuer data, local timestamps, invoice type](03-issuer-and-invoice-data.md) | OM-26 #89, OM-30 #93 | 01 | 3, 6 (NIF check) |
| 04 | [Versioned InvoiceIssued / InvoiceCancelled payload](04-invoice-issued-payload.md) | — | 01, 02, 03 | 3 (plugin reads only the payload) |
| 05 | [Plugin runtime: process, Node APIs, secrets](05-plugin-runtime.md) | — | — (can run in parallel) | 4 (mTLS), 6 (certificate password) |
| 06 | [Receipt blocks for plugins](06-receipt-slots.md) | #105, #106 | 04 | 5 (QR + "VERI*FACTU" on the ticket) |

Related: hash chain #101, AEAT delivery #100, Verifactu plugin UI #103, in-transaction hook #63 (already available as `subscribeSync`, see `docs/plugins.md`), never reuse ticket numbers #96.

## State of master these plans start from (b34f77b)
- `Invoice` (#123) is a separate aggregate with `orderId`, gap-free `InvoiceSequence` per series (series = shop-local year via `Clock#localDate`), stored `invoice_line.amount`, `UNIQUE` index on `invoice.order_id`, and immutability triggers (`installInvoiceGuards` in `infrastructure/service/SqliteConnection.js`).
- Money is still floats: `domain/money.js` (`multiply`/`add` with `toFixed(2)`), re-exported by `infrastructure/service/floatCalculatorService.js`; `Order.js` still imports the infrastructure re-export (listed in `KNOWN_VIOLATIONS`). 0.35 × 18.50 still gives 6.47.
- No VAT anywhere; no issuer data (printer hard-codes `SUPER COMPRIN` / `NIF 476359906P` in `infrastructure/printer/OrderPrinterService.js`); `issuedAt` is a UTC `Z` instant.
- Plugins load in the **renderer** (`application/index.js` → `PluginHost.start()`), which has `nodeIntegration: true`, `contextIsolation: false`, `sandbox: false` (`user_interface/main.development.js:84-90`). Plugin config is stored as plain text in `plugin_state.config_json`.

## Rules for every plan
DDD/hexagonal per root `AGENTS.md` (behaviour on aggregates/value objects, repositories as collections, ports + adapters, use cases orchestrate, events saved inside the transaction). JSDoc + `checkJs`, no `.ts`. React 15 UI (no hooks). Each PR ships its tests, keeps `npm run test-all`, `npm run typecheck` and the e2e suite green, and puts `Version: minor` in its body (schema + behaviour change) with the matching `package.json` bump.
