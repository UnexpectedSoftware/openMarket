---
name: openmarket-design
description: How to build or change OpenMarket UI so it follows the design system — tokens, shared components, the phased redesign plan and screenshot rules. Use whenever you touch src/openMarket/user_interface (React components, SCSS, layout, navigation, themes) or review a UI diff.
when-to-use: UI change, new screen, component, styling, SCSS, colours, spacing, theme, navigation, nav rail, dialog, toast, table, empty state, accessibility, redesign phase, mockup, screenshot
argument-hint: "[phase-1|component|screen|theme|review] <short description>"
metadata:
  short-description: OpenMarket design system workflow
---

# OpenMarket design workflow

`docs/design/DESIGN.md` has the rules. This skill has the **how**. Root `AGENTS.md` (layers) still applies; use the `openmarket-architecture` skill for anything below the UI.

## Step 1: load the context
1. Read `docs/design/DESIGN.md` (principles, tokens, component catalogue, states, accessibility, rules).
2. Read `docs/design/ROADMAP.md` and find the **current phase** (the first phase whose issues are still open).
3. If a plan exists for that phase (`docs/design/plans/phase-<n>-*.md`), follow it exactly: its file list, tokens, acceptance criteria and tests. Don't pull work from later phases.
4. Open the referenced mockups (`docs/design/mockups/*.webp`) and the "before" screenshots (`docs/design/before/*.webp`).

## Step 2: use tokens
- Colours, spacing, font sizes, radii and shadows come from `var(--om-…)` only. Values are in `docs/design/themes/mercado.css`.
- No hex/rgb literals or raw px spacing in component SCSS or inline styles. JS that needs a colour reads `getComputedStyle(document.documentElement).getPropertyValue('--om-…')`.
- New token? Add it with a role-based name to **every** file in `docs/design/themes/` (CSS + JSON) and to the app's tokens file in the same change.

## Step 3: reuse components
- Check `src/openMarket/user_interface/components/` and the catalogue in DESIGN.md first. Add a variant rather than a new component.
- Actions are `<button type="button">`, navigation is `<Link>`, labels are tied to inputs.
- Every list/screen handles empty, loading and error states.
- React 15 only: class components or hook-free functions, no Fragments, no portals; `connect()` for Redux.

## Step 4: respect the layers
- UI talks to the application only through `OpenMarket.get('<ctx>_<action>_use_case')` (`application/index.js`), via epics. No SQLite, fs, or container imports in `user_interface/`.

## Finish
```bash
npm test && npm run test:integration && npm run typecheck
npm run build && xvfb-run -a npm run test:ui
```
- Attach **before/after screenshots at 1366×768** of every screen you touched to the PR (Playwright `window.screenshot` into `test-results/`).
- PR body: link the issues and the phase, and `Version: none|patch|minor|major` (visible UI change is usually `minor`).
