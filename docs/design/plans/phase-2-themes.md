# Phase 2 plan — full themes + theme switcher

> **Grok Build prompt:** Implement `docs/design/plans/phase-2-themes.md` in OpenMarket. Load the full `--om-*` token set and the four themes (Mercado default, Mostrador Noche, Ultramarinos, Unexpected Neon) as `[data-theme]` CSS blocks, migrate every remaining hard-coded colour and `$c-*` SCSS colour variable in `src/openMarket/user_interface` to tokens, persist the theme through a new `ThemePreference` setting (domain port + SQLite adapter on the existing `setting` table + use cases + facade keys), apply it before the first render, add a theme picker with live swatches to the Settings screen, add a WCAG AA contrast unit test and extend the hex-colour test to all UI files, and add per-theme Playwright screenshots. Read `docs/design/DESIGN.md`, root `AGENTS.md` and the `openmarket-design` skill first. React 15 only. One PR, `Version: minor`. PR body: `Closes #95, closes #114, closes #115, closes #116, closes #117`.

Issues: OM-32 #95 (design tokens), #114 Mercado, #115 Mostrador Noche, #116 Ultramarinos, #117 Unexpected Neon. Contrast part of OM-17 #80.

## What Phase 1 landed (master abc4c38, PR #132)
- `user_interface/style/settings/tokens.scss`: a `:root` subset of Mercado (colour 11 tokens, space 1–7, a few font sizes/weights, `radius-md`, `shadow-sm/focus`) plus shell tokens `--om-rail-width`, `--om-rail-item-height`, `--om-header-height` (also added to `docs/design/themes/*.css`). Imported first in `file.scss`.
- `containers/NavRail.js` (Vender F2, Pedidos F3, Productos F4, Categorías, Informes (+ Takings), Plugins, Ajustes), `containers/App.js` shell (`.app-shell`, header, skip link, `.app-body`, `#main`), `style/components/navrail.scss`. `rc-menu` is gone; `outline: 0` and the 1024 px cap are gone; window 1366×768.
- `e2e/shell.spec.js` saves `test-results/shell-<screen>.png` per rail item.
- `src/test/openMarket/user_interface/style/noHexColors.spec.js` checks **only** `navrail.scss`.
- `App.js` notification style already uses `var(--om-color-warning)`.
- Settings: `/settings` (`user_interface/settings/*`) edits `ShopProfile` via facade keys `shop_get_profile_use_case` / `shop_update_profile_use_case`; persistence `infrastructure/shop/SqliteShopProfileRepository.js` on the generic `setting (key, value_json)` table (key `shop_profile`).

## Remaining hard-coded colours (grep on master)
- **Legacy palette:** `style/settings/settings.scss` defines `$c-font`, `$c-white`, `$c-base`, `$c-primary(-light|-lightest|-dark|-darkest)`, `$c-grey(-light|-lightest|-darkest)`, `$c-warning`, `$c-alert(-light)` (old Material blue). Used ~140 times in `style/components/`: `products.scss` (40), `dashboard.scss` (20), `categories.scss` (19), `table.scss` (14), `calendar.scss` (11), `modal.scss` (7), `plugins.scss` (6), `input.scss` (5), `settings-page.scss` (4), `button.scss`, `textarea.scss` (3 each), `forms.scss` (2), plus `file.scss` (6).
- **Literal colours:** `dashboard.scss:88` `rgba($c-primary, .55)`, `:150` `rgba($c-primary, .35)`, `:169` `#2E7D32`; `categories.scss:107` `rgba(255,255,255,.92)`, `:111` shadow `rgba(0,0,0,.2)`; `modal.scss:7` overlay `rgba(00,00,00,.5)`; `products.scss:51,170,328` shadow `rgba(0,0,0,.08)`.
- **JS (chart.js):** `home/Container.js:6-7,59` and `sales/ProductSales.js:8-9,45` (`rgba(33,150,243,…)`, `#2196F3`).
- Third-party CSS imported in `file.scss` (`react-table.css`, `react-datepicker.css`) keeps its own colours; override the visible parts in `table.scss` / `calendar.scss` with tokens.

