# 03 — Issuer data, local timestamps and invoice type

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/03-issuer-and-invoice-data.md` in OpenMarket (after plan 01). Add shop settings (NIF, legal name, trade name, address) with a validated NIF/CIF value object and a Settings screen, copy the issuer onto each invoice at issue, store `issuedAt` as local date + ISO-8601 timestamp with offset (Europe/Madrid via `Clock`), and add the invoice type (F2 now; R5 designed). One PR, `Version: minor`.

## Goal
An issued invoice is self-describing: who issued it, when (local date and offset timestamp), and what type it is. Covers OM-26 #89 (hard-coded shop data, no Settings) and OM-30 #93 (timestamps without zone).

## Context
- Hard-coded issuer: `infrastructure/printer/OrderPrinterService.js` (`'SUPER COMPRIN'`, `'NIF 476359906P'`), `infrastructure/printer/CatalogPrinterService.js`; printer config hard-coded in `infrastructure/printer/PrinterConnection.js`.
- No settings store: only `src/resources/application.json` (bundled, read-only) and `plugin_state` for plugins. No `/settings` route in `user_interface/routes.js`.
- `infrastructure/service/SystemClock.js`: `now()` = UTC ISO (`…Z`), `localDate({instant})` in `Europe/Madrid`. `CreateOrder._issueInvoice` uses `now()` as `issuedAt` and `localDate` for the series.
- `Order` still defaults `date = moment().format('DD/MM/YYYY HH:mm:ss')` (`domain/order/Order.js`).
- Cancellation already exists: `application/service/invoice/CancelInvoice.js`, `InvoiceCancelled`.

## Design
- **Settings (shop):** `domain/shop/ShopProfile.js` aggregate (single instance): `nif: TaxId`, `legalName`, `tradeName`, `address {street, postalCode, city, province, country}`, `timeZone` (default `Europe/Madrid`). Port `domain/shop/ShopProfileRepository.js` (`find()`, `save({profile})`); adapter `infrastructure/shop/SqliteShopProfileRepository.js` on a new `setting (key TEXT PRIMARY KEY, value_json TEXT NOT NULL)` table (generic key/value so printer/ticket/theme settings can follow). Use cases `application/service/shop/GetShopProfile.js`, `UpdateShopProfile.js`; facade keys `shop_get_profile_use_case`, `shop_update_profile_use_case`.
- **`domain/shop/TaxId.js`** value object: validates Spanish NIF (8 digits + control letter, `TRWAGMYFPDXBNJZSQVHLCKE`), NIE (X/Y/Z prefix) and CIF (letter + 7 digits + control digit/letter per the standard algorithm); normalises (upper case, no spaces/dashes). `InvalidTaxIdError` + `ErrorCode`.
- **Issuer on the invoice:** `Invoice.issue({…, issuer})` where `issuer = {nif, legalName, tradeName, address}` snapshot. `CreateOrder` loads the profile once per sale (inside the transaction) and fails with `ShopProfileIncompleteError` if NIF/legal name are missing — **decide in the PR whether to block sales or issue without issuer before Settings is filled** (recommended: block invoicing with a clear UI message once the shop enables invoicing; until then, keep today's behaviour behind a flag).
- **Time:** extend the `Clock` port (`domain/Clock.js`) with `zonedNow() → {instant: '2026-10-15T20:41:07.123Z', local: '2026-10-15T22:41:07+02:00', date: '2026-10-15'}` (and `zoned({instant})`). `SystemClock` implements it with `Intl` (offset from `timeZoneName: 'longOffset'`). Invoice stores `issuedAt` (offset ISO, e.g. `2026-10-15T22:41:07+02:00`) and `issueDate` (`2026-10-15`), series from `issueDate`.
- **Invoice type:** `domain/invoice/InvoiceType.js` (`F2` simplified, `R5` corrective of simplified). `Invoice.type` defaults `F2`. **R5 design (later PR):** `Invoice.correct({id, invoiceNumber, issuedAt, issuer, original, lines, reason})` creates a new Invoice with `type R5`, `corrects: {invoiceId, invoiceNumber, issueDate}`, negative or substitutive lines (`kind: 'I'` differences); use case `application/service/invoice/IssueCorrectiveInvoice.js` (own series, e.g. `R2026`), event `CorrectiveInvoiceIssued` (or `InvoiceIssued` with `type: 'R5'` — decide in plan 04). Original stays untouched.

## Migrations
- `CREATE TABLE IF NOT EXISTS setting (...)`.
- `invoice`: add `issue_date TEXT`, `type TEXT NOT NULL DEFAULT 'F2'`, `issuer_json TEXT`, `corrects_invoice_id TEXT`. Backfill once (guarded by `schema_migration`, between `dropInvoiceGuards`/`installInvoiceGuards`): `issue_date` = local date of `issued_at` in Europe/Madrid (computed in JS), `issuer_json` NULL for historic invoices (documented as "issued before issuer data existed"). Extend `invoice_forbid_rewrite` to cover the new columns.
- `Order` `created_at`: switch the domain default to the clock (inject via `OrderFactoryImpl`), keep the stored display format until OM-30 follow-up converts it (out of scope here beyond the invoice).

## UI (React 15)
- New route `/settings` (`user_interface/settings/` with `Container.js`, `ReduxForm.js`, `epic.js`, `reducer.js`, `action.js`), section "Comercio": NIF, razón social, nombre comercial, dirección. Validation shows `InvalidTaxIdError` inline. Link it from the nav (shell plan in `docs/design/plans/phase-1-shell.md`).
- `OrderPrinterService` prints issuer and invoice number/date from the invoice, not literals.

## Tests
- `TaxId.spec.js`: valid NIF `12345678Z`, invalid control letter, NIE `X1234567L`, CIF `B12345674` (verify vectors in the PR), normalisation.
- `SystemClock.spec.js`: DST boundaries (`2026-03-29T00:59:59Z` → `+01:00`, `01:00:00Z` → `+02:00`), New Year in Madrid (`2026-12-31T23:30:00Z` → date `2027-01-01`, series `2027`).
- `CreateOrder.spec.js`: invoice gets issuer snapshot, `issuedAt` with offset, `issueDate`, `type F2`; changing the profile later does not change stored invoices.
- itest: migration backfills `issue_date`; guards reject updating `issuer_json`.
- e2e: Settings saves and reloads; receipt shows the configured NIF; `rg "SUPER COMPRIN|476359906P" src` is empty.

## Acceptance criteria
- Issuer, local `issueDate`, offset `issuedAt` and `type` are stored on every new invoice and immutable.
- NIF/CIF validated; Settings screen works; no hard-coded issuer left.
- Tests + typecheck + e2e green.

## Out of scope
Printer/ticket/theme settings sections (follow-ups on the same `setting` table), R5 implementation (designed only), certificate handling (plan 05).

**Version: minor**
