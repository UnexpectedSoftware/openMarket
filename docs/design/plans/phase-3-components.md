# Phase 3 plan — shared components

> **Grok Build prompt:** Implement `docs/design/plans/phase-3-components.md` in OpenMarket. Build a small component library in `src/openMarket/user_interface/components/` (Button, IconButton, TextField, NumberField, Select, Card, DataTable, Dialog, Toast config, Badge/StatusPill, EmptyState, Spinner/Skeleton, PageHeader/Toolbar) using only the Phase 2 `--om-*` tokens, keyboard accessible, React 15 (class components or stateless functions, no hooks/Fragments/portals), JSDoc props. Add a dev-only `/gallery` route. Migrate existing ad-hoc elements **only where the swap is drop-in** (same behaviour, same Redux actions) in the files listed in the plan. Add unit + a11y tests per component and per-theme Playwright screenshots of the gallery; keep all e2e and the colour lint green. Read `docs/design/DESIGN.md`, root `AGENTS.md`, `src/openMarket/user_interface/AGENTS.md` and the `openmarket-design` skill first. One PR (split into two if it grows past ~1500 lines: library + gallery first, migrations second), `Version: minor`. Suggested PR body: `Closes #64, closes #73, closes #81, closes #84. Advances #79, #80, #71, #113.`