## 1. Token set
- Replace `tokens.scss` with `style/settings/themes.scss` generated from (or copied from) `docs/design/themes/all-themes.css`: `:root, [data-theme="mercado"] {…}`, `[data-theme="mostrador-noche"] {…}`, `[data-theme="ultramarinos"] {…}`, `[data-theme="unexpected-neon"] {…}`. All names are already `--om-*` and match Phase 1 (`--om-color-surface-alt`, `--om-color-text-muted`, …). Keep the three shell tokens in every block.
- **Naming fixes:** the JSON files use camelCase (`surfaceAlt`, `textMuted`, `primaryContrast`) and `contrast.json` refers to those; the contrast test maps camelCase → `--om-color-kebab-case` in one helper. Add tokens the migration needs and the theme files lack, to **every** theme (CSS + JSON): `--om-color-on-overlay` is not needed; add `--om-color-border-strong` (input/control boundary, ≥ 3:1 against `surface`, see §5), `--om-color-primary-soft` (selected/hover tint, replaces `rgba($c-primary, .35/.55)`), `--om-color-success-soft`, `--om-color-danger-soft`, `--om-chart-bar`, `--om-chart-bar-border`, `--om-chart-bar-hover`.
- `color-scheme` per theme (already in the files) so native controls follow.
- Fonts: themes reference Inter / JetBrains Mono; bundle them offline (`@fontsource/inter`, `@fontsource/jetbrains-mono`) or keep the system fallbacks — decide in the PR, no network fonts.

## 2. Migrate existing screens
- Map legacy variables to tokens, then **delete the `$c-*` colour variables** from `settings.scss` (keep non-colour SCSS vars):

| Legacy | Token |
|---|---|
| `$c-font`, `$c-base` | `var(--om-color-text)` |
| `$c-white` (backgrounds) | `var(--om-color-surface)` |
| `$c-white` (text on primary) | `var(--om-color-primary-contrast)` |
| `$c-primary`, `$c-primary-dark(est)` | `var(--om-color-primary)`, `var(--om-color-primary-hover)` |
| `$c-primary-light(est)` | `var(--om-color-primary-soft)` |
| `$c-grey`, `$c-grey-darkest` | `var(--om-color-text-muted)` |
| `$c-grey-light` | `var(--om-color-border)` |
| `$c-grey-lightest` | `var(--om-color-surface-alt)` |
| `$c-warning`, `$c-alert` | `var(--om-color-danger)` |
| `$c-alert-light` | `var(--om-color-danger-soft)` |
| `#2E7D32` | `var(--om-color-success)` |
| overlay `rgba(0,0,0,.5)` | `var(--om-color-overlay)` |
| card shadows | `var(--om-shadow-sm)` / `var(--om-shadow-md)` |
| `rgba(255,255,255,.92)` (photo controls) | `var(--om-color-surface)` with `opacity` |

- Files: every file listed above plus `file.scss`. Spacing/radius literals may stay this phase (Phase 3 restyles components); colours may not.
- Charts: add `user_interface/style/themeColor.js` — `themeColor(name)` = `getComputedStyle(document.documentElement).getPropertyValue('--om-' + name).trim()`; `home/Container.js` and `sales/ProductSales.js` read `chart-bar`, `chart-bar-border`, `chart-bar-hover` at render time (re-render on theme change via the Redux theme state).

## 3. Theme preference (settings mechanism, hexagonal)
- Domain: `domain/appearance/Theme.js` value object (`Theme.of('mercado' | 'mostrador-noche' | 'ultramarinos' | 'unexpected-neon')`, `Theme.DEFAULT = mercado`, unknown id → `InvalidThemeError` + `ErrorCode`). `domain/appearance/AppearancePreferences.js` aggregate (`theme`, `changeTheme({theme})`), port `domain/appearance/AppearancePreferencesRepository.js` (`find()` → defaults when missing, `save({preferences})`).
- Adapter: `infrastructure/appearance/SqliteAppearancePreferencesRepository.js` on the existing `setting` table, key `appearance` (same pattern as `SqliteShopProfileRepository`). Contract line in `src/test/openMarket/contracts/ports.spec.js`.
- Use cases: `application/service/appearance/GetAppearancePreferences.js`, `ChangeTheme.js`; container factories; facade keys `appearance_get_use_case`, `appearance_change_theme_use_case`.
- **No flash at startup:** in `user_interface/index.js`, before `render(...)`, call `OpenMarket.get('appearance_get_use_case')` (SQLite is synchronous, the Observable emits synchronously) and set `document.documentElement.dataset.theme`; also seed the Redux `appearance` state. On failure fall back to `mercado` and log. Components never touch `localStorage` or the DOM attribute directly; a small epic applies `dataset.theme` when `THEME_CHANGED` succeeds.
- Per device: the setting lives in the local SQLite, so each till keeps its own theme.

