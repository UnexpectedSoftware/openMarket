# OpenMarket design system

The single reference for how OpenMarket's UI looks and behaves. Read it before changing anything in `src/openMarket/user_interface/`. The phased plan is in [ROADMAP.md](ROADMAP.md); per-phase build plans are in [plans/](plans/).

- **Mockups (target):** [`mockups/`](mockups/): `A-sell` (default "Mostrador" sell screen), `A-payment`, `A-orders`, `A-products`, `A-sell-plugin-slots`, `B-sell-scanner`, `C-sell-touch`.
- **Current UI ("before"):** [`before/`](before/), captured at 1366×768 on v1.14.
- **Themes:** [`themes/`](themes/): one CSS file and one JSON token file per theme, `all-themes.css` (all four, switched by `data-theme`), `contrast.json` (measured WCAG ratios), previews.

## Principles

1. **The sale comes first.** The total and the pay action are always visible. No step in the sell flow that the cashier doesn't need (no mandatory popups).
2. **Touch and keyboard are equal.** Every action works with a tap (≥ 44 px target) and with the keyboard (visible focus, shortcuts for frequent actions).
3. **Calm and legible.** One sans-serif family, tabular figures for money, plain Spanish copy without exclamation marks, at most three toasts.
4. **Tokens, not values.** Every colour, space, size, radius and shadow comes from a `--om-*` token, so a theme is just a values file.
5. **Consistent money and dates.** Money always through `formatMoney` (es-ES, `0,90 €`), dates in the shop locale.
6. **Extensible by slots.** Plugins add UI through named slots (see #105), never by patching components.

## Tokens

CSS custom properties on `:root`, overridden per theme with `[data-theme="<name>"]` on `<html>`. Names are `--om-<category>-<role>[-<variant>]`. The full list is in [`themes/mercado.css`](themes/mercado.css); the JSON files hold the same values for tests and tools.

| Category | Tokens | Notes |
|---|---|---|
| Colour | `--om-color-background`, `-surface`, `-surface-alt`, `-text`, `-text-muted`, `-primary`, `-primary-hover`, `-primary-contrast`, `-primary-soft`, `-accent`, `-accent-contrast`, `-success`, `-success-soft`, `-warning`, `-danger`, `-danger-soft`, `-border`, `-border-strong`, `-focus`, `-overlay` | Name by **role**, never by hue (`--om-color-danger`, not `--om-red`). Text pairs must reach 4.5:1, UI parts 3:1 (`contrast.json`). `--om-color-border` is a decorative divider. Inputs and other controls use `--om-color-border-strong` (≥ 3:1). Charts use `--om-chart-bar`, `-bar-border`, `-bar-hover`. |
| Spacing | `--om-space-0` … `--om-space-9` (0, 4, 8, 12, 16, 20, 24, 32, 40, 56 px) | Use the scale for padding, margin and gaps. No other values. |
| Type | `--om-font-sans`, `-display`, `-mono`, `-numeric`, `--om-font-feature-numeric`; `--om-font-size-xs` … `-3xl`, `-total`; `--om-font-weight-regular/medium/bold`; `--om-line-height-tight/normal`; `--om-letter-spacing-heading/label` | Base size 16 px. Money uses `--om-font-numeric` + `font-feature-settings: var(--om-font-feature-numeric)`. |
| Radius | `--om-radius-sm/md/lg/pill` | Controls use `--om-control-radius`, buttons `--om-button-radius`. |
| Elevation | `--om-shadow-sm/md/lg`, `--om-shadow-focus` | `sm` cards, `md` popovers/toasts, `lg` dialogs. |
| Components | `--om-button-*` (height, padding, radius, weight, primary/secondary/ghost/danger bg+fg), `--om-control-height/radius`, `--om-tile-min-width/image-height/radius` | Component tokens point at base tokens; themes may override them. |

Themes: **Mercado** (light default), **Mostrador Noche** (dark, high contrast), **Ultramarinos** (warm boutique/deli), **Unexpected Neon** (retro magenta→cyan, monospace). See #114–#117.

## Component catalogue

| Component | Use it for | Don't |
|---|---|---|
| **Button** — primary / secondary / ghost / danger; sizes default and `lg` (`--om-button-height-lg`, the pay button) | Primary: the one main action per view ("Cobrar 12,40 €", "Guardar"). Secondary: other actions. Ghost: low-emphasis inline actions. Danger: destructive actions, usually secondary-styled with a danger icon and a confirm/undo. | Two primary buttons in one view. `<a>` or `<div>` with `onClick` (always `<button type="button">`). Global `float`. |
| **Card / tile** | Products and categories in grids (`--om-tile-*`), summary facts (totals, stock). Whole card is one target, or has explicit buttons. | Nested cards. Cards for tabular data. |
| **Table** | Orders, product management, any list the user scans or sorts. Sticky header, row = one record, numbers right-aligned with tabular figures. | Padding with empty rows (react-table `minRows={0}`). Tables inside the sell panel. |
| **Dialog / sheet** | A decision that blocks the current task (payment sheet, confirm delete, weighed quantity). Title says what it is, Enter confirms, Esc and × cancel, focus moves in and returns. | Information that could be a toast or inline text. Dialogs after every sale. |
| **Toast** | Short confirmation of a completed action ("Producto guardado") or a non-blocking warning. Success 2.5 s, errors stay until dismissed, max 3, bottom-centre. | Validation errors (show them inline at the field). Anything the user must act on. |
| **Nav rail** | Primary navigation: always visible on the left, icon + label, ≥ 60 px items, active route marked with `aria-current="page"`. | Hover menus or hidden submenus. More than ~8 items. |

Shared components live in `src/openMarket/user_interface/components/` (Phase 3). Reuse them; add a variant before creating a new component.

## States

Every screen and list handles these explicitly:

- **Empty:** says why it's empty and offers the next step ("Aún no hay productos" + "Crear producto"). Distinguish *no data* from *no results for these filters* (+ "Quitar filtros").
- **Loading:** skeleton or inline spinner in the area being loaded; keep the layout stable. Long jobs (image fetch, catalog print) show progress in the header.
- **Error:** inline, next to what failed, in plain language with a retry when it makes sense. Field errors under the field, tied with `aria-describedby`. Errors from use cases arrive as typed `AppError` codes: map the code to a message in the UI layer.

## Accessibility basics

- Contrast: text ≥ 4.5:1, large text and UI parts ≥ 3:1, in every theme (checked from the token JSON).
- Visible focus everywhere: `:focus-visible { outline: 3px solid var(--om-color-focus); outline-offset: 2px; }`. Never `outline: 0` without a replacement.
- Native semantics: `<button>` for actions, `<a href>` / `<Link>` for navigation, `<label htmlFor>` tied to an input `id`.
- Targets ≥ 44×44 px (≥ 24×24 for inline text links).
- Keyboard: logical tab order, Esc closes dialogs, Enter confirms, shortcuts are documented in the UI (e.g. F12 = Cobrar).
- Don't use colour alone to convey state (add an icon or text).

## Rules

1. **Never hard-code colours, spacing, font sizes, radii or shadows in components** (SCSS or inline JS styles). Always use `var(--om-…)`. JS that needs a colour (charts, notification styles) reads it with `getComputedStyle(document.documentElement).getPropertyValue('--om-…')`.
2. **New tokens** go into every theme file (CSS and JSON) in the same change, with a role-based name.
3. **Reuse before you build:** use the catalogue above and `user_interface/components/`.
4. **Follow the hexagonal layering.** `user_interface/` only talks to the application facade (`OpenMarket.get('<ctx>_<action>_use_case')` from `application/index.js`), plus read-only domain constants/events and `infrastructure/logging/`. No SQLite, fs or container imports in UI code. See root `AGENTS.md`.
5. **Copy and money:** user-facing strings go through the i18n layer when it exists; money through `formatMoney`.
6. **Screenshots in PRs:** every UI PR attaches before/after screenshots at 1366×768 of the screens it touches.