## Status / dependencies
- Phase 1 (shell, #132) and Phase 2 (themes, #134 + #135) are on master. `#95`, `#114`–`#117` are closed.
- Tokens available (`user_interface/style/settings/themes.scss`): `--om-color-*` (incl. `primary-soft`, `success-soft`, `danger-soft`, `border-strong`, `overlay`, `focus`), `--om-space-0…9`, `--om-font-*`, `--om-radius-sm/md/lg/pill`, `--om-shadow-sm/md/lg/focus`, `--om-button-*` (height, height-lg, padding-x, radius, primary/secondary/ghost/danger bg+fg), `--om-control-height/radius`, `--om-tile-*`, `--om-chart-*`. Components use **only** these. New tokens go into every theme block and `docs/design/themes/*` (CSS + JSON).
- The colour lint (`src/test/openMarket/user_interface/style/noHexColors.spec.js`) already scans all UI files for hex, `rgb/hsl` and `$c-`; new components must pass it.

## What exists today (master 358fc4f)
- **Dialogs:** four copies of the same markup (`.dialog-Modal` › `.dialog-ModalControlX/Y` › `.dialog-ModalContainer` › `.dialog-Modal-header` / `-main`, styles in `style/components/modal.scss`):
  - `user_interface/dialog/Container.js` (generic warning, `dialogHide`, `<input type="button" value="CLOSE">`)
  - `order/printer_dialog/Container.js` — **OM-01 still present**: `closeDialog()` calls `this.props.dialogHide`, which its connector never binds; the × throws.
  - `order/weighted_dialog/Container.js` (+ `ReduxForm.js`) — heading `Weight!` (OM-21)
  - `order/new_product_dialog/Container.js` (+ `ReduxForm.js`)
  None traps focus, closes on Esc, or sets `role="dialog"`/`aria-modal`/`aria-labelledby`.
- **Action anchors (OM-10):** `<a onClick>` without `href`: `order/new_order/ReduxForm.js:56` (Delete), `:131` (Save), `:137` (Print); `order/list_orders/Container.js:44` (View); `order/new_product_dialog/ReduxForm.js:37,42`; `order/weighted_dialog/ReduxForm.js:43`. 21 real `<button>`/`.button` usages elsewhere with mixed styles (`style/components/button.scss`).
- **Fields:** ad-hoc `renderField`/`<label htmlFor={placeholder}>` patterns (labels not tied to inputs) in `product/new_product/ReduxForm.js`, `order/new_order/ReduxForm.js`, `order/weighted_dialog/ReduxForm.js`, `order/new_product_dialog/ReduxForm.js`, `settings/ReduxForm.js`, `components/ImageField.js`; 24 raw `<input>`/`<select>`. Product status `<select>` shows raw `ENABLED` (OM-22).
- **Tables:** `react-table` 6 in `order/new_order/ReduxForm.js` (cart, pads to 20 rows — OM-12) and `order/list_orders/Container.js`; styles `style/components/table.scss`.
- **Toasts:** `react-notification-system-redux` rendered once in `containers/App.js:86`; ~49 dispatch sites set their own `position`/`autoDismiss`; no cap (OM-18).
- **Empty/loading:** `product/list_products/Container.js:278-283` (`catalog-note`, "No products match these filters" also for an empty catalog — OM-08), `home/MostSoldContainer.js:34` (`most-sold-empty`), header progress spinners in `containers/App.js:66,72` (`fetch-progress-spinner`).
- Only shared component today: `components/ImageField.js`.

## Library (`user_interface/components/`)
One file per component + one SCSS partial in `style/components/om-<name>.scss` (imported from `file.scss`), BEM-ish classes prefixed `om-`. Each component has a JSDoc `@typedef` for its props and validates required props in development (`prop-types` is already a React 15 peer — use it if installed, otherwise JSDoc only).

| Component | API (props) | Notes |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'md'\|'lg'`, `type` (default `button`), `disabled`, `busy`, `icon`, `onClick`, `children`, `title` | Renders `<button>`. Height `--om-button-height` (lg: `--om-button-height-lg`, the pay button). `busy` shows Spinner + `aria-busy`. Min 44×44. |
| `IconButton` | `icon` (font-awesome name), `label` (required → `aria-label` + `title`), `variant`, `onClick` | ≥ 44×44 target. |
| `TextField` | `id`, `label`, `value`, `onChange`, `error`, `hint`, `required`, `autoFocus`, `inputRef`, `readOnly`, `placeholder` | `<label htmlFor={id}>`; error text `id={id}-error` + `aria-describedby` + `aria-invalid`. Works with redux-form via a tiny adapter `components/reduxFormField.js` (`input`, `meta` → props). |
| `NumberField` | TextField props + `step`, `min`, `max`, `decimals`, `unit` (e.g. `kg`, `€`) | Accepts `,` and `.` as decimal separator, emits a Number; `inputMode="decimal"`. |
| `Select` | `id`, `label`, `options: {value, label}[]`, `value`, `onChange`, `error` | Labels are human text (fixes OM-22 when product status maps `ENABLED` → "Activo"). |
| `Card` | `title`, `actions`, `children`, `as` | Surface + `--om-shadow-sm` + `--om-radius-lg`. |
| `DataTable` | `columns: {key, header, render?, align?, sortable?}[]`, `rows`, `rowKey`, `sort: {key, dir}`, `onSort`, `loading`, `empty` (node), `onRowClick?` | Plain `<table>` (no padding rows). Sortable headers are `<button>`s with `aria-sort`. `loading` → Skeleton rows; no rows → `empty`. Numbers right-aligned with `--om-font-feature-numeric`. Not a react-table replacement for the cart yet (Phase 4 sale screen); used for read-only lists. |
| `Dialog` | `open`, `title`, `onClose`, `children`, `actions`, `initialFocusRef`, `role: 'dialog'\|'alertdialog'` | Rendered in place (no portals in React 15): fixed overlay `--om-color-overlay`. `role`, `aria-modal="true"`, `aria-labelledby`. Focus moves to `initialFocusRef` or first focusable on open, is **trapped** (Tab/Shift+Tab wrap), **Esc** and × call `onClose`, focus returns to the previously focused element on close. |
| `Toast` config | `components/toast.js`: `toast.success(title, message)`, `toast.warning`, `toast.error` returning the `react-notification-system-redux` action with fixed `position: 'bc'`, success `autoDismiss: 2.5`, errors `autoDismiss: 0`, `uid` dedupe; `App.js` caps visible notifications to 3 (drop oldest via a reducer wrapper) and passes a token-based `style`. | Fixes OM-18 without replacing the library. |
| `Badge` / `StatusPill` | `tone: 'neutral'\|'success'\|'warning'\|'danger'\|'primary'`, `children` | Soft background tokens + text tokens with AA contrast; never colour alone (text label always). |
| `EmptyState` | `icon`, `title`, `message`, `action` (Button) | Distinguishes "no data" vs "no results" in callers. |
| `Spinner` / `Skeleton` | `Spinner {size, label}` (`role="status"`, visually hidden label); `Skeleton {lines, width}` | Respects `prefers-reduced-motion`. |
| `PageHeader` / `Toolbar` | `PageHeader {title, subtitle, actions}`; `Toolbar {children, align}` | Consistent `h1` per screen; toolbar wraps filters/actions with `--om-space-*` gaps. |

Rules: tokens only (colours, spacing, radius, shadows, fonts); visible `:focus-visible` ring (`--om-shadow-focus` / `--om-color-focus`); no global `float`; components are presentational (no `connect`, no facade calls).

## Migration (drop-in only — behaviour and actions unchanged)
1. **Dialogs → `Dialog`:** `dialog/Container.js`, `order/printer_dialog/Container.js` (× and Esc call `hidePrinterDialog({order, print: false})` like NO — **fixes OM-01 #64**), `order/weighted_dialog/Container.js` (title "Peso (kg)" instead of `Weight!`, field becomes `NumberField unit="kg"` — **OM-21 #84** copy/label part; live subtotal stays for Phase 4), `order/new_product_dialog/Container.js`. Delete the duplicated `.dialog-Modal*` styles from `modal.scss` once unused.
2. **Action anchors → `Button`/`IconButton`:** the seven `<a onClick>` sites listed above (**OM-10 #73** button half); existing `.button` elements in `product/*`, `category/*`, `plugin/PluginsPage.js`, `settings/*` where the markup is a plain button.
3. **Fields → `TextField`/`NumberField`/`Select`** via `reduxFormField`: `product/new_product/ReduxForm.js`, `order/weighted_dialog/ReduxForm.js`, `order/new_product_dialog/ReduxForm.js`, `settings/ReduxForm.js` (labels tied to inputs — **OM-10 #73** label half; status select labels — **OM-22 #85**). Keep field `name`s so e2e selectors `input[name=…]` still work.
4. **Toasts → `toast.*` helpers** at the existing dispatch sites (grep `position: 'tr'`) + cap in `App.js` (**OM-18 #81**).
5. **Empty/loading:** `product/list_products/Container.js:278-283` → `Spinner`/`EmptyState` (no-data vs no-match, "Quitar filtros" — **OM-08 #71**), `home/MostSoldContainer.js:34` → `EmptyState`, header spinners in `App.js` → `Spinner`.
6. **Orders list table:** `order/list_orders/Container.js` → `DataTable` only if the sort/paging behaviour is preserved; otherwise leave for Phase 4 (orders master-detail #111).
7. Not migrated now: the sell-screen cart table (`order/new_order/ReduxForm.js`, Phase 4 sale screen), charts (`home/Container.js`, `sales/ProductSales.js` stay as is).

## Component gallery
- Route `/gallery` registered in `user_interface/routes.js` **only when** `process.env.NODE_ENV !== 'production'` (or `OPENMARKET_GALLERY=1` for e2e on the production build); no rail item. `user_interface/gallery/GalleryPage.js` renders every component in every variant/state (default, hover-free focus, disabled, busy, error, empty, loading, open dialog example) with static data.

## Tests
- **Unit** (`src/test/openMarket/user_interface/components/<Name>.spec.js`, React 15 `react-dom/test-utils` / `react-test-renderer` matching the installed version): rendering per variant, props → classes/attributes, events.
- **a11y unit checks:** Button renders `<button type="button">`; IconButton requires `label` (`aria-label`); TextField `label[for]` matches input `id`, `aria-invalid` + `aria-describedby` on error; Select options have text labels; DataTable sort header `aria-sort`; Dialog has `role`, `aria-modal`, `aria-labelledby`, traps Tab, Esc calls `onClose`, focus returns; Spinner `role="status"`.
- **Colour lint** stays green (no literals in new files); add a lint that `components/*.js` contain no inline `style={{color…}}`.
- **Playwright** `e2e/gallery.spec.js`: open `/gallery`, for each theme (`mercado`, `mostrador-noche`, `ultramarinos`, `unexpected-neon`) set the theme through Settings or `dataset.theme`, screenshot to `test-results/gallery-<theme>.png`; keyboard test: Tab through the dialog example (focus stays inside, Esc closes); target-size check (every button ≥ 44×44).
- **e2e regression:** existing specs (`shell`, `orders`, `products`, `categories`, `plugins`, `receipt`, `settings`, `themes`) stay green; add the OM-01 test (click × on the ticket dialog → closes, no `pageerror`).

## Acceptance criteria
- Library + gallery exist, tokens only, documented with JSDoc; every component keyboard accessible and passes its a11y tests.
- All four dialogs use `Dialog` (focus trap, Esc, aria); OM-01 fixed.
- No `<a onClick>` without `href` left in `user_interface/`; form labels tied to inputs in the migrated forms.
- Toasts capped at 3, bottom-centre, success 2.5 s, errors persistent.
- `npm run test-all`, `npm run typecheck`, `npm run build`, `xvfb-run -a npm run test:ui` green; gallery screenshots per theme attached to the PR.

## Issues
- Closes: OM-01 #64, OM-10 #73, OM-18 #81, OM-21 #84 (title/label; live subtotal noted for #109).
- Advances: OM-22 #85 (if status labels land, close it), OM-08 #71 (close if the no-data/no-match split lands), OM-16 #79 (44 px targets; steppers are Phase 4), OM-17 #80 / #113 (final a11y pass), DESIGN.md catalogue.

## React 15 constraints
No hooks, Fragments (`<>`), portals, `forwardRef` or new context API. Class components for stateful pieces (`Dialog`, `DataTable` sort state if uncontrolled), stateless functions otherwise; refs via callback refs; one root element per component.

## Out of scope
Screen redesigns (sale screen, payment sheet, orders master-detail, products, categories, settings layout) — Phase 4+. Replacing `react-table` in the cart, charts restyle, i18n layer (OM-25), steppers/keypad (OM-16 rest).

**Version: minor** — visible UI change; bump `package.json` minor in the implementation PR.
