# Phase 1 plan — app shell + base tokens

Grok Build-ready plan. Scope: **shell only** (navigation, layout, header, base tokens, focus). Screens keep their current content. Issues: #112 (left rail), OM-14 #77, OM-15 #78, OM-09 #72, and it removes the hover-menu race behind OM-11 #74. Read [../DESIGN.md](../DESIGN.md) and root `AGENTS.md` first.

**Version: minor** — this changes the UI visibly (new navigation). Bump `package.json` to the next minor and put `Version: minor` in the PR body.

## Mockups and references
- Target: `docs/design/mockups/A-sell.webp` (left rail, header bar), `docs/design/mockups/A-orders.webp` (rail with content area at full width).
- Before: `docs/design/before/04-menu-products-open.webp` (hover menu), `before/10-product-list.webp` (1024 px cap), `before/27-dashboard-most-sold.webp`.
- Token values: `docs/design/themes/mercado.css`.

## React 15 constraints
- React 15.7 + react-router 3 + Redux 3: **no hooks, no Fragments (`<>`), no portals, no `forwardRef`, no new context API.** Use class components (or plain function components without hooks) and `connect()`.
- Active route: react-router 3 `<Link activeClassName="is-active" onlyActiveOnIndex>` (use `onlyActiveOnIndex` for `/`); for `aria-current`, read `this.props.location` / `router.isActive(path, indexOnly)` via `withRouter` from `react-router`.
- Components return a single root element.
- Don't upgrade React or the router in this phase.

## Files to touch
| File | Change |
|---|---|
| `src/openMarket/user_interface/containers/Navbar.js` | Replace `rc-menu` (`Menu`/`SubMenu`/`MenuItem`) with a `<nav aria-label="Principal">` list of `<Link>`s (rename the component to `NavRail` in a new `containers/NavRail.js` and delete `Navbar.js`, or keep the file name; keep the `imageFetch`/`catalogPrint` progress and the version, moving them to the header). |
| `src/openMarket/user_interface/containers/App.js` | Layout: `<div class="app-shell">` with header, `<NavRail/>` and `<main id="main" class="app-main">{children}</main>`; skip link "Saltar al contenido". Move `notificationStyle` colours to `var(--om-color-warning)` (or leave a TODO for Phase 2 if the library needs a literal). |
| `src/openMarket/user_interface/style/settings/tokens.scss` (new) | Base `:root` tokens copied from `docs/design/themes/mercado.css`, only those used by the shell (list below). Imported first in `file.scss`. |
| `src/openMarket/user_interface/style/components/navrail.scss` (new), `style/components/navbar.scss` (delete) | Rail styles using tokens only. |
| `src/openMarket/user_interface/file.scss` | Import `tokens.scss` and `navrail.scss`; drop the `rc-menu` CSS import (line 4) and `navbar.scss`; update `.header` (line 58) and `h1` (line 33) to tokens; global `:focus-visible` rule. |
| `src/openMarket/user_interface/style/utils/mixins/container-fluid.scss` + `style/settings/settings.scss` (`$max-layout`) | Remove the 1024 px cap for app screens (OM-15). |
| `src/openMarket/user_interface/style/components/{button,input,textarea,forms,products}.scss` | Remove `outline: 0` (OM-09); the global focus rule replaces it. |
| `src/openMarket/user_interface/main.development.js` (lines 82-83) | Default window 1366×768, `minWidth: 1024`, `minHeight: 700`. |
| `package.json` | Remove `rc-menu` if nothing else uses it; minor version bump. |
| `e2e/launch.js` (`chooseMenu`, line 53) | Replace the hover + `toPass` loop with a single click on the rail link; keep the helper signature so the specs don't change, or update callers in `products.spec.js`, `orders.spec.js`, `categories.spec.js`, `plugins.spec.js`. |

