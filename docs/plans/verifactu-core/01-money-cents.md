# 01 — Money in integer cents

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/01-money-cents.md` in OpenMarket. Add a `Money` value object in integer cents and a `Quantity` in milli-units, migrate REAL money columns to `*_cents` INTEGER columns, make `Order`, `Invoice` and the UI use them, remove the domain → infrastructure `floatCalculatorService` import, and add the test vectors. Follow root `AGENTS.md` and the `openmarket-architecture` skill. One PR, `Version: minor`.

## Goal
Exact money everywhere: amounts are integer cents, weighted quantities are integer milli-units (grams for kg), and rounding is half-up once per line. Fixes OM-02 #65 (0.35 kg × 18.50 €/kg must be 6.48 €), OM-29 #92 (REAL storage), roadmap #102.

## Context (master b34f77b)
- `src/openMarket/domain/money.js`: `multiply`/`add` via `toFixed(2)` (IEEE-754: `0.35*18.5 = 6.4749999…` → 6.47).
- `src/openMarket/infrastructure/service/floatCalculatorService.js` re-exports it. Importers: `domain/order/Order.js:2` (KNOWN_VIOLATION), `application/service/product/ProductSaleStatistics.js`, `infrastructure/order/SqliteOrderQueryService.js`, `infrastructure/product/SqliteProductSaleQueryService.js`, `infrastructure/dev/demoOrders.js`, `user_interface/order/new_order/model.js`, `user_interface/order/list_orders/model.js`, `user_interface/home/Container.js`.
- REAL columns (`infrastructure/service/SqliteConnection.js` `SCHEMA`): `product.price`, `product.base_price`, `"order".total`, `line.price`, `line.quantity`, `product_sale_day.amount`, `invoice.total`, `invoice_line.price`, `invoice_line.quantity`, `invoice_line.amount`. `backfillInvoiceLineAmounts` uses `multiply`.
- `domain/invoice/Invoice.js` stores line `amount` and `total` as euros (numbers).

## Design
- `domain/money/Money.js` — immutable value object: `Money.ofCents(int)`, `Money.fromEuros(number|string)` (= `Math.round(Number(x) * 100)` on a string-parsed decimal, never float multiply), `plus(other)`, `times(quantity)` (returns Money, half-up, see rule), `cents`, `toEuros()` (for display only), `equals`. Throws `InvalidMoneyError` (`domain/money/InvalidMoneyError.js` + `ErrorCode`) for non-integers/NaN.
- `domain/money/Quantity.js` — `Quantity.ofMilli(int)`, `Quantity.fromDecimal(x)` (`Math.round(x * 1000)` via string parsing), `units` for display. Non-weighted products use whole units (`1000` milli = 1).
- **Rounding rule (single place, `Money#times`):** `lineCents = roundHalfUp(priceCents × qtyMilli / 1000)` computed with integers: `n = priceCents * qtyMilli; q = Math.floor(n / 1000); r = n % 1000; result = r * 2 >= 1000 ? q + 1 : q` (non-negative amounts; refunds use a sign flag). Totals are the sum of rounded lines — never rounded again.
- `Order` keeps lines with `price: Money`, `quantity: Quantity`, `amount: Money`; `Order#total` is `Money`. `Invoice` copies the order's `amount`/`total` cents (never recomputes).
- Delete `domain/money.js` and `infrastructure/service/floatCalculatorService.js` at the end; remove their `KNOWN_VIOLATIONS` lines.
- UI keeps sending decimals in forms; mapping to `Money`/`Quantity` happens in the use case input (`CreateOrder`, `CreateProduct`) and display uses `formatMoney` (OM-03) from `cents / 100`.

## Steps
1. Add `Money`, `Quantity`, `InvalidMoneyError` with unit tests (vectors below).
2. Migrate schema: add `price_cents`, `base_price_cents` (product); `total_cents` (order); `price_cents`, `quantity_milli`, `amount_cents` (line); `amount_cents` (product_sale_day); `total_cents` (invoice); `price_cents`, `quantity_milli`, `amount_cents` (invoice_line) via `ensureColumn` + one-off backfill `ROUND(x * 100)` / `ROUND(q * 1000)` guarded by a `schema_migration` row (`CREATE TABLE IF NOT EXISTS schema_migration (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`). Backfilling invoice tables must run between `dropInvoiceGuards` and `installInvoiceGuards` and must **copy** stored values (never recompute issued amounts). Keep REAL columns for one release (written alongside) for rollback.
3. Mappers/repositories (`SqlOrderMapper`, `SqliteOrderRepository`, `SqlInvoiceMapper`, `SqliteInvoiceRepository`, product mapper/repository, sale-statistics query services) read/write cents columns.
4. `Order`, `Invoice`, `Product` (`price`, `basePrice` as Money) use the value objects; `CreateOrder`/`facts()` pass cents.
5. UI: replace `floatCalculatorService` imports in `new_order/model.js`, `list_orders/model.js`, `home/Container.js` with a small UI helper over `Money` (UI may import `domain/` read-only).
6. Delete the old helpers; drop the KNOWN_VIOLATIONS lines.

## Tests
- `src/test/openMarket/domain/money/Money.spec.js`: `18.50 × 0.350 kg = 6.48`; `0.90 × 3 = 2.70`; `fromEuros('1.005')` → 101 cents (string parsing, half-up); `0.10 + 0.20 = 0.30`; 1,000 random lines: total = Σ rounded lines; rejects `NaN`, `1.5` cents.
- `Order.spec.js`: weighted line total 6.48; `Invoice.spec.js`: invoice amounts equal order amounts in cents.
- Integration `src/itest/MoneyMigrationSpec.js`: a fixture DB with REAL values migrates with identical totals to the cent; invoice guards are back afterwards; running twice is a no-op.
- e2e: a weighted sale shows `6,48 €`.

## Acceptance criteria
- No `toFixed` money maths left in `src/openMarket` (`rg "toFixed\(2\)" src/openMarket` only in display code); `floatCalculatorService` and `domain/money.js` are gone; KNOWN_VIOLATIONS shrank.
- All stored money is integer cents; issued invoices keep their original amounts.
- `npm run test-all`, `npm run typecheck`, e2e green.

## Out of scope
VAT (plan 02), currency other than EUR, refunds.

**Version: minor**
