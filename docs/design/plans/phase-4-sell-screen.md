# Phase 4 — Sell screen redesign (plan)

> Status: planned. Depends on Phase 3 (#137, merged). Split into **4a** and **4b**, one PR each, 4a first.
> Mockups: `docs/design/mockups/A-sell.webp`, `A-payment.webp`, `A-sell-plugin-slots.webp` (B/C are reference only).
> Before: `docs/design/before/15-*`, `16-*`, `17-*`, `20-*`.

## Ready-to-paste Grok Build prompt (4a)

```
Implement Phase 4a of the OpenMarket redesign in UnexpectedSoftware/openMarket, following
docs/design/plans/phase-4-sell-screen.md section "4a" exactly. Fresh branch feat/sell-screen-4a
from master. Plain JS + JSDoc + checkJs, React 15 (no hooks, Fragments, portals, forwardRef,
new context). Use only user_interface/components/* and --om-* tokens (noHexColors lint must pass).
The cart computes subtotals, VAT breakdown and total with domain value objects directly
(Money, Quantity, VatRate, VatBreakdown and the shared domain/order/lineValidity function), the same
code CreateOrder uses, so totals match. Venta libre is an explicit FREE order line kind (no reserved
barcode). No DraftOrder aggregate: the UI cart is the draft. New screen reads go through query ports. Keep all existing unit and
Playwright e2e tests green; add the tests listed in the plan, including screenshots for the four
themes. PR body must contain "Version: minor" and the closing keywords listed in the plan.
```

The 4b prompt is the same with "4b", branch `feat/sell-screen-4b`, and the 4b section.

## What exists today (verified on master 4da3e4f)

- `user_interface/order/new_order/Container.js`: heading "Let's create a new order!", issuer line, `ReduxForm`, plus `WeightedDialog`, `PrinterDialog`, `NewProductDialog`. The barcode `Enter` goes through an Rx `Subject` to `newOrderProductFetch`.
- `new_order/ReduxForm.js`: redux-form with a raw `<input>` barcode field, a **react-table** cart (raw text input for quantity, "Delete" ghost Button), a `<ul class="order-vat">` and `<h3 class="order-total">` with Save/Print. The total and Save sit below the fold on long carts (OM-12 #75).
- `new_order/model.js`: cart maths in the UI. It **imports `domain/tax/VatBreakdown`, `VatRate` and `domain/money/Quantity`** and computes `vatLines()` and the total with `i18n/money` euro helpers. That's allowed (outer layers may depend on the domain) and stays. 4a only makes sure the cart and `CreateOrder` call the same domain code.
- `new_order/epicFactory.js`:
  - `makeNewOrderProductFetchEpic` (products_find + products_enable)
  - `makeNewOrderSaveEpic` (orders_create)
  - `makeNewOrderSavedEpic`, which always opens the ticket dialog (OM-13 #76)
  - printer epics using `receipts_build_use_case` and `receipts_print_use_case`
  - `makeWeightedDialogEpic`, plus the low-stock and enabled-again epics on `domain_event_bus`
- Dialogs: `weighted_dialog` and `printer_dialog` already use `components/Dialog` (Phase 3). The weighted title is "Peso (kg)", but the ticket title is still "Do you want a ticket?!".
- Core: `CreateOrder.createOrder({lines})` loads every line **by barcode** and stamps the VAT from the product. `Order.addLine({barcode,name,price,quantity,vatRate})` takes Money/Quantity in cents and milli-units. There is no payment concept anywhere in the domain.
- Receipts: `domain/receipt/{ReceiptBlock,coreBlocks}`, `infrastructure/receipt/ReceiptSlots`, `infrastructure/printer/EscPosReceiptRenderer`. There is **no HTML renderer** (#106 gap).
- Global shortcuts: `containers/App.js` `keydown` handles F2/F3/F4 (NavRail).

## Target layout (mockup A)

Two columns inside the Phase 1 shell:
- **Left (flex 1):**
  - `PageHeader` "Vender", with the issuer as subtitle
  - scanner/search bar (`TextField`, always focused)
  - product grid: tiles for favourites/categories, the **Venta libre** tile first
- **Right (fixed `--om-space-*` width, full height):**
  - cart list: one row per line, with name, unit price, `NumberField` quantity with steppers (touch target ≥ 44 px, OM-16 #79), subtotal and an `IconButton` to delete;
  - sticky footer: VAT breakdown table (base, rate, quota per rate, in cents), big total, primary `Button` "Cobrar (F12)".

The footer is always visible, which fixes OM-12 (#75). react-table and the blank padding rows go away on this screen (the orders list keeps them until Phase 5).

## 4a — layout, scanner, shortcuts, cart maths, Venta libre (FREE line), weighted dialog

1. **Cart maths with domain value objects (no new use case, no DraftOrder).** The Redux cart is the draft. `new_order/model.js` keeps lines as `{kind, barcode?, name, unitPrice: Money, quantity: Quantity, vatRate: VatRate}` and computes subtotals with `Money`/`Quantity`, VAT rows with `VatBreakdown.fromLines`, and the total, all in cents. This is the same code `Order`/`invoicePayload` use, so screen and invoice totals match. Formatting happens only at render (`formatMoney`).
   - **Line validity is shared:** a small pure domain function `domain/order/lineValidity.js` → `validateLine(line) → {valid, code?}` (quantity ≤ 0 or not a number, fractional quantity on a non-weighted product, FREE amount ≤ 0). The UI flags lines with it and never throws. `Order.addLine` calls the same function and raises a typed `InvalidOrderLineError` (new `ErrorCode`), so the UI and `CreateOrder` cannot drift (feeds #109/OM-23).
2. **Cart component** `order/new_order/Cart.js`: rows as described above. Invalid lines get `aria-invalid`, a `--om-color-danger-soft` background, a `Badge` "Cantidad no válida", and Cobrar/Save is disabled while any line is invalid (#86 OM-23). A low-stock `Badge` comes from the existing low-stock event (#87 OM-24). Money goes through `i18n/money.formatMoney` from cents (OM-03 #66).
3. **Scanner focus.** The search field keeps focus: refocus after add/delete/quantity change/dialog close, and on window `focus`. A scanner is detected as fast `keydown` bursts (< 30 ms between keys) ending in `Enter`. A burst always goes to the barcode lookup, even if focus is in a quantity field, in which case the field edit is discarded. Typing slowly into the search field filters the grid by name/barcode. The grid is a new read, so it goes through a query port: `domain/product/ProductsQuery.js` → `listForSale({text?, categoryId?, limit})` returning plain `SaleTile {barcode, name, priceCents, vatRate, weighted, lowStock, imageUrl?}`, adapter `infrastructure/product/SqliteProductsQuery.js`, facade key `products_list_for_sale_query`. No `Product` aggregates are rehydrated for display. Not found leads to the existing `newOrderProductNotFound` and an error toast (Phase 3 toast) with "Crear producto" opening `NewProductDialog`.
4. **Keyboard shortcuts** (sell screen only, registered in `Container` and removed on unmount, never clashing with F2–F4):
   - `F12` / `Ctrl+Enter`: Cobrar (4a: same as Save; 4b: opens the payment sheet)
   - `F8`: Venta libre
   - `+`/`-`: quantity of the last line
   - `Supr`/`Delete`: remove the selected line
   - `↑`/`↓`: select a line
   - `Esc`: clear search / close dialog
   - `F9`: reprint the last ticket

   They're listed in a `?` help Dialog. The help Dialog ignores F-keys while a Dialog is open, except Esc.
5. **Venta libre** (#108). A tile plus F8 opens a `Dialog` with:
   - description (`TextField`, default "Venta libre")
   - amount (`NumberField`, unit €, 2 decimals, VAT included)
   - VAT rate (`Select` from `VatRate` options: 21/10/4/0 and Exento E1…, default `VatRate.standard()` or the shop default)

   It adds a cart line `{kind: 'FREE', description, amount, vatRate}`.

   **Core change (in 4a): an explicit free-amount line kind**, not a reserved barcode.
   - `OrderLine` gets `kind: 'PRODUCT' | 'FREE'` (default `PRODUCT`), and `Order.addFreeLine({description, amount: Money, vatRate: VatRate})` enforces the invariants in `Order`: a non-empty description, amount > 0 in cents, a valid `VatRate`, quantity fixed at 1, and no barcode/product.
   - `CreateOrder.createOrder({lines})` accepts lines of both kinds. FREE lines skip `_loadProducts`, stock subtraction, low-stock events and product sale statistics.
   - Persistence: an idempotent migration adds `kind TEXT NOT NULL DEFAULT 'PRODUCT'` to the order/invoice line table and makes `barcode` nullable for FREE lines. If SQLite needs a table rebuild for that, keep `barcode` NOT NULL with `''` for FREE lines and let `kind` be the source of truth. The mapper round-trips `kind`.
   - InvoiceIssued v1 payload: the line description is the name, and the VAT is taken from the line. The payload shape is unchanged.
   - Tests: Order invariants for FREE lines, CreateOrder with a mixed cart (stock untouched, VAT breakdown correct), mapper round-trip, migration idempotency.
6. **Weighted dialog** (#109, rest of OM-21 #84, closed but polish). Show product name, price/kg, and a `NumberField` unit `kg` with 3 decimals and autofocus. A live line total is computed with `Money`/`Quantity` in the dialog. Also: big keypad-friendly buttons, Enter confirms, Esc cancels and returns focus to search, validation `> 0`. Editing a weighted line's quantity reopens the dialog instead of an inline field.
7. **Copy (OM-25 #88, sell-screen part):** Spanish: "Vender", "Cobrar", "Guardar", "¿Imprimir ticket?" (rename the printer dialog), "Venta libre". Rename "Let's create a new order!". The readonly/edit mode (`readonly` prop) keeps working: no grid, no search, and Print instead of Cobrar.
8. **Readonly reuse:** the same Cart in readonly mode is used by the order detail route.

**4a tests**
- Unit:
  - cart model: mixed rates, rounding per rate in cents, empty cart, FREE + weighted lines. Assert cart total == the `Order` total for the same lines (parity test).
  - `lineValidity`, shared by UI and `Order.addLine`
  - `Order.addFreeLine` invariants, CreateOrder with FREE lines, migration + mapper `kind`
  - `SqliteProductsQuery` integration test (returns plain objects)
  - scanner burst detector (pure function `isScannerBurst(timestamps)`)
  - shortcut map reducer
- Component (existing test setup): Cart invalid-line rendering and disabled Cobrar.
- Playwright e2e `e2e/sell.spec.*`: scan two barcodes, then a weighted item (enter 0,750 kg), Venta libre 3,50 € at 10 %, a quantity change via stepper, an invalid quantity (highlighted, Cobrar disabled), fix it and save. Assert the total and VAT rows. Screenshots of the sell screen and weighted dialog in all four themes into `docs/design/after/`.
- The existing e2e and the `noHexColors` lint stay green.

**4a closes:** #108, #75. Also closes #86 and #109 *if* invalid-line + weighted are done as above. It refs #84, #79, #87, #66, #88 and #107.

## 4b — payment sheet, receipt preview, plugin slot

1. **Payment as a use case.**
   - Domain: `domain/payment/Payment.js`, a value object `{method:'cash'|'card', tenderedCents, changeCents}`. Invariants: cash means tendered ≥ total and change = tendered − total; card means tendered = total and change 0.
   - Application: `CreateOrder.createOrder({lines, payment?})` validates the payment against the order total and persists it. Migration: nullable columns `payment_method`, `tendered_cents`, `change_cents` on the order table. The migration is idempotent, like the #126 ones. The payment is not part of the InvoiceIssued v1 payload (do not change the fiscal payload).
   - Facade: still `orders_create_use_case`. Suggested tenders (exact, next 5/10/20/50 € notes) come from a pure domain function `domain/payment/suggestedTenders(total: Money)`, used by the UI. The change is computed with `Payment`/`Money`, the same code `CreateOrder` validates with.
2. **Payment sheet** (#107, mockup A-payment): a `Dialog` opened by Cobrar/F12. It has:
   - a method toggle, Efectivo (default) / Tarjeta (`Button` variant secondary/primary)
   - a big total
   - a tendered `NumberField` (€, autofocus)
   - quick buttons "Exacto" and the suggested notes
   - a live change computed with `Money`
   - "Confirmar (Enter)", disabled while invalid

   On success it shows a success toast with the change. Then it either:
   - auto-prints if the setting `sell_auto_print` is true, or
   - shows an inline "Imprimir ticket" action in the toast instead of the modal ticket popup.

   This removes the mandatory popup (OM-13 #76). The setting is a `setting` key with a facade getter/setter (Shop settings UI is Phase 6; a default of false keeps today's behaviour minus the modal).
3. **Receipt preview** (#106 HTML gap): `infrastructure/receipt/HtmlReceiptRenderer.js` renders the same `ReceiptBlock` list as `EscPosReceiptRenderer`, outputting plain React-free HTML strings that are escaped and styled with tokens. `receipts_build_use_case` stays the single source. The preview pane shows in the payment sheet (collapsible) and on F9 reprint. Unit test: both renderers get the same blocks, and the HTML contains every core block and slot output.
4. **Plugin UI slot** (cheap, #105 partial): a `<PluginSlot name="sell.cart.footer"/>` and `sell.payment.after` render plugin-provided *receipt-block previews / status text only* (no arbitrary React from plugins in React 15). They read from the existing plugin host registry. If the host has no UI-slot API yet, render nothing and leave #105 open; do not invent a plugin UI API in this PR.

**4b tests**
- Unit: Payment invariants, CreateOrder with payment (cash change, card, insufficient tender rejected), migration idempotency, HtmlReceiptRenderer.
- Domain: `suggestedTenders`, and change parity between the sheet and `CreateOrder`.
- e2e: a full sale with a weighted item + Venta libre, paid cash with tendered 20 €, change shown, ticket preview visible, order saved with the payment. Card payment path. Screenshots of the payment sheet in the four themes.

**4b closes:** #107, #76. Also closes #106 if the HTML preview lands. It refs #105.

## Constraints

- React 15 only. Dialog focus uses `initialFocusRef` objects. No portals: the Dialog stays in place.
- Components from `user_interface/components/` and `--om-*` tokens only. No new hex/rgb.
- Money is always integer cents and quantities milli-units (`Money`/`Quantity`). Formatting happens only in `i18n/money`.
- Dependency rule: the UI may use domain value objects and functions. Writes go through use cases. New reads go through query ports that return plain read models (CQRS-lite, root `AGENTS.md`). No DraftOrder aggregate.
- Do not touch the VeriFactu payload, hash chain or plugin protocol.

## Out of scope

- Layout presets B (scanner-first) and C (touch) (#110): later plan, building on the 4a components.
- Orders list/detail redesign: Phase 5.
- Settings UI for `sell_auto_print` and the shop default VAT: Phase 6.
- Parked sales / multiple carts, discounts, returns.

## Suggested implementation PR bodies

4a:
```
Phase 4a: sell screen layout, scanner focus, shortcuts, cart maths on domain value objects, FREE order line (Venta libre), ProductsQuery for the grid, weighted dialog, invalid-line highlight.
Closes #108
Closes #75
Closes #86
Closes #109
Refs #84 #79 #87 #66 #88 #107
Version: minor
```
4b:
```
Phase 4b: Payment value object + CreateOrder payment, payment sheet, HTML receipt preview, sell plugin slot.
Closes #107
Closes #76
Closes #106
Refs #105
Version: minor
```
(Drop the `Closes #106` line if the HTML preview is deferred.)

## Rationale (architecture decisions, Oct 2026)

- The UI computing the cart with `VatBreakdown`/`VatRate`/`Quantity`/`Money` is correct. Outer layers may depend on the domain, and using the same value objects as `CreateOrder` is what keeps screen and invoice totals identical. An earlier draft proposed an `orders_quote_use_case`. It was dropped.
- No DraftOrder aggregate: the Redux cart is the draft until `CreateOrder` runs.
- Venta libre is an explicit `FREE` line kind with its invariants in `Order`, not a magic barcode.
- New reads for the redesigned screen (sale grid) use a query port that returns plain read models. Existing reads are left as they are.
