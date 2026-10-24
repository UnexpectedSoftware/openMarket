# Phase 8 — Settings screen (plan)

> Status: planned. Depends on Phases 1–3, all merged, and on the shop profile, sell preferences, and theme preference already on master. **Independent of #159 (categories delete and product links), which is open.** Split into **8a**, **8b**, **8c**, and **8d**, one PR each, in that order.
> No umbrella issue. OM-26 #89. Spanish copy on this screen is the settings part of OM-25 #88. 44 px targets on this screen are the settings part of OM-16 #79. Neither #88 nor #79 closes here.
> No settings mockup and no before screenshot. Tokens and components: [DESIGN.md](../DESIGN.md). The screen is a form of sections, not a table and not a drawer.

This is roadmap item 5. The Phase 4 plan calls the shop and `sell_auto_print` UI "Phase 6". Products took phase 6 and categories took phase 7, so this screen is phase 8.

## Versions

| PR | `package.json` | Why |
|---|---|---|
| This plan | `Version: none` | Docs only. |
| **8a** read models | `Version: patch` | No screen change. |
| **8b** Comercio and Apariencia | `Version: patch` | A slice of the screen. #89 stays open. |
| **8c** Ticket | `Version: patch` | A slice of the screen. #89 stays open. |
| **8d** Impresora and Idioma | `Version: minor` | Finishes the screen and closes #89. The only minor inside this phase. |
| #87 low stock, after 8d | `Version: minor` | Visible sell-screen and nav change. Its own later plan. |
| #110 layout presets, after #87 | `Version: minor` | Visible layouts, chosen on this screen. Its own later plan. |
| **#113 accessibility pass, last** | `Version: minor` | **The final redesign PR that carries `Version: minor`.** Nothing on this roadmap after it bumps minor. |

8b and 8c do change what the cashier sees. They stay `patch` so one settings release is one minor, on 8d. That is a deliberate difference from phases 6 and 7, which marked every UI slice minor.

## Ordering

Branch every implementation PR from **master**. Do not branch from `cursor/categories-delete-and-product-links-79e5`.

#159 edits `e2e/categories.spec.js`, `user_interface/category/`, `user_interface/product/list_products/Container.js`, `user_interface/product/list_products/model.js`, `style/components/categories.scss`, and the category and list-products tests on that PR. Settings work does not edit those files. 8b changes only the Ajustes heading line in `e2e/shell.spec.js` and `e2e/themes.spec.js`.

8c edits the sell-screen print epic (`user_interface/order/new_order/epicFactory.js`). That file is not on #159. Rebase if a later PR takes it, and still change only the print-mode branch.

## After this phase

These three stay out of 8a–8d. Each one is its own later plan, branched from master once the PR it waits on is merged. The version of each is in the table above.

1. **#87 (OM-24), after 8d.** The sell tile and the cart line already say "Stock bajo". The toast is still the English "Stock is low" / "has N left". There is no "Quedan N", and no low-stock count on the rail or on Informes. `ProductRepository.countProductsWithLowStock` already exists. The follow-up adds the count and the Spanish toast, and the e2e that sells down to the minimum and expects the tile badge and the count to update. It does not edit the settings screen.
2. **#110, after #87.** Presets B "Escáner" and C "Táctil" (mockups `B-sell-scanner`, `C-sell-touch`), built from the sell-screen components, chosen in Apariencia, applied without a reload. 8d leaves Apariencia as the four themes only, so this PR adds the layout field instead of rewriting the section. Acceptance on the issue: switching the preset changes the layout without a reload, and an e2e smoke per preset.
3. **#113, after #110.** The accessibility pass (covers #80, #72, #73): automated contrast and target-size checks, and a keyboard walk of every screen, including Ajustes and both presets. ROADMAP already places this last. **This is the final PR that carries `Version: minor`.**

## Ready-to-paste Grok Build prompt (8a)

```
Implement Phase 8a of the OpenMarket redesign in UnexpectedSoftware/openMarket, following
docs/design/plans/phase-8-settings.md section "8a" exactly. Fresh branch from master, not from
PR #159. Follow AGENTS.md and /openmarket-architecture. Each screen read is
repository.find(new XxxQuery()) and returns an XxxView. The query is a frozen criteria value,
not a port. Do not add a query port. The no-arg find() that returns the aggregate is renamed
as the plan says, and every caller in the plan is updated. Plain JS + JSDoc + checkJs.
Keep unit, integration, and Playwright tests green. Run npm test, npm run test:integration,
npm run typecheck, npm run build, xvfb-run -a npm run test:ui, and mutation on the new domain
files. PR body must contain "Version: patch" and the keywords in the plan. Do not merge and
do not release.
```

The 8b prompt is the same with "8b", the 8b section, screenshots of the page in the four themes, and `Version: patch`. The 8c prompt is the same with "8c", the 8c section, and `Version: patch`. The 8d prompt is the same with "8d", the 8d section, screenshots, and `Version: minor`.

