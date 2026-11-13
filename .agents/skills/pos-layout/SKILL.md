---
name: pos-layout
description: Responsive layout rules for OpenMarket's fixed-viewport touch POS (Electron window 1024×700 to 1920×1080, 88 px nav rail). Use when sizing dialogs (Cobrar, weight, confirm), grids, panels or charts, fixing overflow or horizontal scroll, adding media or container queries, or checking a screen at several window sizes.
paths:
  - "src/openMarket/user_interface/**/*.scss"
  - "src/openMarket/user_interface/**/*Dialog*.js"
  - "src/openMarket/user_interface/**/*Sheet*.js"
  - "src/openMarket/user_interface/report/**"
metadata:
  short-description: POS layout and responsive rules
---

# OpenMarket POS layout

This is a desktop POS, not a website. "Responsive" means it works at every **window** size between the Electron minimum and a big shop monitor, with touch and keyboard. No phone layouts.

## The sizes that matter

| Window | Content width (minus 88 px rail) | Why |
|---|---|---|
| 1024×700 | 936 px | `minWidth`/`minHeight` in `main.development.js`. Must work; this is the "compact" case |
| 1366×768 | 1278 px | Default window and the PR screenshot size |
| 1920×1080 | 1832 px | Shop monitor; things must not stretch |

`@media (max-width: 720px/800px)` blocks in `products.scss` and `dashboard.scss` can never match inside the 1024 px minimum window. Don't add more of them; prefer container queries (below).

## Rules

1. **No horizontal scroll, ever,** on a screen, card or dialog. Long ranges and lists bucket, wrap or truncate; they don't scroll sideways. (#182: the Ventas por día chart has to fit its card.)
2. **Flex and grid children get `min-width: 0`** (and `min-height: 0` in column flex) so long text and tables can shrink. Most overflow bugs in this repo are a missing `min-width: 0`.
3. **Size panels by their container, not the window.** The sell screen has the rail and the cart beside the grid, so viewport media queries lie about the space. Electron 44 supports container queries: set `container-type: inline-size` on the panel and use `@container (max-width: …)` inside it.
4. **Dialogs get a min and a max width with `clamp()`, and never exceed the window:**
   - Cobrar (`.payment-dialog`): `width: clamp(<compact min>, 90vw, <wide max>)` built from tokens, so the keypad and quick amounts never overlap at 1024 px and it doesn't stretch at 1920 px. Mockups: `A-payment-responsive-compact.webp`, `A-payment-responsive-wide.webp`.
   - Small decision dialogs (weight, confirm delete): compact (content-sized, roughly 360–480 px), footer buttons **right-aligned**, primary action last. Mockups: `A-sell-weight-dialog*.webp`.
   - `max-height: 90%` with the body scrolling (`.om-dialog-body { overflow: auto }`); header and actions stay visible.
   - Px values go through tokens: `calc(var(--om-space-9) * N)` like `om-dialog.scss`, or a new `--om-dialog-*` token in every theme file.
5. **Grids of tiles** use `repeat(auto-fill, minmax(var(--om-tile-min-width), 1fr))`; never a fixed column count that breaks at 936 px.
6. **Touch:** targets ≥ 44×44 px, no hover-only actions, the total and Cobrar always visible on the sell screen.
7. **Numbers:** money and weights right-aligned with tabular figures (`--om-font-numeric` + `font-feature-settings: var(--om-font-feature-numeric)`). Weights via `formatKgMilli` (`2,8 kg`, never `2,800 Kg`).
8. **Charts (Chart.js 2 via react-chartjs-2):** `responsive: true, maintainAspectRatio: false` inside a sized wrapper; derive bar thickness from the bucket count; thin tick labels (`autoSkip`) instead of shrinking the font; colours from `--om-chart-*` tokens.

## Check it

- Playwright: `await window.setViewportSize({width: 1024, height: 700})` and `1366×768` (and `1920×1080` for stretch problems). Assert no overflow: `document.documentElement.scrollWidth <= document.documentElement.clientWidth`, and the dialog's `getBoundingClientRect()` sits inside the viewport.
- Screenshot only the screens you touched, in the default theme plus one dark theme (Mostrador Noche); not the four-theme matrix.
- #174 tracks turning these checks into a `test:visual` suite; reuse its helper once it exists.
