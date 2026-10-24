# Phase 7 — Categories card grid (plan)

> Status: planned. Depends on Phase 3 (#137), which is merged. **Independent of Phase 6a (#153), which is open and unmerged.** Split into **7a**, **7b**, **7c**, and **7d**, one PR each, in that order.
> No umbrella issue. Spanish copy on this screen is the categories part of OM-25 #88. 44 px targets on this screen are the categories part of OM-16 #79. Neither issue closes here.
> No categories mockup. Before: `docs/design/before/05-categories.webp` (v1.14 list, not the current cards). Tokens and components: [DESIGN.md](../DESIGN.md). Card/tile is the layout for this screen.

This is roadmap item 4. It is numbered phase 7 because products took phase 6. Settings stays the later roadmap item (OM-26 #89).

## Ordering against Phase 6

Branch every implementation PR from **master**. Do not branch from `cursor/products-read-model-6a-521b`.

| Work | When |
|---|---|
| **7a** read model | Can start while #153 is open. Product counts are already a join on `category` / `product` inside `SqliteCategoryRepository`. They do not go through `ProductRepository.find` or `ProductView`. 7a must not edit a file #153 has touched (list below). |
| **7b** card grid and dialog | After 7a is on master. No dependency on 6b or 6c. |
| **7c** delete confirmation | After 7b is on master. No dependency on 6b or 6c. |
| **7d** product links | After 7c **and** Phase 6b are on master. 6b rewrites `list_products/`. The filtered URL `/list_products?category=<id>` is not in the 6b plan, so 7d adds it on top of the list 6b left. The most-sold control keeps dispatching `listProductsDetail`. Phase 6c is what makes that action open the product drawer. 7d does not implement the drawer. If 6c is already on master, the e2e expects the drawer heading. If it is not, the e2e expects the edit form that master still has, and 7d does not edit the product editor. |

#153 edits these files. While that PR is open, categories work does not edit them:

`.grok/skills/openmarket-architecture/SKILL.md`, `AGENTS.md`, `src/openMarket/domain/AGENTS.md`, `src/openMarket/application/index.js`, `src/openMarket/infrastructure/dic/Container.js`, `src/openMarket/application/service/product/ListAllProducts.js`, `src/openMarket/domain/product/ProductRepository.js`, `src/openMarket/domain/product/ProductView.js`, `src/openMarket/domain/product/ProductsQuery.js`, `src/openMarket/domain/product/margin.js`, `src/openMarket/infrastructure/product/SqliteProductQueryService.js`, `src/openMarket/infrastructure/product/SqliteProductRepository.js`, `src/openMarket/infrastructure/product/SqliteProductsQuery.js`, `src/openMarket/user_interface/order/new_order/epic.js`, `src/openMarket/user_interface/order/new_order/epicFactory.js`, and the product/new-order tests listed on that PR (`ProductViewSpec`, `ProductsQuerySpec`, `ListAllProducts.spec`, `ports.spec.js`, `margin.spec`, `SqliteProductQueryService.spec`, `saleTilesEpic.spec`, `new_order/Container.spec.js`).

7a does not need `application/index.js` or `Container.js`. The facade key `categories_list_all_use_case` already exists. `list` is a new method on `ListAllCategories`. `find` is a new method on the existing repository. No new container factory.

`e2e/shell.spec.js` and `e2e/themes.spec.js` assert the heading "Categories". 7b changes only that Categorías heading line. Leave the Productos line as it is on the branch you started from. If a products PR is open and has touched those two files, rebase and still change only the Categorías line.

## Ready-to-paste Grok Build prompt (7a)

```
Implement Phase 7a of the OpenMarket redesign in UnexpectedSoftware/openMarket, following
docs/design/plans/phase-7-categories.md section "7a" exactly. Fresh branch from master, not from
PR #153. Follow AGENTS.md and /openmarket-architecture. CategoryRepository.find takes a frozen
CategoriesQuery criteria object and returns CategoryView read models. CategoriesQuery is not a
port. Do not add a query port. Leave findAllWithStats and CategorySummary in place. Do not edit
any file PR #153 has touched while that PR is open (the list is in the plan). Plain JS + JSDoc +
checkJs. Money on the view is integer cents. Keep unit and integration tests green. Run npm test,
npm run test:integration, npm run typecheck, and mutation on the new domain/category files.
PR body must contain "Version: patch" and the keywords in the plan. Do not merge and do not release.
```

The 7b prompt is the same with "7b", the 7b section, screenshots of the grid and the dialog in the four themes, and `Version: minor`. 7b also runs `npm run build` and `xvfb-run -a npm run test:ui`. The 7c prompt is the same with "7c", the 7c section, and `Version: minor`. The 7d prompt is the same with "7d", the 7d section, and `Version: minor`, and it starts only after 6b is on master.

## What exists today (verified on master 0030ced)

- Route `/categories` → `user_interface/category/ReduxConnector.js` → `Container.js`. Heading **"Categories"**. A wrapping row of fixed 200 px cards. The first card is always a draft (`.category-card.is-draft`) with a name field, a photo drop target, and **Save**. There is no separate "add" button and no empty state. Saved cards follow, sorted in the epic with `localeCompare`.
- A saved card (`CategoryCard.js`) keeps the name, the error, the file error, and the preview blob in **`this.setState`**. Blur or Enter renames. Escape restores the previous name. A blank name shows "Required". The photo has 28 px icon buttons "Change image" and, when a photo is stored, "Use default image". Dropping a file on the card replaces the photo. `chosenImagePath` rejects anything that is not JPEG, PNG, GIF, or WebP with the English sentence from `ImageField.js`.
- Facts on every saved card, in English: **Products** (count), **Value** (sum of base prices, `formatMoney`, title "Sum of base prices"), **Stock** (`formatUnits`), **Most sold** (product name, or "—"). The most-sold name is an `<a href="#/create_product?edition=true">` that dispatches `listProductsDetail(barcode)`. That is the same action Informes uses. It loads the product aggregate and pushes the edit form ("Let's edit a product!").
- **Delete** is a button "Delete" / aria-label "Delete category", rendered only when `productCount === 0`. It uses `window.confirm('Delete ' + name + '?')`. A category that still has products has no delete button. `DeleteCategory` → `CategoryRepository.remove`. The SQL deletes only when no `product.category_id` points at the row, and otherwise raises `CategoryNotEmptyError` (`CATEGORY_NOT_EMPTY`). Unknown id raises `CategoryNotFoundError`. There is no status column and no disable.
- The draft and the card do not use `PageHeader`, `Card`, `Button`, `TextField`, `Dialog`, or `EmptyState`. Styles in `style/components/categories.scss` mix tokens with `$sp-base`, raw px, a 28 px target, and `float` on Save. `.image-drop` and `.image-file` in that file are also used by `components/ImageField.js` (the product form). `file.scss` already imports `categories.scss`.
- Copy and toasts are English, with an exclamation mark: "Category saved!", "Changes applied", "Category deleted", "Required". `e2e/shell.spec.js` and `e2e/themes.spec.js` expect the heading "Categories". `e2e/categories.spec.js` covers inline create (plain and photo), inline rename, Escape, the bad-file message, image swap, narrow stacking at 380 px, the four facts, a sale that drops stock from 4 to 3 and sets most sold to "Milk", the most-sold link opening the edit form, and delete of an empty category via `window.confirm`.
- **Read path.** `categories_list_all_use_case` is `ListAllCategories.findAllWithStats()` → `CategoryRepository.findAllWithStats()` → `CategorySummary`. The summary is not frozen. `basePriceTotal` is a **euro float**: the SQL sums cents and then divides by 100. `productCount` counts every product row for that category, enabled or not. `stockTotal` is `SUM(stock)`. Most sold is the top `product_sale_day` row for the category (`quantity DESC, amount DESC, name ASC`). The categories epic then calls `ImageStore.readDataUrl` itself. That import is a `KNOWN_VIOLATIONS` line: `user_interface/category/epic.js -> infrastructure/service/ImageStore`. The same `findAllWithStats` call loads the category radios on the product list and the `<select>` on the product form (`list_products/epic.js`, `new_product/epic.js`). They only use `id` and `name`.
- **Write path, unchanged by the reads.** `Category` is a data holder (`id`, `name`, `imageName`) with getters and no methods. `CreateCategory` builds one through `CategoryFactory` and `save`s it (insert). `UpdateCategory.updateCategory` calls `repository.update({id, name})`. `replaceImage` / `removeImage` call `updateCategory` / `clearImage` on the repository. `FindCategoryById` returns the `Category` aggregate. `findAll()` also returns aggregates and is what `FetchCatalogImages` uses to fill missing photos from Wikimedia. Table `category`: `id`, `name`, `image_name`. No colour, no icon, no position.
- `user_interface/image/epicFactory.js` dispatches `categoriesPageLoaded()` when a catalog photo fetch finishes on `/categories`. That action name has to keep working.
- Phase 3 components to use: `PageHeader`, `Toolbar`, `Card`, `Button`, `IconButton`, `TextField`, `Dialog`, `EmptyState`, `Skeleton`. `Dialog` is in-place (React 15, no portals), traps focus, and closes on Esc. It has no drawer placement. That placement is Phase 6c's change to `Dialog.js`. This phase does not edit `Dialog.js`. `IconButton` is 44 px (`--om-button-height` / `--om-control-height`). Tile tokens already exist: `--om-tile-min-width`, `--om-tile-image-height`, `--om-tile-radius`.

## Target layout

One screen on `/categories`, inside the Phase 1 shell. Tokens only (`--om-color-*`, `--om-space-*`, `--om-font-*`, `--om-radius-*`, `--om-shadow-*`, `--om-tile-*`). No new hex, rgb, or raw px in the rules this phase adds. No new token. The screen is a **card grid**. Do not put categories in `DataTable`. DESIGN.md uses the table for lists the user scans as rows, and the card/tile for categories.

- **Header:** `PageHeader` "Categorías". Primary `Button` "Nueva categoría". While the dialog is open, that header button renders as `secondary`, so Guardar is the only primary button.
- **Toolbar:** search `TextField` "Buscar por nombre". Changing it refetches. No sort control and no Filter button.
- **Grid:** `repeat(auto-fill, minmax(var(--om-tile-min-width), 1fr))`, gap `--om-space-4`. Each category is a `Card as="article"`. Photo on top (`--om-tile-image-height`, `--om-tile-radius`), the stored image or `resources/category-placeholder.svg`. The name is text, not an input. Under the name, the four facts from the open-question default: **Productos**, **Valor** (`formatMoney(Money.ofCents(basePriceCents))`, title "Suma de precios de coste"), **Stock** (`formatUnits`), **Más vendido** (the product name, or "—"). Explicit buttons, not one click target for the whole card: ghost "Editar", "Eliminar" when the category has no products (7b still uses `window.confirm`; 7c replaces that with a dialog), and the 7d "Ver productos" link.
- **Dialog (7b):** the existing centered `Dialog`. Title "Nueva categoría" or "Editar categoría". `TextField` "Nombre". Photo via `ImageField`, with Spanish label and error props added as optional (English strings stay the default so the product form does not change). Footer: Cancelar (secondary), Guardar (primary). Esc and × call `onClose` without saving. Enter in the name field saves. Focus starts on the name.
- **Empty:** no categories → `EmptyState` "Aún no hay categorías", "Crea la primera categoría para agrupar los productos.", action "Nueva categoría" opening the dialog. A search with zero rows and at least one category stored → "Ninguna categoría coincide con la búsqueda" and "Quitar búsqueda". Loading uses `Skeleton` cards. Failure uses an inline message and "Reintentar".
- **Delete (7c):** a second `Dialog` (`role="alertdialog"`), not `window.confirm`. Title "¿Eliminar {name}?". Body "Esta categoría no tiene productos.". Cancelar and Eliminar (danger). The card shows Eliminar only when `productCount === 0`.

There is no category colour, no icon glyph, and no drag handle.

## 7a — read model

Add the read. Do not switch the screen yet. Do not remove `findAllWithStats`.

1. **`domain/category/CategoriesQuery.js`**, a frozen criteria value, the same kind of object as `OrdersQuery`. It is not a port and it does not check the range.

   ```js
   export default class CategoriesQuery {
     constructor({text, sort, limit, offset}) {
       this.text = text || null;
       this.sort = sort || 'name_asc';
       this.limit = limit;
       this.offset = offset || 0;
       Object.freeze(this);
     }
   }
   ```

   `sort` other than `name_asc` is still stored and still means name order. There is no second sort in this phase. Omitted `limit` means every match (no `LIMIT` clause). The screen does not page.

2. **`domain/category/CategoryView.js`**, one card. Frozen. It does not construct a `Category` and does not run write checks. Fields: `id`, `name`, `imageUrl` (null when there is no file), `productCount`, `stockTotal`, `basePriceCents`, `mostSold` (`{barcode, name, quantity}` or null). No `imageName`. No euro float.

3. **`CategoryRepository.find(query)`** → `Observable<{items: CategoryView[], total: number}>`. `total` counts the whole filter, not the page. Adapter `SqliteCategoryRepository`. One SELECT with the same product-total and most-sold joins as `SUMMARIES_SQL`, plus `WHERE name LIKE ?` when `text` is set, `ORDER BY name COLLATE NOCASE ASC`, and `LIMIT`/`OFFSET` only when `limit` is a number. **`base_price_cents` is the integer sum.** Use the same cents-or-legacy-euro expression the current SQL uses (`base_price_cents`, else `ROUND(base_price * 100)`), and do not divide by 100. `productCount` still counts every product row, any status. `stockTotal` is still `SUM(stock)`. The ranking `ORDER BY` stays `quantity DESC, amount DESC, name ASC`. `imageUrl` comes from the category image store already injected into this repository (`readDataUrl`), null when there is no file. The epic must not be the thing that reads the file.

   Row folding for the new view goes in `SqliteCategoryQueryService` (`viewFrom`). `summaryFrom` stays and still returns `CategorySummary` with the euro float, so the product list and the product form keep their current call. The query service stays injected only into this repository.

4. **`ListAllCategories.list(query)`** forwards to `find`. Facade key stays `categories_list_all_use_case`. No `categories_list_query` key. **`findAllWithStats` stays** until the product list and the product form stop calling it. That is not this phase. `findById` and `findAll` still return the `Category` aggregate for `FindCategoryById` and `FetchCatalogImages`.

5. **No write changes.** Do not add `rename` on `Category`. Do not turn `update` / `updateCategory` / `clearImage` / `remove` into load-then-mutate. Do not add a repository method.

The card grid, `e2e/categories.spec.js`, and the `ImageStore` import in the categories epic stay as they are.

**7a tests**

- Unit: `CategoriesQuery` does not throw on `{}`, defaults `sort` to `name_asc` and `offset` to 0, stores a blank `text` as null, and freezes. `CategoryView` freezes, is not a `Category`, and accepts `mostSold: null`.
- `SqliteCategoryQueryService`: a row with `base_price_cents` 150 maps to `basePriceCents` 150; a row with null cents and `base_price` 1.5 maps to 150; a missing most-sold name maps to `mostSold` null. The mapper does not construct a `Category`.
- itest: two categories, one with a product at base 1,50 € and stock 4; `find(new CategoriesQuery({}))` returns `productCount` 1, `basePriceCents` 150, `stockTotal` 4, `mostSold` null, and `!(item instanceof Category)`; the empty category is `productCount` 0 and `basePriceCents` 0; `text` filters by name; `total` is the filter size; `imageUrl` is null when the image store has no file; order is by name. The existing `findAllWithStats` itest still passes.
- Mutation on `domain/category/CategoryView.js` and `domain/category/CategoriesQuery.js` (`npm run coverage`, then `npm run mutate`). No new `KNOWN_VIOLATIONS` line. No e2e in this PR.

**7a closes:** nothing. Refs #88.

## 7b — card grid, dialog, Spanish copy

Reshape `category/` onto the `new_order` file set. One slice, `state.categoriesPage` (the key already registered in `reducers/index.js`). The component dispatches; the reducer calls `model.js`; the epic calls the use case.

| File | Role |
|---|---|
| `model.js` | `state()` and pure updates: `pageOpened`, `queryChanged`, `categoriesLoaded`, `categoriesFailed`, `dialogOpened`, `dialogClosed`, `draftChanged`, `saveStarted`, `saved`, `saveFailed`. Holds `text`, `items` (plain view fields), `total`, `loading`, `error`, `dialog` (`null` or `{mode: 'create'\|'edit', id, name, imageUrl, imagePath, clearImage, nameError, fileError, saving}`). No React, no Redux, no RxJS. `Money` is allowed for a display helper the reducer does not need. |
| `action.js` | Request/result pairs for load, search, dialog, save, and delete. Keep `CATEGORIES_PAGE_LOADED` exported: `image/epicFactory.js` dispatches it. |
| `reducer.js` | Delegates to `model.js`. |
| `epicFactory.js` | `makeCategoriesListEpic(listCategories)` with `switchMap`, so the latest search wins. Search stays debounced 300 ms. `makeCategorySaveEpic`. |
| `epic.js` | `OpenMarket.get('categories_list_all_use_case')`, `categories_create_use_case`, `categories_update_use_case`. No `ImageStore` import. |
| `Container.js` | Renders props and calls action creators. No `OpenMarket.get`. No `setState` for the list, the search, the dialog draft, the errors, or saving. The window `dragover`/`drop` preventDefault that stops Electron opening a dropped file may stay as a mount listener. |
| `ReduxConnector.js` | `connect` on `state.categoriesPage`. Routes import this file. |
| `CategoryGrid.js`, `CategoryCard.js`, `CategoryDialog.js` | Presentational. `CategoryDraft.js` is deleted. |

1. The list epic calls `list(new CategoriesQuery({text}))` and stores `CategoryView` fields. It does not call `findAllWithStats`, it does not map a `Category`, and it does not sort a second time.
2. **Dialog draft lives in the slice.** Create opens an empty draft. Edit copies `name` and `imageUrl` off the list row. Do not call `findById` for the dialog (that returns the write aggregate and has no `imageUrl`). There is no `CategoryDetail`: a category has no further columns.
3. **Save** uses the use cases that already exist. Create: `createCategory({name, imagePath})`. Edit: `updateCategory({id, name})` only when the trimmed name changed, then `replaceImage` when `imagePath` is set, or `removeImage` when `clearImage` is set. Then reload and toast "Categoría guardada" (create) or "Cambios aplicados" (edit). A failed save stays on the dialog. Map `CATEGORY_NOT_FOUND` to "No se encuentra la categoría" on the dialog. Do not also toast the failure.
4. **Validation**, client side, matching today: trimmed name required, otherwise "Obligatorio" on the field (`aria-describedby`). No max length and no uniqueness check (the table has neither). A bad file uses the Spanish sentence below. ImageField's own `setState` for the blob preview is the shared component's visual state; the path and the error the screen reacts to live in the slice.
5. **`ImageField` optional props** `label`, `hint`, and `typeError`, defaulting to the English strings it has today ("Image", the drop hint, "Use a JPEG, PNG, GIF, or WebP image"). The category dialog passes "Foto", "Opcional. Suelta una imagen o elige un archivo", and "Usa una imagen JPEG, PNG, GIF o WebP". Do not change the default strings. Do not edit `Dialog.js`.
6. **Copy** on this screen, Spanish, no exclamation marks (OM-25 #88, categories part): "Categorías", "Nueva categoría", "Buscar por nombre", "Nombre", "Foto", "Guardar", "Cancelar", "Editar", "Eliminar", "Productos", "Valor", "Stock", "Más vendido", "Obligatorio", "Aún no hay categorías", "Crea la primera categoría para agrupar los productos.", "Ninguna categoría coincide con la búsqueda", "Quitar búsqueda", "Reintentar", "Cambiar imagen", "Usar imagen por defecto". The 7b confirm is still `window.confirm('¿Eliminar ' + name + '?')`. Money only through `formatMoney(Money.ofCents(...))`.
7. **Styles** for the grid live in `style/components/categories.scss`. New rules use `var(--om-…)` only. Leave the `.image-drop` and `.image-file` blocks as they are: `ImageField` and the product form still use them, and 6c owns that form. Delete the `.category-card*` rules this screen no longer renders, including the 28 px icons and the floated Save.
8. Remove the `category/epic.js → ImageStore` line from `KNOWN_VIOLATIONS` in this PR. The test fails if a fixed line is left behind. Do not remove the product or home lines.
9. Update `e2e/categories.spec.js` for the dialog (no `.is-draft`, no name `<input>` on the card). Update only the Categorías heading in `shell.spec.js` and `themes.spec.js`. Delete still goes through `window.confirm`, now with the Spanish question, and the button's accessible name is "Eliminar categoría". 7c replaces the confirm. The most-sold click still expects the edit form heading master has today ("Let's edit a product!"), unless 6c is already merged, in which case expect "Editar producto" and do not edit the drawer.

**7b tests**

- Unit: `model.js` (search text, dialog open/close does not drop the list, edit locks the id, a blank name does not start a save, Escape-shaped `dialogClosed` restores nothing because the draft is thrown away). Reducer delegates. `makeCategoriesListEpic` (`switchMap` cancels the previous search, failure → the failed action, the criteria is a `CategoriesQuery`). Save epic: create sends `name` and `imagePath`; edit skips `updateCategory` when the name is unchanged; a typed `CategoryNotFoundError` becomes the dialog error and not a success toast.
- Component: `CategoryCard` renders the four facts, "Editar", and the placeholder when `imageUrl` is null. `CategoryGrid` renders the empty node it is given.
- e2e: fresh user data → "Aún no hay categorías" and "Nueva categoría". Empty Guardar shows "Obligatorio". A `.txt` file shows the Spanish type error and does not create a card. Save "Inline Plain" and "Inline Photo"; reload; the photo card's image is a data URL and the plain card's is not. Both names appear in the product form's category `<select>`. Editar renames on Guardar, Cancelar leaves the old name, blank name stays "Obligatorio". Change image and "Usar imagen por defecto" persist across reload. Search "zzz" shows the no-match empty state and "Quitar búsqueda" brings the cards back. At 380×720 the cards stack (second card below the first). Screenshots at 1366×768 of the grid and of the edit dialog in Mercado, Mostrador Noche, Ultramarinos, and Unexpected Neon into `docs/design/after/categories-<theme>.png` and `docs/design/after/categories-dialog-<theme>.png`.

**7b closes:** nothing. Refs #88, #79.

## 7c — delete confirmation

Replace `window.confirm` on this screen with a `Dialog`.

1. `model.js` gains `confirmDelete` (`null` or `{id, name}`) and the matching actions. The card's Eliminar dispatches open; it does not delete. Confirm dispatches the existing `categoriesDelete`. The epic still calls `categories_delete_use_case.deleteCategory({id})`.
2. The question is the one 7b already passes to `window.confirm`: "¿Eliminar {name}?". The dialog adds the body "Esta categoría no tiene productos." and the buttons "Cancelar" and "Eliminar". Success toast "Categoría eliminada", then reload. `CATEGORY_NOT_EMPTY` (a product was added after the card rendered) shows "La categoría todavía tiene productos" on the dialog and leaves the card. `CATEGORY_NOT_FOUND` shows "No se encuentra la categoría".
3. The button stays off the card when `productCount > 0`. Do not add a status, a disable use case, or a `DELETE` that ignores products. The guarded SQL in `remove` stays the backstop. Do not extend that pattern to other repositories.
4. While this dialog is open it is the only dialog, and Eliminar is its danger action. The edit dialog is closed first. Do not edit `Dialog.js`.

**7c tests**

- Unit: opening the confirm stores the id and does not remove the row; cancel clears it; a `CATEGORY_NOT_EMPTY` failure keeps the row.
- e2e: the empty category asks with the Dialog (no `window.confirm` listener). Accepting removes the card and the product-form `<select>` option. The stocked category has no "Eliminar". Dismissing leaves the card. One screenshot of the confirm dialog in Mercado at 1366×768 into `docs/design/after/categories-delete-mercado.png`. The sale → stock 3 → most sold "Milk" path in `e2e/categories.spec.js` still passes.

**7c closes:** nothing. Refs #88.

## 7d — links to the product list and the product editor

Start this PR only after Phase 6b is on master. Branch from master, not from the 6b branch.

1. **"Ver productos"** on each card is a react-router `<Link to={'/list_products?category=' + id}>`. It is navigation, not a button and not `listProductsDetail`.
2. **The products list reads the query**, the same way it already reads `lowStock=1`. On open, `location.query.category` sets `categoryId` when that id is one of the loaded categories. An unknown id is ignored. "Todas" (or "Quitar filtros") pushes `/list_products` and drops `category` while keeping `lowStock` if that param is still on. Choosing a category in the list's own select pushes `/list_products?category=<id>` so Back returns to the card's filter. Do not rebuild the table, the drawer, or the filters 6b just shipped. Touch only the query read, the URL write, and the test that covers them.
3. **Most sold** stays a control that dispatches `listProductsDetail(barcode)`. 6c is the PR that makes this action open the product drawer and that stops the push to `/create_product?edition=true`. Do not implement that here. Do not edit `new_product/` or `Dialog.js`.
   - If 6c is already on master: the e2e click expects the drawer heading "Editar producto" and the product name, on `/list_products`.
   - If 6c is not on master: the e2e expects the edit form heading master still has, and this PR does not change the destination.

**7d tests**

- Unit: the products model applies a `category` query id and ignores an unknown one; clearing the category drops `category` from the route params it returns and keeps `lowStock`.
- e2e: from Categorías, "Ver productos" on Stocked opens `/list_products?category=<that id>` and the list shows Milk and not a product from another category. "Todas" shows both. Screenshot at 1366×768 of that filtered list in Mercado into `docs/design/after/categories-products-mercado.png`. Most sold still opens the editor, with the heading from the bullet above.

**7d closes:** nothing. Refs #88.

## Constraints

- React 15 only. No hooks, Fragments, or portals. Dialog focus uses `initialFocusRef` objects.
- Components from `user_interface/components/` and `--om-*` tokens only. No new hex or rgb. No new shared component: a category card is `Card`, the editor is `Dialog`, the photo is `ImageField`. Do not add `placement="drawer"` and do not edit `Dialog.js` (6c does).
- Unidirectional Redux, `new_order` as the template. Screen data (cards, search text, dialog draft, field errors, saving, the delete confirm) lives in the store. `setState` is only for purely visual state that nothing else reads. The current card's name and errors are screen data; do not leave them in `setState`. `ImageField`'s blob preview stays inside that component.
- Dependency rule: UI, application, and infrastructure may depend on the domain. The domain imports none of them. The UI calls use cases through `OpenMarket.get` from epics only. It may use `Money` directly. It does not import SQLite, the container, or `ImageStore`.
- Reads: `CategoryRepository.find(new CategoriesQuery(...))` → `{items: CategoryView[], total}`. No invariant checks on `CategoryView`. No separate query port and no query service that a use case imports. Writes stay on the existing use cases. `findById` / `findAll` stay the aggregate finders. Do not load a `Category` to paint the grid.
- Money is integer cents on `CategoryView`. `CategorySummary.basePriceTotal` stays the euro float until that type is deleted, which is not this phase. Formatting only in `i18n/money`.
- Do not add a `KNOWN_VIOLATIONS` line. Delete the categories `ImageStore` line only in 7b, the PR that removes the import.
- Implementation PRs follow the quality commands in root `AGENTS.md` (`npm run crap -- --changed`, `npm run dry -- --changed`, mutation on domain files they add). Do not weaken a test to clear a score.
- Do not touch invoice numbering, the VeriFactu payload, or the plugin protocol.

## Out of scope

- Settings (OM-26 #89) and the i18n framework (OM-25). Strings on this screen are Spanish literals, the same way the orders and products plans treat their copy.
- A `DataTable` of categories, paging, bulk delete, import/export.
- Colour, icon, or position columns. Drag-and-drop reordering.
- Rewriting `UpdateCategory` / `DeleteCategory` into load-then-mutate. New invariants, if a later change needs them, go on `Category` methods the use case calls, not in the repository and not on `CategoryView`.
- Deleting `findAllWithStats` or `CategorySummary`. The product list and the product form still call them until 6b (or a later products PR) stops. 7b only stops the categories epic.
- The product drawer, `EnableProduct`, and the sell-screen dialog. 6c owns the drawer that `listProductsDetail` opens.
- The products table itself. 7d only adds the `category` query param beside `lowStock`.
- `FetchCatalogImages`, `CategoryImageSource`, and the Wikimedia lookup. No "Buscar imagen" on the category dialog.
- A plugin slot on this screen.
- Moving `.image-drop` / `.image-file` off the product form.

## Open questions for Victor

Product decisions. Each item has a recommended default. Implementation PRs follow the default until you answer.

1. **Colour or icon?** The table stores a photo filename and nothing else. The before screenshot is a name list with a placeholder. **Default:** no colour column, no icon name, no new token. The card shows the stored photo or `category-placeholder.svg`.
2. **Delete or disable when products reference the category?** Today Eliminar is a hard delete, only when the count is 0, and `CategoryNotEmptyError` refuses the race. There is no status column. **Default:** keep that. Empty categories can be deleted after a confirm. A category with products has no Eliminar, and its products stay put. No archive and no "move products then delete".
3. **Reordering?** The grid is alphabetical. There is no position column. **Default:** `ORDER BY name COLLATE NOCASE ASC`. No drag-and-drop and no manual order.
4. **Product counts on the cards?** The current cards show count, cost value, stock, and most sold. DESIGN.md treats those summary facts as part of a category tile. The count is the category read's join, not a `ProductView` query. **Default:** show all four facts. Count every product row, any status, as the SQL does today. Valor stays the sum of base prices (cost), not the shelf price.
5. **Inline fields, a dialog, or a page?** Today the name is an input on the card and create is a draft card. The v1.14 screen was a separate edit page. There is no `/create_category` route. **Default:** a centered `Dialog` on `/categories` for create and edit. The card shows the name as text. Not a new route, and not inputs on the card.
6. **A Wikimedia button on the dialog?** Missing photos are filled in the background by `FetchCatalogImages`. **Default:** the dialog only picks a local file or clears back to the placeholder. No lookup button.
7. **Unique names?** `category.name` is not unique. **Default:** allow two categories with the same name. The only client rule is a non-blank trimmed name.

## Suggested implementation PR bodies

7a:

```
Phase 7a: category reads go through CategoryRepository.find (CategoriesQuery criteria, CategoryView, integer cents). findAllWithStats stays for the product screens.
Refs #88
Version: patch
```

7b:

```
Phase 7b: categories card grid on tokens and shared components, create/edit dialog, Spanish copy.
Refs #88 #79
Version: minor
```

7c:

```
Phase 7c: deleting an empty category asks with a dialog. A category that still has products cannot be deleted.
Refs #88
Version: minor
```

7d:

```
Phase 7d: a category card links to /list_products?category=<id>. The products list applies that query. Most sold still opens the product editor through listProductsDetail.
Refs #88
Version: minor
```

## Rationale (architecture decisions, Oct 2026)

- A category grid is a read. `CategoryView` carries the stored columns plus the totals the card already shows, and it does not re-run delete or rename rules. `Category` stays the write aggregate, loaded only by the write finders (`findById`, `findAll`) and built by the factory on create.
- `findAllWithStats` returns a different shape (`CategorySummary`, euro float) that the product screens already call. Replacing it in 7a would change those screens inside a categories PR, and 6b is about to rewrite them. `list` is the new method. The old one stays until those callers leave.
- Product counts do not wait for 6a. They are a join in the category repository, which is the read model for this screen. Calling `ProductRepository.find` once per card would be a second query port in disguise.
- The filtered product list does wait for 6b, because 6b replaces `list_products/` and does not define `?category=`. Adding that param earlier means editing files 6b will throw away. The drawer waits for 6c for the same reason: `listProductsDetail` is the seam 6c already names.
- Editing on the card kept the draft in `setState` and coupled the name field to the save epic. The dialog draft lives in the categories slice, the same way the product drawer lives in the products slice, so a reload or a search cannot disagree with the input.
- Valor is `basePriceCents` so the card and `formatMoney` share one integer. The current SQL divides by 100 before the UI formats, which is how a binary float gets onto the card.