## What exists today (verified on master 4a77003)

- Route `/settings` → `user_interface/settings/ReduxConnector.js`. The nav label is already "Ajustes". The page heading is **"Settings"**. `e2e/shell.spec.js` and `e2e/themes.spec.js` expect that heading. Under it, **Apariencia** (theme radios) and **Comercio** (the shop form).
- The shop draft (NIF, razón social, nombre comercial, address, "Emitir facturas") lives in **`this.setState`** on `settings/Container.js`. Save is a `Button` labelled **"Save"**. Success is a status "Shop saved". Load failure is English ("Loading shop settings…", "Shop settings could not be loaded"). Field labels are already Spanish. The NIF error comes from `InvalidTaxIdError` (`userMessage` "invalid NIF"). Turning invoicing on with a blank NIF or legal name raises `ShopProfileIncompleteError`.
- **Apariencia** is `ThemePicker.js`: four radios (Mercado, Mostrador Noche, Ultramarinos, Unexpected Neon), arrow keys move, Enter/Space selects. Choosing one previews `data-theme` immediately. Its own **Guardar** persists and toasts "Tema guardado". Leaving the page without that Guardar discards the preview. The shop Save button also persists a preview that has not been saved yet (`Container._save`). `e2e/themes.spec.js` and `e2e/receipt.spec.js` depend on that Guardar button and on "Tema guardado".
- Redux key `state.settings` is a flat profile (`settings/reducer.js`). `state.appearance` is the theme (`appearance/reducer.js`), painted before the first React render by `user_interface/index.js`, which reads `preferences.theme.id`. The sell screen dispatches `shopProfileRequested` and reads `state.settings.issuer` for the Vender subtitle (`tradeName` or `legalName`, then `NIF …`). `e2e/settings.spec.js` saves a shop, reloads, and expects that subtitle.
- **Read path today returns aggregates.** `shop_get_profile_use_case` → `ShopProfileRepository.find()` → `ShopProfile`. The settings epic then calls `snapshot()` and flattens the address (`epicFactory.js` `shopProfileView`). `appearance_get_use_case` → `AppearancePreferencesRepository.find()` → `AppearancePreferences`. `shop_get_sell_preferences_use_case` → `SellPreferencesRepository.find()` → `SellPreferences` (`autoPrint` boolean). All three rows live in the `setting` table (`key`, `value_json`): `shop_profile`, `appearance`, `sell_auto_print`. There is no phone, email, logo, header, footer, paper width, printer row, or language row.
- **Write path, unchanged by the reads.** `UpdateShopProfile` builds a new `ShopProfile` and `save`s it (replace, not load-then-mutate). `timeZone` is hardcoded `Europe/Madrid` on that save. `snapshot()` / `isComplete()` require a NIF and a non-blank legal name; the invoice issuer is that snapshot. `ChangeTheme` loads the appearance aggregate, calls `changeTheme`, and saves. `UpdateSellPreferences` loads, calls `withAutoPrint`, and saves. Its comment says the Settings screen is a later phase. `CreateOrder._loadProfile` calls `shopProfileRepository.find()` and uses `snapshot()` and `isComplete()`. The invoice series is the shop's local year (`zoned.date.slice(0, 4)`), formatted `2026/000123` by `InvoiceNumber`. That series is not a setting.
- **Ticket behaviour.** `autoPrint: false` (the default, and a missing row) leaves a toast action "Imprimir ticket". `autoPrint: true` prints on its own. There is no "never". `BuildReceipt` concatenates the fiscal plugin slot, `coreBlocks`, and the footer plugin slot. `coreBlocks` prints the trade name or the legal name, then `NIF …`, from the issuer. Header and footer text from the shop are not a thing yet. `EscPosReceiptRenderer` defaults `paperWidthMm` to 80 and the container constructs it with no arguments. The HTML preview does not use the paper width.
- **Printer.** `PrinterConnection` calls `printer.init` with `type: 'epson'`, `interface: '/dev/usb/lp'`, `characterSet: 'SPAIN1'` when it is not given a device and `OPENMARKET_FAKE_PRINTER` is not `1`. It does not read the `setting` table. `OrderPrinterService` prints the receipt blocks it is given. The old literals `SUPER COMPRIN` and `476359906P` are already gone from `src`. `CatalogPrinterService` prints the heading "Product list".
- Styles in `style/components/settings-page.scss` mix `$sp-base`, raw `rem`, and tokens. `file.scss` already imports that file. `style/settings/settings.scss` and `style/settings/themes.scss` are the legacy variables and the theme tokens, not this screen.
- Phase 3 components to use: `PageHeader`, `Card`, `Button`, `TextField` (it already has `hint`), `Select`, `Skeleton`. There is no shared switch. The product drawer has a private `Switch`; this phase does not copy it and does not edit `Dialog.js` or `ProductDrawer.js`.