## Tokens to introduce (Mercado values)
`--om-color-background`, `-surface`, `-surface-alt`, `-text`, `-text-muted`, `-primary`, `-primary-hover`, `-primary-contrast`, `-border`, `-focus`, `-warning`; `--om-space-1`…`-7`; `--om-font-sans`, `--om-font-size-sm/md/lg/xl`, `--om-font-weight-medium/bold`; `--om-radius-md`; `--om-shadow-sm`, `--om-shadow-focus`; plus shell tokens `--om-rail-width` (88px), `--om-rail-item-height` (64px), `--om-header-height` (56px) — add these three to every file in `docs/design/themes/` too. Existing SCSS variables stay for now (Phase 2 migrates them).

## Navigation items → existing routes (`user_interface/routes.js`)
| Rail item (label) | Route | Icon (font-awesome 4) |
|---|---|---|
| Vender | `/create_order` | `fa-shopping-basket` |
| Pedidos | `/list_orders` | `fa-list-alt` |
| Productos | `/list_products` (+ "Nuevo producto" button on the list page linking to `/create_product`) | `fa-cube` |
| Categorías | `/categories` | `fa-tags` |
| Informes | `/` (Most sold) with a secondary tab/link to `/takings` | `fa-bar-chart` |
| Plugins | `/plugins` | `fa-plug` |

Labels: Spanish as above (the i18n layer, OM-25, comes later; keep strings in one constant array in `NavRail.js`). Remove "new Product!"/"new Order!" wording from navigation. **Update e2e link names** accordingly in `launch.js`.

## Keyboard navigation
- Rail is a `<nav>` with a `<ul>` of links; Tab reaches each link, Enter follows it; `aria-current="page"` on the active one.
- Shortcuts (global `keydown` in `App.js`, ignored while typing in inputs except F-keys): `F2` Vender, `F3` Pedidos, `F4` Productos (document them in each link's `title`).
- Skip link to `#main` as the first focusable element.
- Visible focus via `:focus-visible` with `--om-color-focus`.

## Tasks
1. Tokens file + global import + focus rule.
2. NavRail + App layout + header; remove `rc-menu`.
3. Remove 1024 px cap; window size.
4. e2e helper update; new e2e tests (below).
5. **Add a test that fails on hard-coded hex colours in new/changed shell SCSS** (`navrail.scss`, `tokens.scss` excepted): `src/test/openMarket/user_interface/style/noHexColors.spec.js`, scanning `style/components/navrail.scss` (extend the list as later phases migrate files).
6. Screenshots for the PR.

## Acceptance criteria
- Every route reachable with one click from the rail, no hover needed; `aria-current="page"` follows the route.
- At 1366×768 the content area is wider than 1250 px; no 1024 px cap.
- Shell (rail, header) uses only `var(--om-…)` values; the hex test passes.
- Tab shows a visible focus ring on rail links and buttons; F2/F3/F4 navigate.
- `rc-menu` removed from `package.json` and `file.scss`; `chooseMenu` has no `toPass` loop.
- `npm test`, `npm run test:integration`, `npm run typecheck`, `npm run build` and `xvfb-run -a npm run test:ui` pass; existing e2e specs green.

## Tests
- **Unit** (`src/test/openMarket/user_interface/containers/NavRail.spec.js`): renders one link per item with the right `to`; marks the active item given a location; shortcut handler maps F2/F3/F4 to routes. Use `react-dom/test-utils` / shallow render compatible with React 15.
- **Unit**: hex-colour test (task 5).
- **Playwright** (`e2e/shell.spec.js`): click each rail item and assert the page heading; assert `aria-current`; keyboard: Tab to the first rail link and assert computed `outline-style` ≠ `none`; F2 opens Vender. Save a screenshot per main screen (Vender, Pedidos, Productos, Categorías, Informes, Plugins) at 1366×768 to `test-results/shell-<screen>.png` (attach to the PR; not a pixel-diff assertion yet).
- Keep `categories.spec.js`, `orders.spec.js`, `products.spec.js`, `plugins.spec.js` green.

## Out of scope
Theme switcher and other themes (Phase 2), shared components (Phase 3), screen redesigns (Phase 4+).
