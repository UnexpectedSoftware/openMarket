# user_interface: rules for coding agents

React 15 + Redux 3 + redux-observable UI. Root `AGENTS.md` rules apply.

- **Design system:** read `docs/design/DESIGN.md` before changing components or styles, and follow the plan for the current phase in `docs/design/ROADMAP.md` / `docs/design/plans/`.
- **Skill:** use `.grok/skills/openmarket-design/SKILL.md` for the step-by-step workflow.
- Colours, spacing, type, radius and shadows: `var(--om-…)` tokens only, never hard-coded values.
- Use application use cases for writes and queries for reads, through the facade (`OpenMarket.get('<key>')`) from epics. The UI may import domain value objects (`Money`, `Quantity`, `VatRate`, `VatBreakdown`) and domain functions directly, for example to compute cart totals the same way `CreateOrder` does. Never import SQLite, fs, the container or infrastructure adapters.
- React 15: no hooks, Fragments or portals.
- UI PRs attach before/after screenshots at 1366×768.
