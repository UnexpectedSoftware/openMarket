# 02 — VAT rate per product and per line

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/02-product-vat.md` in OpenMarket (after plan 01 is merged). Add a `VatRate` value object, a VAT rate on `Product` with a selector in the product form and a default from settings, snapshot the rate on order and invoice lines, compute base/quota per line and per-rate totals on the invoice, migrate existing products to 21 %, and print the breakdown on the receipt. One PR, `Version: minor`.

## Goal
Every sold line carries its VAT rate; every invoice carries the breakdown by rate (base, rate, quota) that VeriFactu's `Desglose` needs. Fixes OM-28 #91 and the per-product VAT roadmap item.

## Context
- No tax columns: `product`, `line`, `invoice_line` in `infrastructure/service/SqliteConnection.js`.
- Product form: `user_interface/product/new_product/ReduxForm.js`; defaults: `src/resources/application.json` → `productDefaults` (read by `infrastructure/dic/Container.js`).
- Receipt: `infrastructure/printer/OrderPrinterService.js` prints literal "IVA incluido".
- `domain/invoice/Invoice.js` (`issue`, `restore`, `lines`, `total`), `domain/order/Order.js`, `application/service/order/CreateOrder.js` (`_issueInvoice`, `facts`).

## Design
- `domain/tax/VatRate.js` — value object: `VatRate.of({percent, exemption})` where `percent ∈ {21, 10, 5, 4, 2, 0}` (keep the allowed list in one constant; 5/2 cover temporary reduced rates) and `exemption` (`E1`…`E6` per AEAT `CausaExencion`) required when the line is exempt, or `notSubject` cause (`N1`/`N2`) — represent as `kind: 'S1' | 'E' | 'N'` + `percent` + `cause`. `equals`, `key` (for grouping), `toJSON`.
- Prices are **VAT-included** (POS). Per line: `amount` (gross, from plan 01). Breakdown is computed **per rate**, not per line, to avoid accumulated rounding: for each rate group `gross = Σ line.amount`; `base = roundHalfUp(gross × 100 / (100 + percent))`; `quota = gross − base`. This guarantees `Σ base + Σ quota = total` to the cent. Put this in `domain/tax/VatBreakdown.js` (`VatBreakdown.fromLines(lines) → [{rate, base: Money, quota: Money, gross: Money}]`).
- `Product` gets `vatRate: VatRate` (constructor + getter + `changeVatRate`). `ProductFactory`/`ProductFactoryImpl` default it from settings (`productDefaults.vatRate`, default 21) — later from the Settings screen (plan 03).
- `Order` line snapshot: `vatRate` copied from the product at sale time (`CreateOrder` loads products already in `_subtrackStock`; restructure to load first, build lines with the product's rate, then place). `Invoice` copies line `vatRate` and stores `breakdown` (computed once at `Invoice.issue`, stored, never recomputed on load).

## Migrations
- `product.vat_percent INTEGER NOT NULL DEFAULT 21`, `product.vat_kind TEXT NOT NULL DEFAULT 'S1'`, `product.vat_cause TEXT`.
- `line.vat_percent`, `line.vat_kind`, `line.vat_cause` (backfill 21/S1 for existing lines — document that historic rates are assumed).
- `invoice_line.vat_percent/kind/cause` + new table `invoice_vat (invoice_id, position, kind, percent, cause, base_cents, quota_cents, gross_cents, PRIMARY KEY(invoice_id, position))`; existing invoices are backfilled once with 21 % (guarded by `schema_migration`, inside `dropInvoiceGuards`/`installInvoiceGuards`); add `invoice_vat` to the guard triggers.

## UI (React 15)
- Product form: a `<select>` "IVA" with the allowed rates (+ exempt with cause) in `new_product/ReduxForm.js`; validation in `user_interface/validations`.
- Cart footer and order detail: show the per-rate breakdown (read from the saved order/invoice).
- Receipt (`OrderPrinterService.print`): replace "IVA incluido" with a table `IVA% | Base | Cuota` from the invoice breakdown (pass the invoice to the printer, or a `PrintableOrder.vat` array).

## Tests
- `src/test/openMarket/domain/tax/VatRate.spec.js` (allowed values, exempt needs a cause).
- `VatBreakdown.spec.js`: basket 4 %/10 %/21 % — per-rate base+quota sum to the total; known vector: 21 % gross 12.10 € → base 10.00, quota 2.10; 10 % gross 1.10 → 1.00/0.10; 4 % gross 0.99 → base 0.95, quota 0.04.
- `CreateOrder.spec.js`: lines snapshot the product rate; a later rate change does not alter the stored invoice.
- itest: migration gives existing products 21 %; invoice breakdown persisted and restored identically.
- e2e: product form saves the rate; receipt preview/printer fake shows the breakdown.

## Acceptance criteria
- Every product, order line and invoice line has a rate; every invoice has a stored breakdown whose sums equal its total.
- Breakdown never recomputed on load; guards cover the new table.
- Tests + typecheck + e2e green.

## Out of scope
Recargo de equivalencia, non-Spanish taxes, VAT-exclusive pricing, per-category default (follow-up).

**Version: minor**
