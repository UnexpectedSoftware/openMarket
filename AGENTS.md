# OpenMarket: rules for coding agents

Electron 44 point-of-sale app. React 15 + Redux 3 + redux-observable, RxJS 5, SQLite (`node:sqlite`), plain JavaScript with JSDoc types (no `.ts` files). DDD with a hexagonal layout under `src/openMarket/`. Each layer folder has its own `AGENTS.md`; `.cursor/rules/` adds file-scoped rules.

## Layers and the dependency rule

| Folder | Holds | May import |
|---|---|---|
| `domain/` | Aggregates, value objects (`Money`, `Quantity`, `VatRate`), ports (`@interface` classes), events, typed errors | other domain files only |
| `application/` | Use cases `application/service/<ctx>/<VerbNoun>.js`; facade `application/index.js` | `domain/`, `infrastructure/logging/`; only `index.js` imports the container |
| `infrastructure/` | Adapters (`Sqlite<Name>Repository`, mappers, factories), DI container `dic/Container.js`, dev fixtures `dev/` | anything below it |
| `user_interface/` | React/Redux/epics | `application/index.js` via `OpenMarket.get('<key>')`, `domain/` value objects and functions, `infrastructure/logging/` |

Dependencies point inwards; `src/test/openMarket/architecture/architecture.spec.js` enforces it. Never add lines to its `KNOWN_VIOLATIONS`.

## Golden rules

1. Repositories are collections (save, find, remove, counts) with **no business decisions**. Behaviour lives in aggregates; use cases load → call aggregate methods → save, with several writes in `transaction.run(() => …)`.
2. Use cases depend on ports passed to the constructor, never on `Sqlite*` classes or another use case.
3. **No invalid state, anywhere.** Every write, including test helpers and dev fixtures, goes through the aggregates and preferably the use cases. No raw SQL inserts.
4. Time comes from the injected `Clock`. No `new Date()` / `Date.now()` in `domain/` or `application/` (architecture test).
5. Money in integer cents (`Money`), quantities in milli-units (`Quantity`).
6. Shop failures are typed `AppError` subclasses with an `ErrorCode`, never `new Error('…')`.
7. New class → `_camelName()` factory in `dic/Container.js`; UI-facing use case → `'<ctx>_<action>_use_case'` key in `application/index.js`.
8. UI screens are unidirectional Redux (template `user_interface/order/new_order`); no `setState` for domain or screen data.

## Skills (load on demand)

- `openmarket-architecture`: recipes for use cases, repositories, events, reads, errors, plugins, and architecture review.
- `openmarket-design` + `pos-layout`: any UI, SCSS, dialog or chart work. `ui-review` before a UI PR.
- `om-finish`: the done-checklist (tests, typecheck, CRAP ≤ 30, duplication, mutation, PR `Version:` line). Run it before saying you're done.

## Commands

`npm ci` (Node 24+). `npm test -- --reporter dot` (unit + architecture), `npm run test:integration`, `npm run typecheck`, `npm run fixtures` (demo shop, CLI only). Never weaken, skip or delete a test to pass a gate.
