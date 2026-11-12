---
name: ui-review
description: Review an OpenMarket UI diff or screen for layout, accessibility and design-system problems before a PR. Use when asked to review UI, audit a screen, check accessibility, or before opening a UI PR.
disable-model-invocation: true
metadata:
  short-description: OpenMarket UI review
  argument-hint: "[file|screen|diff]"
---

# OpenMarket UI review

Review the diff (`git diff main...HEAD -- src/openMarket/user_interface`) or the named files. Report findings as `file:line — problem — fix`, most severe first. Don't rewrite the UI; propose minimal fixes.

Checks (OpenMarket-specific; condensed from Vercel's Web Interface Guidelines and ibelick's fixing-accessibility, adapted to React 15 + SCSS):

**Layout** (see the `pos-layout` skill)
- No horizontal overflow at 1024×700; dialogs inside the viewport; flex/grid children have `min-width: 0`.
- Dialog widths use `clamp()`/tokens; small dialogs compact with right-aligned footer, primary last.
- No dead `@media (max-width < 1024px)` rules added.

**Design system**
- No hex/rgb, raw px spacing, font sizes or shadows; `var(--om-…)` only. New tokens in every theme file.
- Shared components reused (`components/`); one primary button per view.
- Empty, loading and error states present; errors inline with `aria-describedby`.
- Money via `formatEuroCents`, weights via `formatKgMilli`, Spanish copy without exclamation marks, comma decimals.

**Accessibility**
- Actions are `<button type="button">`, navigation `<Link>`; icon-only buttons have `aria-label`.
- Visible `:focus-visible` outline; no `outline: 0` without replacement.
- Dialogs: focus moves in and returns, Esc cancels, Enter confirms, `role="dialog"` + labelled title (the shared `Dialog` does this; check custom ones).
- Targets ≥ 44×44 px; state not by colour alone; text contrast ≥ 4.5:1 (the contrast test covers tokens, not one-off colours).

**Architecture**
- Components don't call `OpenMarket.get`; epics do. Domain/screen data in the store, `setState` only for ephemeral visual state.
- React 15: no hooks, Fragments or portals.

Finish with a one-line verdict and whether before/after screenshots (1366×768, plus 1024×700 for layout work) are needed.