## 4. Theme picker (Settings screen)
- New section "Apariencia" in `user_interface/settings/Container.js` (separate small form or component `settings/ThemePicker.js`, React 15 class or hook-free function): one radio card per theme (`role="radiogroup"`, each card `role="radio"`, `aria-checked`, arrow keys move, Enter/Space select), showing the theme name and swatches (background, surface, primary, accent, text) rendered with an inline wrapper `data-theme="<id>"` so each card previews its own tokens.
- Selecting a card previews live (sets `dataset.theme`), "Guardar" persists via `appearance_change_theme_use_case`; leaving without saving restores the saved theme. Toast on success (existing notifications).
- Actions/reducer/epic in `user_interface/settings/` (or `user_interface/appearance/`), facade only.

## 5. Contrast test (WCAG AA)
- `src/test/openMarket/user_interface/style/contrast.spec.js`: for each `docs/design/themes/*.json`, compute ratios for the pairs in `contrast.json` (text/background, text/surface, text-muted/surface, primary-contrast/primary, danger/surface, focus/background, …) from the JSON values and assert ≥ `required` (4.5 text, 3 large/UI). Also assert the CSS file values equal the JSON values (so CSS and JSON can't drift).
- **Found while planning:** `border` vs `surface` is 1.38–1.59 in all four themes (`contrast.json`). Treat `--om-color-border` as decorative (dividers, card edges; WCAG 1.4.11 does not apply) and use the new `--om-color-border-strong` (≥ 3:1) for input/control boundaries and focusable card outlines; the test enforces 3:1 for `border-strong` and skips `border`.

## 6. Hex/colour lint for all UI files
- Extend `noHexColors.spec.js`: scan **all** `user_interface/**/*.scss` and `user_interface/**/*.js`, fail on `#rgb[a]/#rrggbb[aa]`, `rgb(`/`rgba(`/`hsl(` literals and `$c-` variables. Exempt only `style/settings/themes.scss` and theme-generation files. Keep the message pointing to DESIGN.md rules.

## 7. Ticket printing unaffected
- Receipts are ESC/POS blocks (`infrastructure/printer/EscPosReceiptRenderer.js`, `domain/receipt/coreBlocks.js`) with no CSS. Don't touch them. `e2e/receipt.spec.js` must stay green; add an assertion that changing the theme doesn't change the receipt blocks.

## Tests
- Unit: `Theme.spec.js`, `AppearancePreferences.spec.js`, `ChangeTheme.spec.js` (ports faked), contract test for the adapter, contrast and colour-lint specs, a reducer/epic test that `THEME_CHANGED` sets `dataset.theme`.
- Integration: `src/itest/AppearanceSpec.js` — save/find on the `setting` table; missing row → Mercado.
- Playwright `e2e/themes.spec.js`: for each theme, select it on Settings, save, restart the app (`launch.js` with the same user data) and assert `document.documentElement.dataset.theme` before first paint (check in the first `domcontentloaded`), then screenshot Vender, Pedidos, Productos, Categorías, Informes, Ajustes to `test-results/theme-<id>-<screen>.png` (artifacts, no pixel diff yet). Assert body background colour changes between Mercado and Mostrador Noche.
- Keep `shell`, `orders`, `products`, `categories`, `plugins`, `receipt`, `settings` specs green.

## React 15 constraints
No hooks, Fragments, portals or new context API. Class components or plain function components; `connect()` for state. Theme changes flow through Redux + the DOM attribute, not React context.

## Acceptance criteria
- Four themes selectable on Settings with live preview; choice persists per device and applies before first paint (no Mercado flash on restart).
- No colour literal or `$c-*` variable left in `user_interface/` outside the theme file; the extended lint test passes.
- Contrast test passes for every theme; CSS and JSON values match.
- Charts and the warning toast follow the theme; receipts unchanged.
- `npm run test-all`, `npm run typecheck`, `npm run build`, `xvfb-run -a npm run test:ui` green; per-theme screenshots attached to the PR.

## Out of scope
- Restyling components (buttons, cards, tables, dialogs, toasts) beyond swapping colours — Phase 3.
- Screen redesigns (sale screen, orders, products, categories, settings layout) — Phase 4+.
- Theme editor, per-user themes, layout presets (#110).

**Version: minor** — visible UI change; bump `package.json` minor and put `Version: minor` in the implementation PR body with the closing keywords above.
