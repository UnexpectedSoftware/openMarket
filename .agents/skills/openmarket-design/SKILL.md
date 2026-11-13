---
name: openmarket-design
description: How to build or change OpenMarket UI so it follows the design system (tokens, shared components, states, screenshots). Use whenever you touch src/openMarket/user_interface (React components, SCSS, layout, navigation, themes) or review a UI diff. For sizing, dialogs, overflow or charts also use pos-layout.
paths:
  - "src/openMarket/user_interface/**"
metadata:
  short-description: OpenMarket design system workflow
  argument-hint: "[component|screen|theme|review] <short description>"
---

# OpenMarket design workflow

`docs/design/DESIGN.md` has the rules. This skill has the **how**. Layer rules: `src/openMarket/user_interface/AGENTS.md`.

## Step 1: load only the context you need
1. Read the `DESIGN.md` section for what you're touching (Tokens, Component catalogue, States, Accessibility). Don't read the whole file for a one-component change.
2. Phases 1–8 of `docs/design/ROADMAP.md` are done. Don't read the roadmap or `docs/design/plans/` unless the issue links a plan.
3. Open a mockup (`docs/design/mockups/*.webp`) only when the issue names it or the screen has one: `A-payment-responsive-{wide,compact}` for Cobrar, `A-sell-weight-dialog*` for the weight dialog, `A-reports-*` for Informes, `A-settings-*` for Ajustes. One image costs about as much as a long file; never open `docs/design/after/` or `before/` unless asked.

## Step 2: tokens
- Colours, spacing, font sizes, radii, shadows: `var(--om-…)` only. Values are in `docs/design/themes/mercado.css`; grep it for the name instead of reading it.
- No hex/rgb literals or raw px spacing in component SCSS or inline styles. JS that needs a colour (Chart.js) reads `getComputedStyle(document.documentElement).getPropertyValue('--om-…')`.
- New token: role-based name, added to **every** file in `docs/design/themes/` (CSS + JSON) and `style/settings/themes.scss` in the same change.

## Step 3: components
- Reuse `src/openMarket/user_interface/components/` first; add a variant rather than a new component.
- Actions are `<button type="button">`, navigation is `<Link>`, labels are tied to inputs.
- Every list and screen handles empty, loading and error states.
- React 15 only: class components or hook-free functions, no Fragments, no portals; `connect()` for Redux.
- Money through `formatEuroCents`, weights through `formatKgMilli` (`domain/money/formatEs.js`, no trailing zeros: `2,8 kg`).

## Step 4: layers
- UI talks to the application only through `OpenMarket.get('<ctx>_<action>_use_case')`, from epics. No SQLite, fs, or container imports in `user_interface/`.

## New screen checklist (Redux flow)
1. `model.js`: `state()` and pure update functions (unit tests).
2. `action.js`: request/result action pairs.
3. `reducer.js`: delegates to `model.js`; register in `reducers/index.js`.
4. `epicFactory.js` + `epic.js`: one epic per side effect, ending in a result or failure action; register in `epics/index.js`. Test factories with faked use cases (`Rx.Observable.of(...)`).
5. `Container.js`: render props, dispatch actions; `setState` only for ephemeral visual state.
6. `ReduxConnector.js`: `mapStateToProps` / `mapDispatchToProps`; routes import this file.

## Finish
Run the `om-finish` skill. UI PRs attach before/after screenshots at 1366×768 of every touched screen; for layout changes also 1024×700 (the window minimum).