## Target layout

One screen on `/settings`, inside the Phase 1 shell. Tokens only (`--om-color-*`, `--om-space-*`, `--om-font-*`, `--om-radius-*`, `--om-shadow-*`, `--om-control-*`, `--om-button-*`). No new hex, rgb, or raw px in the rules this phase adds. No new token.

- **Header:** `PageHeader` "Ajustes". One primary `Button` "Guardar". It is the only primary button on the page. It is disabled while a save is in flight.
- **Sections**, each a `Card` with a title, in this order: **Comercio** (8b), **Ticket** (8c), **Impresora** (8d), **Apariencia** (8b), **Idioma** (8d). 8b ships the page with Comercio and Apariencia only. 8c adds Ticket. 8d adds Impresora and Idioma. Do not reserve empty cards for sections that are not in that PR.
- **Comercio:** `TextField`s NIF, Razón social, Nombre comercial, Calle, Código postal, Ciudad, Provincia, País, Teléfono, Correo. A labelled checkbox "Emitir facturas" with a hit area of at least `--om-control-height`. País stays a text field, default `ES`.
- **Ticket:** `Select` "Al imprimir" (Siempre / Preguntar / Nunca), `TextField`s "Cabecera" and "Pie", `Select` "Ancho del papel" (58 mm / 80 mm).
- **Impresora:** `Select` "Tipo" (Epson / Star), `TextField` "Interfaz" (hint "Ruta USB, tcp://ip:9100, o el nombre de la impresora"), `Select` "Juego de caracteres", secondary `Button` "Imprimir prueba".
- **Apariencia:** the four theme radios, restyled with tokens. No layout control.
- **Idioma:** `Select` "Idioma" with one option, "Español".
- **Loading:** `Skeleton` blocks in place of the cards. **Failure:** the message and a "Reintentar" button. A shop that has never been saved is a blank form, not an `EmptyState`. Field errors sit on the field (`aria-describedby`). A successful save toasts "Ajustes guardados" once. A print failure is inline on Impresora ("No se ha podido imprimir"), not a toast.

There is no logo well, no series field, no VAT field, and no plugin list.

## 8a — read models

Add the reads. Do not switch the screen off `setState`. Do not add phone, email, ticket fields, or printer fields.

1. **`domain/shop/issuerSnapshot.js`**, a pure function. `issuerSnapshot({nif, legalName, tradeName, address})` returns `null` when `nif` is missing or `legalName` trims to empty, and otherwise the plain object `snapshot()` returns today (`nif`, `legalName`, `tradeName` or null, `address`). `ShopProfile.snapshot()` delegates to it. `isComplete()` stays on the aggregate.

2. **`domain/shop/ShopProfileQuery.js`**, a frozen criteria value with no fields. `new ShopProfileQuery()` does not throw. It is not a port and it does not check a range. The screen does not filter.

   ```js
   export default class ShopProfileQuery {
     constructor() {
       Object.freeze(this);
     }
   }
   ```

   **`domain/shop/ShopProfileView.js`**, one frozen read model. It does not construct a `ShopProfile`, it does not call `isComplete`, and it does not run a NIF check. Fields: `nif` (string or null), `legalName`, `tradeName`, `street`, `postalCode`, `city`, `province`, `country`, `timeZone`, `invoicingEnabled`, `issuer` (the `issuerSnapshot` result). A missing row is the empty view: empty strings, `country` `ES`, `timeZone` `Europe/Madrid`, `invoicingEnabled` false, `nif` null, `issuer` null.

3. The same pair for the other two singletons. `SellPreferencesQuery` / `SellPreferencesView` with `autoPrint` (boolean, default false). `AppearancePreferencesQuery` / `AppearancePreferencesView` with `theme` (the id string, default `mercado`). The appearance view stores the string. It does not hold a `Theme`.

4. **`find(query)` is the screen read** on each repository and returns that view (`Observable<ShopProfileView>`, and the same for the other two). A missing row emits the default view. It does not complete empty.

   The no-arg `find()` that returns the aggregate is removed. The aggregate read is renamed:

   | Repository | Screen read | Aggregate read |
   |---|---|---|
   | `ShopProfileRepository` | `find(new ShopProfileQuery())` → `ShopProfileView` | `findProfile()` → `ShopProfile` |
   | `SellPreferencesRepository` | `find(new SellPreferencesQuery())` → `SellPreferencesView` | `findPreferences()` → `SellPreferences` |
   | `AppearancePreferencesRepository` | `find(new AppearancePreferencesQuery())` → `AppearancePreferencesView` | `findPreferences()` → `AppearancePreferences` |

   Production callers to update in this PR:

   - `CreateOrder._loadProfile` → `findProfile()`. It still uses `snapshot()` and `isComplete()`.
   - `GetShopProfile.getProfile` → `find(new ShopProfileQuery())`, returns the view.
   - `UpdateShopProfile` still builds a `ShopProfile` and returns that aggregate. It does not call `find`.
   - `GetSellPreferences.get` → the sell view. `UpdateSellPreferences` → `findPreferences()`.
   - `GetAppearancePreferences.get` → the appearance view. `ChangeTheme` → `findPreferences()`, and it still returns the aggregate so `preferences.theme.id` in `appearance/epicFactory.js` stays valid.
   - `user_interface/index.js` reads `preferences.theme` (the string), with `Theme.DEFAULT.id` as the fallback when the read fails.

   The settings epic copies an explicit field list off `ShopProfileView` into the existing flat reducer, including `issuer`. Delete the epic's `shopProfileView()` mapper. The sell subtitle keeps reading `state.settings.issuer`.

