# Design roadmap

How the redesign lands, one phase per PR series. Each phase keeps the existing e2e tests green and ends with screenshots in the PR. Tokens and rules: [DESIGN.md](DESIGN.md).

## Phase 1 — Shell + base tokens ✅ done (#132)
- Always-visible left-rail navigation replacing the hover menu — #112 (fixes OM-14 #77, root cause of flaky UI tests OM-11 #74).
- App layout and header: rail + content area, no 1024 px cap (OM-15 #78), header with title, progress and version.
- Minimal `--om-*` variables the shell uses (Mercado values), loaded globally; focus outline (OM-09 #72).
- Plan: [plans/phase-1-shell.md](plans/phase-1-shell.md)
- Mockups: `mockups/A-sell.webp` (rail + header), `mockups/A-orders.webp`. Before: `before/04-menu-products-open.webp`.

## Phase 2 — Full themes + switcher ✅ done (#134, #135)
- Plan: [plans/phase-2-themes.md](plans/phase-2-themes.md)
- All tokens from `themes/all-themes.css`; migrate SCSS colour variables to tokens (OM-32 #95).
- Themes: Mercado #114, Mostrador Noche #115, Ultramarinos #116, Unexpected Neon #117; theme switcher (per device, stored in settings).
- Contrast test over every theme JSON (part of OM-17 #80).
- Mockups/previews: `themes/preview-*.webp`.

## Phase 3 — Shared components ✅ done (#137)
- Plan: [plans/phase-3-components.md](plans/phase-3-components.md)
- `components/`: Button, Card/Tile, Table, Dialog/Sheet, Toast config (max 3, OM-18 #81), EmptyState, Field (label + error), Stepper.
- Replace action anchors with buttons and tie labels (OM-10 #73), 44 px targets (OM-16 #79).
- Mockups: `mockups/A-sell.webp`, `mockups/A-payment.webp`, `mockups/A-products.webp`.

## Phase 4+ — One screen per plan
1. **Sale screen** ("Mostrador") — OM-12 #75, payment sheet #107 (OM-13 #76, OM-01 #64), Venta libre #108, weighted dialog + invalid line #109 (OM-21 #84, OM-23 #86), low stock badge OM-24 #87, plugin slots #105. Later presets #110. Mockups: `A-sell`, `A-payment`, `A-sell-plugin-slots`, `B-sell-scanner`, `C-sell-touch`. Before: `before/15-…`, `16-…`, `17-…`, `20-…`. Plan: [plans/phase-4-sell-screen.md](plans/phase-4-sell-screen.md) (split 4a layout/scanner/Venta libre/weighted, 4b payment/receipt preview/slot).
2. **Orders** — master-detail #111 (OM-07 #70, OM-19 #82, OM-20 #83). Mockup: `A-orders`. Before: `before/22-…`, `24-…`. Plan: [plans/phase-5-orders.md](plans/phase-5-orders.md) (split 5a list/quick ranges/summary, 5b detail route/reprint).
3. **Products** — redesign #98 (OM-22 #85, OM-08 #71). Mockup: `A-products`. Before: `before/10-…`, `13-…`. Plan: [plans/phase-6-products.md](plans/phase-6-products.md) (split 6a read model + sell grid, 6b table/margin/empty states, 6c edit drawer).
4. **Categories** — card grid on tokens and shared components. Before: `before/05-categories.webp`. Plan: [plans/phase-7-categories.md](plans/phase-7-categories.md) (split 7a read model, 7b card grid and dialog, 7c delete confirmation, 7d product links).
5. **Settings** — OM-26 #89 (shop, printer, ticket, theme, language). Plan: [plans/phase-8-settings.md](plans/phase-8-settings.md) (split 8a read models, 8b comercio and appearance, 8c ticket, 8d printer and language). 8a–8d are `Version: none`. 8d closes #89.

## Final — Accessibility pass
- After settings, in order: #87 (low stock still missing "Quedan N" and the nav count; `Version: none`), then #110 (layout presets, selected in Settings; `Version: none`), then this pass. The fit of each is in the phase 8 plan.
- #113 (OM-17 #80, OM-09 #72, OM-10 #73): automated contrast + target-size checks, keyboard walk-through of every screen. **This is the final redesign PR that carries `Version: minor`.**
