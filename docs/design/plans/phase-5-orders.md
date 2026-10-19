# Phase 5 — Orders master-detail (plan)

> Status: planned. Depends on Phase 3 (#137) and Phase 4 (#141, #142), all merged. Split into **5a** and **5b**, one PR each, 5a first.
> Umbrella: #111 (covers OM-07 #70, OM-19 #82, OM-20 #83).
> Mockup: `docs/design/mockups/A-orders.webp`. Before: `docs/design/before/22-orders-list.webp`, `24-order-detail.webp`.

## Ready-to-paste Grok Build prompt (5a)

```
Implement Phase 5a of the OpenMarket redesign in UnexpectedSoftware/openMarket, following
docs/design/plans/phase-5-orders.md section "5a" exactly. Fresh branch feat/orders-5a from master.
Follow AGENTS.md and /openmarket-architecture. Plain JS + JSDoc + checkJs, React 15 (no hooks,
Fragments, portals, forwardRef, new context). Use only user_interface/components/* and --om-* tokens
(noHexColors lint must pass). New reads go through a query port domain/order/OrdersQuery.js with
adapter infrastructure/order/SqliteOrdersQuery.js returning plain read models (never rehydrated
Order aggregates). Money is integer cents. Keep all unit, itest and Playwright e2e tests green and add
the tests listed in the plan, including screenshots for the four themes. Run npm test and
npm run typecheck. PR body must contain "Version: minor" and the closing keywords listed in the plan.
```

The 5b prompt is the same with "5b", branch `feat/orders-5b`, port `domain/order/OrderDetailQuery.js` / `infrastructure/order/SqliteOrderDetailQuery.js`, and the 5b section.

## What exists today (verified on master d277009)

- Route `/list_orders` → `user_interface/order/list_orders/ReduxConnector.js` → `Container.js` (134 lines): heading "List Order!", two `react-datepicker` inputs inside `.FilterCalendar`, a raw `button.button-filter` "Filter" that is the only thing that fetches (OM-20 #83), and a **react-table** with a ghost `Button` "View" per row. Money already goes through `i18n/money.formatMoney`.
- `list_orders/epic.js`: `listOrderFetchWithFilters` calls `orders_list_all_use_case` (`application/service/order/ListAllOrders.js`), which reads through `OrderRepository` → `infrastructure/order/SqliteOrderRepository.js`. `FIND_ALL_BY_DATES_SQL` (line 17-18) is `ORDER BY created_at ASC` (OM-07 #70). `TOTAL_AMOUNT_BY_DAYS_SQL` (line 24-25) feeds the Takings chart and must stay ascending.
- Detail (OM-19 #82): `listOrderDetailEpic` loads the order with `findById`, dispatches `LIST_ORDER_DETAIL_LOADED` and pushes `/create_order?id=…`. `new_order/reducer.js` handles `LIST_ORDER_DETAIL_LOADED` with `loadOrder` and sets `readonly`, so the **sell screen state is mutated** to show an old order; `new_order/Container.js` renders a readonly branch ("Pedido", Cart readonly, Print). The `LOCATION_CHANGE` `POP` reset in that reducer exists to undo this.
- Core: `Order` (`domain/order/Order.js`) is the aggregate root with its lines (`kind` PRODUCT/FREE, Money/Quantity/VatRate) and an optional `Payment` (`domain/payment/Payment.js`, 4b). `CreateOrder` stores every order **with its invoice** in one transaction: tables `invoice` (`invoice_number` formatted `2026/000042` by `domain/invoice/InvoiceNumber.js`, series = local year, `status` ISSUED/CANCELLED, `type` F2, `issuer_json`), `invoice_line`, `invoice_vat`. The `order` table has `payment_method`, `tendered_cents`, `change_cents`.
- Receipts: `receipts_build_use_case` (`BuildReceipt.build({orderId})`) and `receipts_print_use_case`; `HtmlReceiptRenderer` (4b) gives the HTML preview.
- Components from Phase 3/4: `PageHeader`, `Card`, `DataTable`, `Button`, `IconButton`, `Badge`, `EmptyState`, `Skeleton`, `Dialog`, `TextField`, `PluginSlot` (renders nothing: no UI-slot registry, #105), `new_order/Cart.js` (has a readonly mode).
- There is no cashier/till concept and no per-invoice VeriFactu status in core. The mockup's "Caja 1 · Víctor", Bizum and the VERI*FACTU column are **not** in scope.
- Existing reads that are not part of this screen (`ListAllOrders`, `OrdersStatistics`) stay as they are.

## Target layout (mockup A-orders)

Two panes inside the Phase 1 shell, route `/list_orders` and `/list_orders/:id`:
- **Left (master, fixed width):** quick-range chips **Hoy / Ayer / 7 días / Mes / Rango…**, a day summary (Ventas, Tickets, Ticket medio), and the list newest first. Each row: invoice number, time · item count · payment method, total; a `Badge` "Anulada" when the invoice is CANCELLED. Selected row highlighted.
- **Right (detail):** "Factura simplificada" label, invoice number as heading, date/time and payment line ("Efectivo (entregado 20,00 €, cambio 6,87 €)" / "Tarjeta"), the lines (readonly `Cart` or `DataTable`: product, unit price or kg × €/kg, quantity, amount), VAT breakdown, big total, and an action bar always visible: **Reimprimir** (Devolución and Factura completa rendered disabled / omitted until their own issues). A `PluginSlot name="orders.detail.aside"`.

## 5a — list: query port, newest first, quick ranges, day summary

1. **Query port** `domain/order/OrdersQuery.js` (abstract class, like `domain/product/ProductsQuery.js`):
   - `list({from, to, limit, offset}) → Observable<{items: OrderListItem[], total: number}>`
   - `daySummary({from, to}) → Observable<OrderSummary>`
   - Read models (JSDoc typedefs in the port): `OrderListItem {orderId, invoiceNumber, createdAt (ISO), itemCount, paymentMethod: 'cash'|'card'|null, totalCents, cancelled: boolean}`, `OrderSummary {totalCents, ticketCount, averageCents}`. `averageCents` is `Math.round(totalCents / ticketCount)`, 0 when empty, computed with `Money`.
   - Adapter `infrastructure/order/SqliteOrdersQuery.js`: one SQL joining `"order"` ⟕ `invoice` (on `invoice.order_id`) with a line-count subquery, `ORDER BY created_at DESC, id DESC`, bounds via `service/sqliteDates.toStoredBound`, money via `service/storedMoney` (`*_cents` first, legacy REAL fallback). Returns plain objects; never builds `Order`.
   - DIC factory `_ordersQuery` in `infrastructure/dic/Container.js`, facade key `orders_list_query` in `application/index.js`.
2. **OM-07 (#70):** also change `SqliteOrderRepository` `FIND_ALL_BY_DATES_SQL` to `DESC` (anything else still calling it gets newest first). Leave `TOTAL_AMOUNT_BY_DAYS_SQL` ascending.
3. **Quick ranges (OM-20 #83):** a pure UI function `list_orders/ranges.js` → `rangeFor(key, now, timeZone)` for `today|yesterday|week|month` returning `{from, to}` local-day bounds (7 días = today and the 6 days before; Mes = 1st of current month to now). Clicking a chip fetches immediately. "Rango…" opens a `Dialog` with two date `TextField`s (`type="date"`) and Aplicar; this replaces `react-datepicker` and the Filter button on this screen. Default on mount: Hoy.
4. **List pane** `list_orders/OrderList.js` (+ `OrderSummary.js`): built from `Card`, `Badge`, `EmptyState` ("No hay pedidos en este periodo"), `Skeleton` while loading; rows are `<button>`s (44 px, keyboard ↑/↓ moves selection, Enter opens). Paging: "Cargar más" button (offset += limit), no react-table. Money only through `formatMoney(Money.ofCents(...))`.
5. **Redux:** `list_orders` actions `ORDERS_RANGE_SELECTED {key|from,to}`, `ORDERS_LOADED`, `ORDERS_FAILED`, `ORDERS_SUMMARY_LOADED`; epic `makeOrdersListEpic(ordersQuery)` with `switchMap` (latest range wins) in an `epicFactory.js` so it is unit-testable like `new_order/epicFactory.js`. Remove the start/end-date filter actions once nothing uses them.
6. **Copy (OM-25 #88, orders part):** "Pedidos" heading, "Hoy", "Ayer", "7 días", "Mes", "Rango…", "Ventas", "Tickets", "Ticket medio".
7. In 5a the row click still opens the old readonly sell view (unchanged) so the e2e "opens its detail" keeps passing; 5b replaces it.

**5a tests**
- itest `src/itest/OrdersQuerySpec.js`: two orders a second apart → newest first; invoice number and item count present; cancelled flag; summary totals/average in cents; range bounds exclude the other day; returns plain objects (`!(item instanceof Order)`).
- itest for `SqliteOrderRepository` newest-first (#70 acceptance).
- Unit: `rangeFor` (day boundaries in Europe/Madrid, month start, DST day), `makeOrdersListEpic` (switchMap cancels the previous range, failure → `ORDERS_FAILED`), reducer.
- Component: `OrderList` renders newest first, empty state, selected row.
- e2e `e2e/orders.spec.js`: make two sales, open Pedidos → newest first and summary shows 2 tickets; click "Ayer" → list refetches without any Filter click and shows the empty state (#83 acceptance). Update the old date-picker test. Screenshots of the list in the four themes into `docs/design/after/`.

**5a closes:** #70, #83. Refs #111, #88.

## 5b — detail route, stop mutating the sell state, reprint

1. **Query port** `domain/order/OrderDetailQuery.js` → `byId({orderId}) → Observable<OrderDetail | null>`; adapter `infrastructure/order/SqliteOrderDetailQuery.js`; facade key `orders_detail_query`. Read model: `OrderDetail {orderId, invoiceNumber, invoiceType, cancelled, createdAt, payment: {method, tenderedCents, changeCents} | null, lines: [{kind, barcode, name, unitPriceCents, quantityMilli, weighted, amountCents, vat: {kind, percent, cause}}], vat: [{kind, percent, cause, baseCents, quotaCents}], totalCents}`. Lines and VAT rows come from `invoice_line` / `invoice_vat` (the fiscal record), so the detail shows exactly what was invoiced. Plain objects only; the Order aggregate is not rehydrated.
2. **Route** `/list_orders/:id` (react-router 3 child route of `/list_orders`, same master pane, detail on the right). Selecting a row is a `push`, so Back/F3 work; an unknown id shows `EmptyState` "Pedido no encontrado".
3. **Detail pane** `list_orders/OrderDetail.js`: header ("Factura simplificada", `invoiceNumber` as `h2`, date/time, payment line with tendered/change from cents), lines table (`DataTable` or readonly `Cart`; weighted lines show `0,350 kg × 18,50 €/kg`), VAT rows, total, and a sticky action bar with **Reimprimir** (`receipts_build_use_case` + `receipts_print_use_case`, preview via the 4b HTML renderer in a `Dialog`). `<PluginSlot name="orders.detail.aside" />` in the aside (renders nothing until #105).
4. **Stop mutating the sell screen (OM-19 #82):** delete `listOrderDetailEpic`'s push to `/create_order`, the `LIST_ORDER_DETAIL_LOADED` case and the readonly branch in `new_order/reducer.js` / `Container.js` (and the `readonly` prop wiring), and drop the `LOCATION_CHANGE` POP reset that only existed for it (keep tiles; see the sell-grid bug fix). Vender always opens an empty cart.
5. **Shortcuts on this screen:** ↑/↓ select, Enter open, `F9` reprint the selected order, `Esc` back to the list. Never clash with F2–F4.

**5b tests**
- itest `src/itest/OrderDetailQuerySpec.js`: mixed PRODUCT/FREE/weighted order with payment → lines, VAT rows and total in cents match the invoice; cancelled invoice flag; unknown id → null; plain objects.
- Unit: detail reducer/epic, payment line formatting from cents.
- e2e: open an order → heading contains the invoice number and the date, Reimprimir visible without scrolling at 1366×768, then F2 → Vender shows an empty cart and the full product grid (#82 acceptance). Screenshots of the detail in the four themes.

**5b closes:** #82, #111 (all three covered). Refs #105.

## Constraints

- React 15 only. No hooks, Fragments, portals; Dialog focus via `initialFocusRef` objects.
- Components from `user_interface/components/` and `--om-*` tokens only. No new hex/rgb. Reuse Phase 3/4 components; add a component there only if two screens need it.
- Dependency rule: outer layers may depend on the domain; only the reverse is forbidden. Writes go through use cases (none new here). New reads go through `domain/order/<Name>Query.js` ports with `infrastructure/order/Sqlite<Name>Query.js` adapters returning read models, never rehydrated aggregates (CQRS-lite, root `AGENTS.md`).
- `Order` is the aggregate root with its lines and always has an Invoice; the list/detail show the invoice number and never an order without one (an order row without an invoice is a data error: log it with `record` and show "—").
- Money is integer cents (`Money`), quantities milli-units (`Quantity`). Formatting only in `i18n/money`.
- Do not touch the VeriFactu payload, hash chain, invoice numbering or plugin protocol.

## Out of scope

- Devolución / refunds and rectifying invoices (own issue; `CancelInvoice` stays as is).
- "Factura completa" (F1 with customer data).
- Search box "Buscar ticket por nº, importe o producto" (later; the query port can grow a `text` filter).
- Cashier/till names, Bizum, per-invoice VeriFactu status column and QR (needs a plugin UI-slot API, #105).
- Takings chart and `OrdersStatistics`.

## Suggested implementation PR bodies

5a:
```
Phase 5a: orders list on OrdersQuery (read models), newest first, quick ranges that fetch immediately, day summary.
Closes #70
Closes #83
Refs #111 #88
Version: minor
```
5b:
```
Phase 5b: order detail route on OrderDetailQuery, reprint, plugin aside slot; the sell screen is no longer reused for order detail.
Closes #82
Closes #111
Refs #105
Version: minor
```

## Rationale (architecture decisions, Oct 2026)

- The list and detail are new reads for a redesigned screen, so they use query ports returning plain read models, like `ProductsQuery` in Phase 4. `ListAllOrders`/`OrderRepository` reads stay for existing callers; only the sort order changes (#70).
- The detail reads the invoice tables because the invoice is the fiscal truth the customer received; the order aggregate is not rehydrated for display.
- Reusing the sell screen in readonly mode coupled two screens through one Redux slice and is what forced the `POP` reset; a dedicated detail view removes both.