5. JSON parsing stays in each repository file. Do not add a `Sqlite*QueryService` for a single-row JSON read. The port's public methods are `find`, the renamed aggregate read, and `save`. `save` still stores the aggregate. Fakes that still say `find:` have to move with the rename: `CreateOrder.spec.js` (`findProfile`), `ChangeTheme.spec.js` and `OrderPaymentSpec.js` (`findPreferences`). `UpdateShopProfile.spec.js` reads through `GetShopProfile`, so it expects a view (`nif` string, `issuer.nif`) and not `nif.value` or `snapshot()`.

The form, the theme radios, `e2e/settings.spec.js`, and `e2e/themes.spec.js` stay as they are. First paint still applies the stored theme before React renders.

**8a tests**

- Unit: each query constructs and freezes. Each view freezes, is not the aggregate, and uses the documented default. `issuerSnapshot` matches `ShopProfile.snapshot()` for an empty profile, a NIF with a blank legal name, and a complete profile (trade name omitted → null).
- `makeShopProfileEpic` stores view fields and does not call `snapshot`. `savedThemeId` reads a string theme.
- itest: `find(new ShopProfileQuery())` after `UpdateShopProfile` returns `nif` `'B12345674'`, `issuer.legalName` set, and `!(item instanceof ShopProfile)`. A database with no `shop_profile` row returns the empty view. Appearance and sell views round-trip the same way, and `findProfile` / `findPreferences` still return the aggregates. The existing invoice itest still passes.
- Mutation on `domain/shop/issuerSnapshot.js`, `ShopProfileView.js`, `ShopProfileQuery.js`, `SellPreferencesView.js`, `SellPreferencesQuery.js`, `AppearancePreferencesView.js`, `AppearancePreferencesQuery.js`, and on `ShopProfile.js` because `snapshot()` changed. No new `KNOWN_VIOLATIONS` line.

**8a closes:** nothing. Refs #89.

## 8b — Comercio, Apariencia, one Guardar

Reshape `settings/` onto the `new_order` file set. One slice, the existing key `state.settings`. The component dispatches; the reducer calls `model.js`; the epic calls the use case. `state.appearance` stays the theme slice the boot path already uses.

| File | Role |
|---|---|
| `model.js` | `state()` and pure updates: `pageOpened`, `shopLoaded`, `draftChanged`, `saveStarted`, `saved`, `saveFailed`. Holds `saved` (the shop view fields and `issuer`), `draft` (the same shop fields plus `theme`), `loading`, `error`, `saving`, `fieldErrors`. No React, no Redux, no RxJS. |
| `action.js` | Request/result pairs for open, load, draft, and save. Keep `SHOP_PROFILE_REQUESTED` exported: `new_order` dispatches it. That action refreshes `saved` and `issuer` and does not replace a draft. |
| `reducer.js` | Delegates to `model.js`. |
| `epicFactory.js` | `makeSettingsLoadEpic`, `makeSettingsSaveEpic`. Load uses `switchMap` and handles both `pageOpened` and `SHOP_PROFILE_REQUESTED`. |
| `epic.js` | `OpenMarket.get('shop_get_profile_use_case')`, `shop_update_profile_use_case`, and `appearance_change_theme_use_case`. The save epic calls `changeTheme` itself. |
| `Container.js` | Renders props and calls action creators. No `OpenMarket.get`. No `setState` for the draft, the errors, or saving. |
| `ReduxConnector.js` | `connect` on `state.settings` and `state.appearance`. |
| `ShopForm.js`, `ThemePicker.js` | Presentational. `ReduxForm.js` is deleted. |

