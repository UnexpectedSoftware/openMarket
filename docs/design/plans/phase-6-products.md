# Phase 6 — Products table and edit drawer (plan)

> Status: planned. Depends on Phase 3 (#137) and Phase 4 (sell screen), both merged. **Independent of Phase 5a (#148), which is open and unmerged.** Split into **6a**, **6b**, and **6c**, one PR each, 6a first.
> Umbrella: #98 (covers OM-22 #85 and OM-08 #71). #71 and #85 are already closed; 6b and 6c still meet the acceptance those issues wrote down.
> Mockup: `docs/design/mockups/A-products.webp`. Before: `docs/design/before/10-product-list.webp`, `13-edit-product.webp`.

This is roadmap item 3. It is numbered phase 6 because orders took phase 5. Settings stays the later roadmap item (OM-26 #89). The "Phase 6" note in the sell-screen plan means that settings screen, not this one.

## Independence from #148

Branch every implementation PR from **master**. Do not branch from `cursor/orders-list-5a-831c` and do not take orders behavior into a products PR.

#148 edits `AGENTS.md`, `src/openMarket/domain/AGENTS.md`, `src/openMarket/user_interface/AGENTS.md`, `docs/design/plans/phase-5-orders.md`, `.grok/skills/openmarket-architecture/SKILL.md`, the orders list, `e2e/orders.spec.js`, `e2e/shell.spec.js`, `e2e/themes.spec.js`, `user_interface/components/Button.js`, and `user_interface/file.scss`. While that PR is open, products work does not edit those files, except the Productos heading line in the two e2e files (next paragraph). Styles for this screen go in `style/components/products.scss` and `style/components/om-dialog.scss`, which `file.scss` already imports.

6b changes the Productos heading, which `e2e/shell.spec.js` and `e2e/themes.spec.js` assert. If #148 is still open, rebase and change only the Productos heading. Leave the Pedidos line as it is on the branch you started from.

On master `cc9a913`, root `AGENTS.md` still tells a redesigned screen to add a query port. #148, when it merges, replaces that with the read-model rule and tells later work to leave the sell-grid `ProductsQuery` port until this screen is revisited. **This plan is that revisit.** If that sentence is already on master when 6a starts, 6a rewrites it so a product read goes through `ProductRepository.find`. If #148 has not merged, 6a does not edit `AGENTS.md`.

## Ready-to-paste Grok Build prompt (6a)

```
Implement Phase 6a of the OpenMarket redesign in UnexpectedSoftware/openMarket, following
docs/design/plans/phase-6-products.md section "6a" exactly. Fresh branch from master, not from
PR #148. Follow AGENTS.md and /openmarket-architecture, and the read-model rule in this plan:
ProductRepository.find takes a frozen ProductsQuery criteria object and returns ProductView
read models. ProductsQuery is not a port. Delete the sell-grid query port and SqliteProductsQuery
in the same PR. No compatibility wrapper and no second query port. Do not edit files PR #148
has touched while that PR is open. Plain JS + JSDoc + checkJs, React 15 (no hooks, Fragments,
portals, forwardRef, new context). Money is integer cents. Keep unit and integration tests green.
Run npm test, npm run typecheck, and mutation on the new domain/product files. PR body must
contain "Version: minor" and the keywords in the plan. Do not merge and do not release.
```

The 6b prompt is the same with "6b", the 6b section, and screenshots of the table in the four themes. The 6c prompt is the same with "6c", the 6c section, and screenshots of the drawer. 6b and 6c also run `npm run build` and `xvfb-run -a npm run test:ui`.

## What exists today (verified on master cc9a913)

- Route `/list_products` → `user_interface/product/list_products/`. Heading "List Products". A card grid (not a table): photo, name, category, barcode, stock, price through `formatMoney`, status text **"Enabled" / "Disabled"**, and raw buttons "View" and "Disable". Infinite scroll (`catalogLimit` 20, keyset cursor). Filters: search (debounced 300 ms), low stock, status All/Enabled/Disabled, category radios, sort by name or stock. "Nuevo producto" links to `/create_product`. A print icon calls `products_print_catalog_use_case`.
- Empty states already differ (`list_products/Container.js` `catalogStatus`): filters active → "No products match these filters" + "Quitar filtros"; no products → "Aún no hay productos" + a link "Crear producto". There is no e2e for the fresh catalog (OM-08 #71). Copy is mixed English and Spanish.
- The list epic calls `products_list_all_use_case.findCatalog`, which returns **`Product` aggregates**, then `toCard` reads `product.category`, `product.price`, and `ImageStore.readDataUrl`. That epic imports `infrastructure/service/ImageStore`. The import is a `KNOWN_VIOLATIONS` line in `architecture.spec.js`, next to the same import in `new_product/epic.js`.
- **Edit is another screen.** `LIST_PRODUCTS_DETAIL` loads the aggregate with `products_find_use_case.findProductByBarcode` and pushes `/create_product?edition=true`. `new_product/reducer.js` handles `LIST_PRODUCTS_DETAIL_LOADED` and fills redux-form. Informes (`home/MostSoldContainer`) and a category card (`category/Container.js`) dispatch the same action. The form heading is "Let's create a new product!" / "Let's edit a product!".
- The form (`new_product/ReduxForm.js`) already maps status keys through `STATUS_LABEL`: ENABLED → "Activo", DISABLED → **"Desactivado"** (OM-22 #85 asked for "Inactivo"). Fields: name, barcode (read-only when editing), description, image, weighted checkbox "Weighted", status `<select>`, price, base price, IVA (`VatRate.options()`), stock, stock minimum, category. Under an edit, `ProductSales` shows units sold. "Find image" runs only when creating (`products_find_image_use_case`, OpenFoodFacts).
- `e2e/products.spec.js` creates a product, edits it (barcode readonly, VAT `S1:10`, price), filters, sorts, disables, and scans the disabled barcode on Vender so `EnableProduct` turns it back on and adds 1. `e2e/launch.js` opens the form via Productos → "Nuevo producto". `e2e/shell.spec.js` and `e2e/themes.spec.js` expect the heading "List Products".
- **Sell grid** (`new_order/epicFactory.js` `makeSaleTilesEpic`) calls `products_list_for_sale_query` → `ProductsQuery#listForSale` → `SqliteProductsQuery`. The port returns a `SaleTile` `{barcode, name, priceCents, vatRate, weighted, lowStock, imageUrl}` for **enabled** products, name/barcode `LIKE`, optional category, default limit 24, cap 80. Contract: `describeContract(ProductsQuery, SqliteProductsQuery)`.
- Write path, unchanged by the reads: `Product` is the aggregate (`addStock`, `subtractStock`, `enable`, `disable`, `isStockLow`, `changeVatRate`). `findByBarcode` returns that aggregate for `CreateOrder`, `DisableProduct`, `EnableProduct` (enable + 1 stock + `ProductEnabledAgain`), `AddStock`, and `FindProduct`. `CreateOrUpdateProduct` builds a new `Product` through the factory and `save`s it (a replace, not load-then-mutate). `DisableProduct` sets DISABLED and **keeps the row** so old tickets still point at the barcode. There is no `remove`.
- Table `product`: `barcode` primary key, `name`, `description`, `price`/`price_cents`, `base_price`/`base_price_cents`, `vat_percent`/`vat_kind`/`vat_cause` (per-product VAT, prices VAT-included), `stock`/`stock_min` REAL, `status`, `weighted`, `category_id`, `image_name`.
- `ProductRepository.findCatalog` / `countCatalog` (keyset, `SqliteProductQueryService`) still feed the list and `PrintProductCatalog`. `ProductSaleStatisticsRepository` is a different read model and stays its own port.
- Phase 3 components to use: `PageHeader`, `DataTable`, `Button`, `IconButton`, `Badge`, `EmptyState`, `Skeleton`, `Dialog`, `TextField`, `NumberField`, `Select`, `ImageField`. There is no drawer variant yet. `Dialog` is in-place (React 15, no portals) and already traps focus.

## Target layout (mockup A-products)

One screen on `/list_products`, inside the Phase 1 shell. Tokens only (`--om-color-*`, `--om-space-*`, `--om-font-*`, `--om-radius-*`, `--om-shadow-*`). No new hex or rgb.

- **Header:** `PageHeader` "Productos". Primary `Button` "Nuevo producto". The catalog-print `IconButton` stays in the header (see open questions).
- **Toolbar:** search `TextField` "Buscar por nombre o código"; category `Select` (Todas + the categories already loaded); status chips **Todos / Activos / Inactivos** (44 px `Button`s, one selected); an "A peso" toggle; sort "Ordenar por nombre" with the four orders the list has today (nombre A–Z / Z–A, stock bajo–alto / alto–bajo). Changing any of them fetches immediately. No Filter button. `/list_products?lowStock=1` (the existing redirect from `/list_products_low_stock`) still applies and shows a "Stock bajo" chip.
- **Table:** `DataTable`, sticky header, no padded empty rows. Columns: product (thumbnail + name + category), código de barras, PVP (right, `formatMoney(Money.ofCents(priceCents))`), margen (right, integer percent), stock (right; weighted rows show kilograms, e.g. `12,4 kg`), estado (`Badge` "Activo" success / "Inactivo" neutral, text as well as colour), and an "Editar" ghost button per row. A low row also says "bajo" next to the quantity (`Badge` warning). Footer: "Mostrando 1–20 de N" and anterior / siguiente. Page size stays 20.
- **Drawer (6c):** `Dialog` with `placement="drawer"` (right, full height, same focus trap). Title "Editar producto" or "Nuevo producto". Photo, name, category, PVP, coste, margen computed ("margen sobre PVP"), IVA, código de barras, stock, stock mínimo, "Se vende a peso", "Activo". Footer: Eliminar (danger, edit only), Cancelar, Guardar (the one primary button).

Margin matches the mockup, on the stored VAT-included amounts, half-up to an integer percent: Manzana 1,20 € / 0,70 € → 42, Leche 1,85 € / 1,15 € → 38. Formula `(priceCents - baseCents) / priceCents`. Price 0 shows "—". A cost above the price shows a negative percent. Do not subtract VAT before dividing.

## 6a — read model, and the sell grid drops the query port

Replace the port. Do not keep `listForSale` as a wrapper, do not keep the facade key `products_list_for_sale_query`, and do not keep `SqliteProductsQuery`.

1. **`domain/product/ProductsQuery.js` becomes a frozen criteria value**, the same kind of object as an orders criteria. It is not a port and it does not check the range.

   ```js
   export default class ProductsQuery {
     constructor({text, categoryId, status, weighted, lowStock, sort, limit, offset, forSale}) {
       this.text = text || null;
       this.categoryId = categoryId || null;
       this.status = status || null;       // ENABLED, DISABLED, or null for both
       this.weighted = weighted == null ? null : !!weighted;
       this.lowStock = !!lowStock;
       this.sort = sort || 'name_asc';
       this.limit = limit;
       this.offset = offset || 0;
       this.forSale = !!forSale;           // sell grid: ENABLED only
       Object.freeze(this);
     }
   }
   ```

2. **`domain/product/ProductView.js`**, one list row. Frozen. It does not construct a `Product` and does not run write checks (a stored row was valid when it was saved). Fields: `barcode`, `name`, `categoryId`, `categoryName`, `priceCents`, `basePriceCents`, `marginPercent` (null when `priceCents` is 0), `vat` `{kind, percent, cause}` plain data, `stock`, `stockMin`, `weighted`, `status`, `lowStock`, `imageUrl`. `marginPercent` and `lowStock` are derived in the constructor from those numbers (`lowStock` is the same comparison as `Product.isStockLow`: missing stock or minimum is not low). The pure function lives in `domain/product/margin.js`: `marginPercent({priceCents, baseCents})`.
3. **`ProductRepository.find(query)`** → `Observable<{items: ProductView[], total: number}>`. `total` counts the whole filter, not the page. Adapter `SqliteProductRepository`: one SELECT joining `category` for the name, money via `service/storedMoney` (`*_cents` first, legacy REAL fallback), `ORDER BY` the same four sorts as the catalog, `LIMIT`/`OFFSET`. `forSale` forces `status = ENABLED`, applies today's 24 default and 80 cap, and matches name or barcode. The management list does not use that cap. Image URL comes from the existing product image store inside the adapter (`imageUrl` null when there is no file). Rows that fail to map are not turned into aggregates.
   SQL clause building stays in `SqliteProductQueryService`, injected only into this repository. No new query class, no new port.
4. **`findByBarcode` still returns the `Product` aggregate.** Write use cases keep using it, and so does the Vender barcode scan (`FindProduct`), which loads the aggregate to subtract stock or enable. The products screen and the sale-tile list do not call it.
5. **`ListAllProducts.list(query)`** forwards to `find`. Facade key stays `products_list_all_use_case`. The sell epic builds `new ProductsQuery({text, categoryId, limit, forSale: true})` and reads `barcode`, `name`, `priceCents`, `vat`, `weighted`, `lowStock`, `imageUrl` off each `ProductView`. `makeSaleTilesEpic` takes that use case. Delete `_productsQuery` from the container and the contract pair `ProductsQuery` / `SqliteProductsQuery`.
6. **Leave `findCatalog` / `countCatalog` in place** for `PrintProductCatalog` and for the current list until 6b. That is the existing catalog finder, not a wrapper around the deleted port.

The card grid, the edit page, and `e2e/products.spec.js` stay as they are. The sell grid must still show the same enabled products.

**6a tests**

- Unit: `marginPercent` (38 and 42 from the mockup cents, price 0 → null, cost above price → negative, a non-integer or non-finite input → null so a bad stored price does not throw on screen). `ProductView` freezes, does not call `Product`, and sets `lowStock` only when both stock and minimum are present. `ProductsQuery` does not throw on an empty object, defaults `sort` to `name_asc` and `offset` to 0, and freezes.
- `makeSaleTilesEpic`: `forSale: true`, `switchMap` drops the previous search, failure → `saleTilesFailed`. The epic file no longer mentions `products_list_for_sale_query`.
- itest replaces `ProductsQuerySpec`: two enabled products and one disabled; `forSale` returns only the enabled ones, ordered by name, with cents, VAT, `lowStock`, and `!(item instanceof Product)`; a management `find` with `status: null` includes the disabled row and reports `total`; category and text filters; `imageUrl` null when no image store. Contract test no longer lists the deleted port.
- Mutation on `domain/product/margin.js` and `ProductView.js` (`npm run coverage` then `npm run mutate`). No new `KNOWN_VIOLATIONS` line.

**6a closes:** nothing. Refs #98.

## 6b — table, margin, status labels, empty states

Reshape `list_products/` onto the `new_order` file set. One slice, `state.listProducts`. The component dispatches; the reducer calls `model.js`; the epic calls the use case.

| File | Role |
|---|---|
| `model.js` | `state()` and pure updates: `pageOpened`, `queryChanged`, `filtersChanged`, `pageChanged`, `productsLoaded`, `productsFailed`, `categoriesLoaded`. Holds the criteria, `items` (plain view fields), `total`, `offset`, `loading`, `error`. No React, no Redux, no RxJS. `Money` is allowed for display helpers the reducer does not need. |
| `action.js` | Request/result pairs: `PRODUCTS_PAGE_OPENED`, `PRODUCTS_QUERY_CHANGED`, `PRODUCTS_FILTERS_CHANGED`, `PRODUCTS_PAGE_CHANGED`, `PRODUCTS_LOADED`, `PRODUCTS_FAILED`, `PRODUCTS_CATEGORIES_LOADED`. Keep the print and disable actions until 6c moves disable into the drawer. |
| `reducer.js` | Delegates to `model.js`. Registered where it already is. |
| `epicFactory.js` | `makeProductsListEpic(listProducts)`. `switchMap`, so the latest filter or page wins. `makeCategoriesEpic`. Search stays debounced 300 ms in the query epic. |
| `epic.js` | `OpenMarket.get('products_list_all_use_case')` and `categories_list_all_use_case`. No `ImageStore` import. |
| `Container.js` | Renders props and calls action creators. No `OpenMarket.get`. No `setState` for the list, the filters, the page, or the error. |
| `ReduxConnector.js` | `connect` on `state.listProducts`. Routes import this file. |
| `ProductTable.js`, `ProductFilters.js`, `statusLabel.js` | Presentational. `statusLabel('ENABLED')` → "Activo", `statusLabel('DISABLED')` → "Inactivo". |

1. The list epic calls `list(new ProductsQuery({...}))` and stores `ProductView` fields. It does not call `findCatalog` and does not map a `Product`. Drop the infinite-scroll sentinel. Paging is offset += 20.
2. **OM-08 (#71).** Fresh catalog: `EmptyState` "Aún no hay productos", "Crea el primer producto para venderlo.", action "Crear producto" linking to `/create_product`. Search "zzz" (or any active filter) with zero rows: "Ningún producto coincide con estos filtros" and "Quitar filtros", which clears text, chips, "A peso", "Stock bajo", and category, and pushes `/list_products` when the low-stock query is on. Loading uses `Skeleton` rows inside `DataTable`. Failure uses the inline error and a retry.
3. **OM-22 (#85), list half.** The estado column uses `statusLabel`. The raw enum and the English Enabled/Disabled strings leave this screen.
4. Row "Editar" still dispatches `listProductsDetail`, which still opens the old form, so the edit e2e has a button to click. "Desactivar" still calls `products_disable_use_case`. 6c removes both row actions' old destinations.
5. Copy on this screen, Spanish (OM-25 #88, products part): "Productos", "Nuevo producto", "Buscar por nombre o código", "Categoría", "Todas", "Todos", "Activos", "Inactivos", "A peso", "Stock bajo", "Ordenar por nombre", "PVP", "Margen", "Editar", "Desactivar", "Mostrando 1–20 de N". Money only through `formatMoney`. Stock kilograms through a small UI helper, es-ES, suffix `kg` when `weighted` is true. The old form's English headings stay until 6c.
6. Remove the `list_products/epic.js → ImageStore` line from `KNOWN_VIOLATIONS` in this PR. The test fails if a fixed line is left behind. Do not remove the `new_product` line yet.
7. Update `e2e/launch.js` (`openProductList` heading "Productos"), `e2e/products.spec.js` (table rows instead of `.product-card`, status "Activo"), and only the Productos heading in `shell.spec.js` / `themes.spec.js`.

**6b tests**

- Unit: `statusLabel`; `model.js` page math ("Mostrando 21–40 de 50", last page, empty); reducer; `makeProductsListEpic` (switchMap cancels the previous filter, failure → `PRODUCTS_FAILED`, the criteria is a `ProductsQuery`).
- Component: `ProductTable` renders margin, "Activo", the weighted stock text, and the empty node it is given.
- e2e: fresh user data → Productos shows "Crear producto" (#71). Create two products, the table shows margin 50 for a 2 € / 1 € product and status "Activo". Search "zzz" shows the no-match empty state and "Quitar filtros", and clearing it brings the rows back. Sort and the Dairy category filter still narrow the table. Disable still flips the badge to "Inactivo" and the sell-screen scan still re-enables. Screenshots at 1366×768 of the table in Mercado, Mostrador Noche, Ultramarinos, and Unexpected Neon into `docs/design/after/products-<theme>.png`.

**6b closes:** #71. Refs #98, #85, #88.

## 6c — drawer, and the edit page stops being the editor

1. **`domain/product/ProductDetail.js`**, frozen, no write checks. The view fields plus `description` and `imageName`. **`ProductRepository.findDetail(new ProductDetailQuery({barcode}))`** completes empty when the barcode is unknown. `ProductDetailQuery` is a frozen criteria value, not a port. **`ListAllProducts.detail(query)`** forwards it. The adapter selects one row and resolves `imageUrl` the same way as `find`.
2. **Drawer state lives in the same `listProducts` model** (`drawerOpen`, `mode: 'create'|'edit'`, `draft`, `errors`, `saving`). `new_order` + `PaymentSheet` is the pattern. Do not put the draft in `setState`, redux-form, or the `new_product` slice.
   - `PRODUCTS_DRAWER_OPENED` `{mode, barcode?}` → epic loads `detail` for edit, or an empty draft for create (status ENABLED, `VatRate.standard()`).
   - `PRODUCTS_DRAFT_CHANGED` updates one field. Margin updates from `marginPercent` as price or cost changes.
   - `PRODUCTS_SAVE` → `products_create_or_update_use_case` → `PRODUCTS_SAVED` (toast "Producto guardado", close, reload the page) or `PRODUCTS_SAVE_FAILED` (inline field errors).
   - `PRODUCTS_ARCHIVE` → confirm `Dialog`, then `products_disable_use_case` → badge Inactivo, drawer closes. This is **not** `EnableProduct.enableForSale` (that path adds 1 stock and is the cashier scan). Turning Activo on and pressing Guardar saves status ENABLED through `CreateOrUpdateProduct`, also without the +1.
3. **`Dialog` `placement="drawer"`** in `components/Dialog.js`: a modifier class in `om-dialog.scss`, anchored to the end, full height, `--om-color-overlay`, `--om-shadow-lg`. Esc and × call `onClose`, Enter on the primary button saves, focus moves in and returns. React 15: no portal. While the drawer is open, Guardar is the only primary button; the header "Nuevo producto" renders as `secondary`.
4. **Fields and validation** use the recommended default in "Open questions" until Victor decides. Client rules match the current form: name required, barcode required and max 15 and read-only on edit, price and base price > 0, stock ≥ 0, stock minimum > 0, category required, VAT a `VatRate` code. Errors sit on the field (`aria-describedby`), not in a toast. `NumberField` unit `€` for money. IVA `Select` from `VatRate.options()`. "Se vende a peso" and "Activo" are switches, not a select of `ENABLED`.
5. **Image.** `ImageField` shows `imageUrl`. On create, "Buscar imagen" still calls `products_find_image_use_case`. The epic does not import `ImageStore`; the detail already carries `imageUrl`. On save, pass `imagePath` only when the user picked a file, as today.
6. **Stop mutating `new_product`.** Delete the push to `/create_product?edition=true` and the `LIST_PRODUCTS_DETAIL_LOADED` handling in `new_product/reducer.js`, `epic.js`, and `epicFactory.js`. `listProductsDetail(barcode)` from Informes and from a category card navigates to `/list_products` and opens the edit drawer (the store survives the route change; `pageOpened` must not clear a drawer the navigation just requested). `/create_product` renders the list with the create drawer open, so "Nuevo producto" and `e2e/launch.js` keep a URL. The sell-screen `new_product_dialog` is a different dialog and stays.
7. **`ProductSales`** is not in the drawer under the recommended default. Leave `product_sale_statistics_use_case` registered. If the default holds, delete the chart from the product route and then remove the `new_product/epic.js → ImageStore` `KNOWN_VIOLATIONS` line. If Victor wants the chart kept, leave that line and the chart, and do not block the drawer on it.
8. Shortcuts on this screen: `/` focuses search, Enter on a row opens the drawer, Esc closes it. They must not take F2, F3, or F4.

**6c tests**

- itest `findDetail`: VAT, cents, category name, weighted, description; unknown barcode completes empty; the object is not a `Product`.
- Unit: draft reducer (edit locks the barcode, margin follows the cents, validation failures do not save); save epic maps a typed error to `PRODUCTS_SAVE_FAILED`; archive epic calls disable and does not call `enableForSale`.
- e2e: Editar opens the drawer (heading "Editar producto"), barcode readonly, change name and price and IVA, Guardar, the row updates, reopen shows `S1:10`. The Activo control shows the word "Activo" (#85). Desactivar-from-the-row is gone; archiving from the drawer sets "Inactivo", and the sell-screen scan still re-enables and adds 1. Create from "Nuevo producto" validates an empty Guardar ("Obligatorio" on the name) and then saves. Screenshots of the drawer in the four themes into `docs/design/after/products-drawer-<theme>.png` at 1366×768.

**6c closes:** #98, #85. Refs #88.

## Constraints

- React 15 only. No hooks, Fragments, or portals. Dialog focus uses `initialFocusRef` objects.
- Components from `user_interface/components/` and `--om-*` tokens only. No new hex or rgb. A drawer is a `Dialog` variant, not a new component.
- Unidirectional Redux, `new_order` as the template. Screen data (rows, filters, page, drawer draft, errors, saving) lives in the store. `setState` is only for purely visual state that nothing else reads (a tooltip, a hover). The current list has no `setState`; do not add any for the catalog.
- Dependency rule: UI, application, and infrastructure may depend on the domain. The domain imports none of them. The UI calls use cases through `OpenMarket.get` from epics only. It may use `Money`, `VatRate`, and `marginPercent` directly. It does not import SQLite, the container, or `ImageStore`.
- Reads: `ProductRepository.find(new ProductsQuery(...))` → `ProductView`, `findDetail(new ProductDetailQuery(...))` → `ProductDetail`. No invariant checks on those objects. No separate query port and no query service that a use case imports. Writes: load the `Product` aggregate, call its methods, `save`, only from write use cases. `findByBarcode` stays the write finder.
- Money is integer cents. Per-product VAT is the columns already on `product` (`VatRate`). Formatting only in `i18n/money`.
- Do not add a `KNOWN_VIOLATIONS` line. Delete one only in the PR that removes the import.
- Do not touch invoice numbering, the VeriFactu payload, or the plugin protocol.

## Out of scope

- Categories screen (roadmap item 4). Category cards keep dispatching `listProductsDetail`.
- Settings (OM-26 #89), including a shop-default VAT. The product keeps its own rate.
- Bulk select, import/export, a stock ledger, and barcode reprint labels.
- Rewriting `CreateOrUpdateProduct` into load-then-mutate. A full edit remains a factory replace. New invariants, if a later change needs them, go on `Product` methods the use case calls, not in the repository and not on `ProductView`.
- `PrintProductCatalog` and `findCatalog` (6a/6b leave them for the print use case).
- The sell-screen `new_product_dialog` and `EnableProduct` (scan a disabled barcode, +1 stock).
- `ProductSaleStatisticsRepository` and the Informes charts.
- A plugin slot on this screen.

## Open questions for Victor

Product decisions. Each item has a recommended default. Implementation PRs follow the default until you answer.

1. **Which fields are editable?** The drawer can edit name, description, category, PVP, coste, IVA, barcode (create only; read-only on edit), stock, stock mínimo, "Se vende a peso", Activo, and the photo. Margen is computed. Description stays even though the mockup crops it. **Default:** those fields; barcode stays the identity and cannot change on edit.
2. **Bulk actions?** The mockup has no checkboxes. Today disable is one product at a time. **Default:** no bulk actions in this phase.
3. **Stock adjustments?** The form today overwrites stock and stock mínimo with the typed numbers. `AddStock` and the sell-screen +1 are separate. **Default:** Guardar writes the typed stock through `CreateOrUpdateProduct`. No delta, no reason, no movement ledger.
4. **Deletion vs archiving?** The mockup's Eliminar is danger-styled. `DisableProduct` already keeps the row so old tickets still resolve, and there is no `remove`. **Default:** Eliminar asks for confirmation, then disables. The product stays as Inactivo and leaves the sell grid. No `DELETE FROM product`.
5. **Image support?** Create already has `ImageField` and an OpenFoodFacts lookup; edit does not look up. The mockup shows a photo well and no lookup button. **Default:** keep the photo on the row and in the drawer, keep the lookup on create only, and do not add a camera or a second image source.
6. **Sales chart?** `ProductSales` sits under the edit form today and is not in the mockup. **Default:** the drawer does not show it. The statistics use case stays registered for Informes.
7. **Catalog print?** The header has a print icon the mockup does not draw, and `e2e/products.spec.js` expects it. **Default:** keep the icon on the Productos header.

## Suggested implementation PR bodies

6a:

```
Phase 6a: product reads go through ProductRepository.find (ProductsQuery criteria, ProductView). The sell grid uses that find. The ProductsQuery port and SqliteProductsQuery are removed.
Refs #98
Version: minor
```

6b:

```
Phase 6b: products table on ProductView, margin, Activo/Inactivo, paged filters, distinct empty states.
Closes #71
Refs #98 #85 #88
Version: minor
```

6c:

```
Phase 6c: product edit drawer on ProductDetail. The create/edit page is no longer the editor. Archiving disables, it does not delete.
Closes #98
Closes #85
Refs #88
Version: minor
```

## Rationale (architecture decisions, Oct 2026)

- A product list is a read. `ProductView` / `ProductDetail` carry the stored columns and the two derived display facts (margin, low stock) and they do not re-run sale or catalog rules. `Product` stays the write aggregate, loaded only by write use cases.
- The sell grid was the last caller of the `ProductsQuery` port. Moving it in 6a means the port, the adapter, and the facade key disappear together. `findCatalog` remains because print still pages aggregates; it is not a stand-in for the port.
- Editing through `/create_product` couples the list to the redux-form slice the same way order detail used to couple to the sell screen. The drawer lives in the list slice, so Informes and categories open it by navigating to `/list_products` instead of filling another screen's form.
- Margin is `(priceCents - baseCents) / priceCents` on VAT-included cents so the column, the drawer, and the mockup show one number.