1. Opening `/settings` dispatches `pageOpened`. The load epic reads `find(new ShopProfileQuery())` and `store.getState().appearance.theme`, and the reducer copies both into `draft`. Leaving the route and coming back loads again, so an unsaved draft is dropped, which is what `setState` did. `new_order` keeps dispatching `shopProfileRequested` and reading `state.settings.issuer`. A draft edit does not change the Vender subtitle.
2. **Phone and email** land on `ShopProfile` and `ShopProfileView` in this PR (`phone`, `email`, default `''`). `UpdateShopProfile` stores them. `snapshot()` and `issuerSnapshot` do not include them, so the invoice payload does not change. Both inputs are `type="text"` (`inputMode` `tel` and `email`). Trim, max 40 characters for the phone and 80 for the email. Empty is allowed. A longer value sets "Máximo 40 caracteres" or "Máximo 80 caracteres" on that field and does not save. No format check. The checkbox "Emitir facturas" has its own `id` and a `label` with `htmlFor`.
3. **Validation**, matching today: a non-empty NIF must parse (`TaxId`), otherwise "NIF no válido" on the field. "Emitir facturas" with a blank NIF or a blank legal name sets "Obligatorio" on each empty one and does not save (`SHOP_PROFILE_INCOMPLETE`). Other shop fields may be blank. Do not toast a field error.
4. **One Guardar.** The save epic writes the shop when the shop draft differs from `saved`, then calls `changeTheme` itself when `draft.theme` differs from `appearance.theme`. A click with nothing to write does not toast and does not call a use case. Success toasts "Ajustes guardados" once, dispatches `themeChanged` when the theme was written, and reloads the shop view into `saved` and `draft`. A failed shop save stays on the form and does not start the theme save. A failed theme save dispatches `themeChangeFailed` with the previous id so the preview rolls back, and the page shows the inline error. The radio still previews immediately through the existing preview actions. Unmounting the picker still discards an unsaved preview. Delete the theme section's own Guardar button. `appearance/epicFactory.js` stops emitting "Tema guardado"; preview and discard stay.
5. **Copy** on this screen, Spanish, no exclamation marks (OM-25 #88, settings part): "Ajustes", "Guardar", "Comercio", "NIF", "Razón social", "Nombre comercial", "Calle", "Código postal", "Ciudad", "Provincia", "País", "Teléfono", "Correo", "Emitir facturas", "Apariencia", "Obligatorio", "NIF no válido", "Ajustes guardados", "No se han podido cargar los ajustes", "Reintentar", plus the four theme names. The Ticket, Impresora, and Idioma strings wait for 8c and 8d.
6. **Styles** in `style/components/settings-page.scss`. New rules use `var(--om-…)` only. Delete the `$sp-base` rules this screen no longer renders. Do not edit `style/settings/themes.scss`. Theme cards use the existing radio semantics (`radiogroup`, `radio`, `aria-checked`). Their minimum size is `--om-control-height`.
7. Update `e2e/settings.spec.js` (button "Guardar", toast "Ajustes guardados", phone and email survive a reload, the Vender subtitle still shows the NIF). Update `e2e/themes.spec.js` and `e2e/receipt.spec.js` so the only Guardar is the page button and the toast is "Ajustes guardados". Update only the Ajustes heading in `shell.spec.js` and `themes.spec.js`.

**8b tests**

- Unit: `model.js` (load copies the view into the draft, a draft edit leaves `issuer` alone, a blank NIF with invoicing on does not start a save, a clean Guardar does not start a save, a shop failure leaves the draft). Reducer delegates. Save epic: shop fields include `phone` and `email`; a theme-only change does not call `update`; `InvalidTaxIdError` becomes the NIF field error and not a success toast.
- Component: `ShopForm` ties each label to its input. `ThemePicker` marks the applied theme `aria-checked`.
- e2e: the cases in item 7. Screenshots at 1366×768 of the page in Mercado, Mostrador Noche, Ultramarinos, and Unexpected Neon into `docs/design/after/settings-<theme>.png`.

**8b closes:** nothing. Refs #89, #88, #79.

## 8c — Ticket

Add the ticket section to the same slice. Extend `SellPreferences`. Do not add a second aggregate for print mode.

1. **Aggregate.** `SellPreferences` gains `printMode` (`always`, `ask`, `never`), `headerText`, `footerText`, and `paperWidthMm` (`58` or `80`). Defaults: `ask`, `''`, `''`, `80`. `withPrintMode`, `withCopy({headerText, footerText})`, and `withPaperWidth` return a new value. Remove `withAutoPrint` and the `autoPrint` getter in this PR so the mode has one writer. A bad mode or a bad width throws `InvalidSellPreferencesError` (`ErrorCode.SELL_PREFERENCES_INVALID`). Header and footer trim; longer than 80 characters throws the same error. The use case maps that to "Máximo 80 caracteres" on the field. `UpdateSellPreferences.update({printMode, headerText, footerText, paperWidthMm})` loads with `findPreferences()`, calls those methods, and saves. It does not assign `_field`. The facade key stays `sell_update_preferences_use_case`. `src/itest/OrderPaymentSpec.js` round-trips `printMode` and the new JSON, not `autoPrint`.
2. **Stored JSON**, same key `sell_auto_print`. On read, a row that has `autoPrint` and no `printMode` maps `true` → `always` and anything else → `ask`, with the other defaults. On save, write `printMode`, `headerText`, `footerText`, `paperWidthMm` and stop writing `autoPrint`.
3. **View.** `SellPreferencesView` fields become `printMode`, `headerText`, `footerText`, `paperWidthMm`. Drop `autoPrint` from the view in this PR and update `GetSellPreferences` callers. The sell epic reads `printMode`.
4. **Screen.** Card "Ticket" with the three controls from the target layout. The draft holds the ticket fields. Guardar writes them in the same save epic, after the shop and before the theme. A ticket failure stops the rest of that click. Strings: "Ticket", "Al imprimir", "Siempre", "Preguntar", "Nunca", "Cabecera", "Pie", "Ancho del papel", "58 mm", "80 mm".
5. **Printing.** `BuildReceipt.build` and `preview` load the view and place a non-empty header as a text block after the fiscal slot and before `coreBlocks`, and a non-empty footer as a text block after `coreBlocks` and before the footer slot. Blank text adds no block. Neither string goes on the invoice payload. `OrderPrinterService.print` loads the view and renders that job with `paperWidthMm` (missing row → 80). The container stops being the place that fixes the width. The HTML preview ignores the width.

**Sell epic.** `sellPreferences` returns `{printMode}`. `savedActions` keeps the sale toast and changes only the print choice. An unpaid sale never prints and never offers the action.

- `always`, and the sale was paid: print, and the toast has no "Imprimir ticket" action.
- `ask` (the default, including a missing use case): do not print; the paid toast keeps the action "Imprimir ticket" and `autoDismiss: 0`. `e2e/receipt.spec.js` stays on this path.
- `never`: do not print, and the toast has no action and the normal dismiss. It does not stay on screen the way the ask toast does.

Leave the sale toast's English "Order saved!" text alone. That string is the sell screen's, and this PR does not rewrite it.

**8c tests**

- Unit: `withPrintMode('never')` sticks; `'later'` throws; header of 81 characters throws; width `58` sticks and `72` throws. Old JSON `{autoPrint: true}` maps to `always`; `{autoPrint: false}` and a missing row map to `ask` and 80. `savedActions`: a paid `always` pushes the print and the toast has no action; a paid `ask` does not print and the toast action is "Imprimir ticket"; a paid `never` does not print, has no action, and does not set `autoDismiss: 0`. An unpaid sale does not print in any mode.
- `BuildReceipt`: a header and a footer wrap the shop blocks and sit outside the plugin slots; blank strings add nothing.
- Renderer: a 58 mm job and an 80 mm job pass that width into the QR cell size.
- e2e: save "Siempre", sell, the printer log grows with no "Imprimir ticket" click. Save "Nunca", sell, the log does not grow and the button is absent. Save "Preguntar", the button is back. A header "Gracias" is in the log. Reload shows 58 mm after saving it. One full-page screenshot at 1366×768 in Mercado into `docs/design/after/settings-ticket-mercado.png`.
- Mutation on `SellPreferences.js` and `SellPreferencesView.js`.

**8c closes:** nothing. Refs #89, #88.

## 8d — Impresora, Idioma, and the #89 acceptance

This PR finishes the page. It carries `Version: minor` and closes #89.

1. **`domain/shop/PrinterSettings.js`**, the till's device. Fields `type` (`epson` or `star`, default `epson`), `interface` (non-empty string, default `/dev/usb/lp`), `characterSet` (`SPAIN1`, `PC858`, `PC850`, or `WPC1252`, default `SPAIN1`). Methods `withType`, `withInterface`, `withCharacterSet`. A bad value throws `InvalidPrinterSettingsError` (`ErrorCode.PRINTER_SETTINGS_INVALID`). Interface trims; empty throws; longer than 200 characters throws. The use case `UpdatePrinterSettings` loads, calls the methods, and saves. It does not open the device.
2. **`PrinterSettingsQuery` / `PrinterSettingsView`**, frozen, the three strings. `PrinterSettingsRepository.find(new PrinterSettingsQuery())` → the view (defaults when the row is missing). `findSettings()` → the aggregate, for the write use case. Key `printer` in the same `setting` table. Facade keys `shop_get_printer_use_case` and `shop_update_printer_use_case`.
3. **`PrinterConnection`** reads the view at the start of `print`. When `type`, `interface`, or `characterSet` differ from the last `init`, it calls `printer.init` with those three and `extraSpecialCharacters: {'€': 128}` before the job. An injected `device`, and `OPENMARKET_FAKE_PRINTER=1`, skip `init`. The next job after Guardar picks up the change. The app does not restart.
4. **`PrintTestTicket`** (`shop_print_test_use_case`) builds a non-fiscal block list and sends it through `OrderPrinterService`: the ticket header if any, the trade name or the legal name or "OpenMarket", `NIF …` when the shop view has a NIF, the line "Prueba de impresión", and the ticket footer if any. It does not create an order, an invoice, or a plugin slot. The button "Imprimir prueba" dispatches it. Failure (`PrinterBusyError` or a driver error) sets "No se ha podido imprimir" on the Impresora card. The sample uses the saved printer settings, so Guardar runs first when that section is dirty.
5. **`OrderPrinterService` test the issue asks for.** A recording device, given a receipt whose text blocks are the configured trade name and `NIF …`, records those lines. `PrinterConnection` passes the configured `interface` (and type and character set) to `init`.
6. **Idioma.** `LanguagePreferences` / `LanguagePreferencesQuery` / `LanguagePreferencesView` / repository, key `language`, field `locale`. The only accepted value is `es`. Anything else throws `InvalidLanguageError` (`ErrorCode.LANGUAGE_INVALID`). The card is the `Select` "Idioma" / "Español". Guardar writes printer and language in the same save epic, after the ticket section and before the theme. A failure stops the rest of that click. No string catalog and no locale switch in the UI layer. The screen's Spanish literals stay literals.
7. **Copy added here:** "Impresora", "Tipo", "Epson", "Star", "Interfaz", the hint, "Juego de caracteres", "Imprimir prueba", "Prueba de impresión", "No se ha podido imprimir", "Idioma", "Español", "Obligatorio" on an empty interface.
8. Run `rg "SUPER COMPRIN|476359906P" src` and keep it empty. Do not put the shop name on `CatalogPrinterService`.

**8d tests**

- Unit: printer aggregate rejects `type: 'tanca'`, a blank interface, and `characterSet: 'UTF-8'`; the default view is epson / `/dev/usb/lp` / `SPAIN1`. `PrinterConnection` calls `init` with the stored interface and does not call it when a device is injected; a second print with the same settings does not call `init` again. `PrintTestTicket` includes the trade name and the NIF from the shop view. Language rejects `en`.
- itest: save printer settings, `find` returns a view that is not the aggregate; a missing row is the default.
- e2e: save interface `tcp://127.0.0.1:9100` and type Star, reload, both are still there. "Imprimir prueba" with the fake printer writes `printer-log.jsonl` containing "Prueba de impresión" and the shop's trade name. Idioma shows "Español" and the stored locale is `es`. The 8b shop reload and the 8c print-mode cases still pass. One full-page screenshot at 1366×768 in Mercado into `docs/design/after/settings-printer-mercado.png`.
- Mutation on the new `domain/shop` printer and language files.

**8d closes:** #89. Refs #88.

## Constraints

- React 15 only. No hooks, Fragments, or portals.
- Components from `user_interface/components/` and `--om-*` tokens only. No new hex or rgb. No new shared component: a section is a `Card`, a field is a `TextField` or a `Select`, the theme radios stay radios. Do not edit `Dialog.js`.
- Unidirectional Redux, `new_order` as the template, from 8b on. Screen data (drafts, field errors, loading, saving) lives in the store. `setState` is only for purely visual state that nothing else reads. The theme picker's focus bookkeeping is that kind of state. The shop draft is not.
- Dependency rule: UI, application, and infrastructure may depend on the domain. The domain imports none of them. The UI calls use cases through `OpenMarket.get` from epics only. It may use `Theme` and `TaxId` only where a component already did (`Theme.ids()` in the picker). It does not import SQLite, the container, or `ImageStore`.
- Reads: `find(new ShopProfileQuery())` → `ShopProfileView`, and the same for sell, appearance, printer, and language. No invariant checks on those objects. No separate query port. Writes: load the aggregate, call its methods, `save`. `UpdateShopProfile` stays a replace, because the form submits the whole profile. `findProfile` / `findPreferences` / `findSettings` stay the aggregate finders.
- Do not add a `KNOWN_VIOLATIONS` line.
- Implementation PRs follow the quality commands in root `AGENTS.md` (`npm run crap -- --changed`, `npm run dry -- --changed`, mutation on domain files they add or change). Do not weaken a test to clear a score.
- Do not touch invoice numbering, the VeriFactu payload, or the plugin protocol.

## Out of scope

- The i18n framework (OM-25). 8d stores `es` and shows one option. Strings on this screen are Spanish literals.
- Layout presets (#110) and the low-stock follow-up (#87). The accessibility pass (#113) is after both. See "After this phase".
- A shop logo, a shop-default VAT, and a configurable invoice series. The open-question defaults below are what implementation PRs follow until Victor answers.
- Plugin settings. They stay on the Plugins page.
- Putting the shop name on the catalog print. The catalog heading stays "Product list".
- Rewriting `UpdateShopProfile` into load-then-mutate. New shop fields are constructor data on the replace. Ticket and printer changes go through aggregate methods.
- A `DataTable` of settings, a drawer, or a per-section route.

## Open questions for Victor

Product decisions. Each item has a recommended default. Implementation PRs follow the default until you answer.

1. **Phone, email, and a logo on Comercio?** The issue lists all three. The profile JSON has none of them, and there is no shop image store. **Default:** optional phone (max 40) and email (max 80), trim only, not printed on the ticket and not copied onto the invoice. No logo in this phase.
2. **A series field on Ticket?** The series is the shop's local year, and `invoice_sequence` is keyed by it. A free-text series would fork the numbers. **Default:** no series control and no hint. `CreateOrder` keeps using the year.
3. **Header and footer text?** The ticket has plugin slots and no shop lines around them. **Default:** optional single-line header and footer, max 80 characters, omitted when blank. The header sits after the fiscal slot and before the shop blocks. The footer sits after the shop blocks and before the footer slot. They are not part of the invoice payload.
4. **Always, ask, or never?** Today `autoPrint` is a boolean: true prints, false asks with the toast action. **Default:** those two plus `never`, which does not print and does not offer the action. A stored `{autoPrint: true}` becomes `always`. A missing row or `false` becomes `ask`, so current tills keep asking.
5. **Paper width?** The renderer defaults to 80 and nothing stores it. **Default:** a setting, 58 or 80, default 80, applied on the next ticket. The on-screen preview does not change width.
6. **Which printer values?** The connection hardcodes Epson, `/dev/usb/lp`, and `SPAIN1`. **Default:** type Epson or Star, interface any non-empty string up to 200 characters (USB path, `tcp://host:9100`, or a printer name) defaulting to `/dev/usb/lp`, character set `SPAIN1` / `PC858` / `PC850` / `WPC1252`. Saving does not probe the device. A bad path fails at print time.
7. **What does "Imprimir prueba" print?** **Default:** a non-fiscal sample with the shop name, the NIF when there is one, and the line "Prueba de impresión". No invoice row and no plugin block.
8. **Idioma?** There is no locale store and no string catalog. **Default:** persist `es` and show a one-option select. Do not extract strings in this phase.
9. **One Guardar, or one per section?** Today the shop and the theme each have a button, and the shop button also saves a theme preview. **Default:** one "Guardar" for the page. A radio still previews the theme immediately. Guardar writes only the sections that changed.
10. **A shop-default VAT?** The product keeps its own rate, and a new product still starts from `VatRate.standard()`. **Default:** no VAT field on this screen.
11. **Layout presets on Apariencia?** The issue's fix list names "theme, layout", and #110 is the preset work. **Default:** this phase ships the four themes only. #110 adds the layout control after 8d.

## Suggested implementation PR bodies

8a:

```
Phase 8a: settings reads go through find(ShopProfileQuery) and the sell and appearance queries, returning views. Aggregates stay on findProfile and findPreferences.
Refs #89
Version: patch
```

8b:

```
Phase 8b: settings page on tokens and shared components, one Guardar, Spanish copy. Phone and email are optional and stay off the invoice.
Refs #89 #88 #79
Version: patch
```

8c:

```
Phase 8c: ticket settings for print mode, header, footer, and paper width. Existing tills still ask before printing.
Refs #89 #88
Version: patch
```

8d:

```
Phase 8d: printer settings, a test ticket, and a stored locale of es. The printer reads its interface from settings.
Closes #89
Refs #88
Version: minor
```

## Rationale (architecture decisions, Oct 2026)

- A settings screen is a read. `ShopProfileView` and the other views carry the stored fields and the one derived display fact the sell screen already needed (`issuer`). They do not re-run NIF parsing or invoice rules. `ShopProfile` stays the write aggregate, loaded by `findProfile` for `CreateOrder` and built by `UpdateShopProfile` on save.
- `find` cannot mean both "the view" and "the aggregate" on these singletons. The screen read takes `find(query)`, which is the name the product and category repositories already use for a view. The aggregate read keeps a `findProfile` / `findPreferences` / `findSettings` name so `CreateOrder` can still call `snapshot()`.
- Phone and email stay out of `issuerSnapshot` so adding them does not change the invoice payload. The fiscal snapshot and the form's extra contact fields are different facts.
- Print mode extends `SellPreferences` instead of a new ticket aggregate. A second type would leave `autoPrint` and `printMode` both able to disagree. The old boolean maps once, on read.
- Header and footer are receipt blocks around `coreBlocks`, outside the plugin slots, so a fiscal plugin still owns the QR and the legend.
- `PrinterConnection` reads settings when a job starts, because `init` runs in the constructor today and a save would not otherwise reach it. The fake device used by tests never goes through `init`.
- 8d is the only minor in the phase because it is the PR that meets the #89 acceptance (configured name and NIF on the device, configured interface on `init`, settings survive a reload, the old shop literals stay gone). 8a–8c are the slices that make that PR small. #113 is the last minor on the roadmap because it walks the screens #87 and #110 add after this one.
