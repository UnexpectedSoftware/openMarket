---
name: openmarket-architecture
description: Step-by-step recipes and code templates for adding code to OpenMarket's DDD/hexagonal architecture. Use whenever you add or change a use case, repository, adapter, domain event, query or report, error, or plugin, or when you review a diff for architecture problems.
metadata:
  short-description: OpenMarket architecture recipes
  argument-hint: "[use-case|repository|event|query|error|plugin|review] <short description>"
---

# OpenMarket architecture recipes

Root `AGENTS.md` and the layer `AGENTS.md` files have the rules. This skill has the **how**.

Pick **one** recipe, read only that reference file, follow its file checklist in order, then run the `om-finish` skill. The examples use a made-up `Supplier` context and an `AdjustStock` use case; rename them to fit your task. Match the surrounding code style (2-space indent, RxJS 5 `Rx.Observable`, named-object constructor params).

| Task | Read |
|---|---|
| Add or change a use case | [references/recipe-1-use-case.md](references/recipe-1-use-case.md) |
| Add a repository (port, adapter, mapper, table, contract test) | [references/recipe-2-repository.md](references/recipe-2-repository.md) |
| Add a domain event or a handler | [references/recipe-3-domain-event.md](references/recipe-3-domain-event.md) |
| Add a read or a report | [references/recipe-4-read-or-report.md](references/recipe-4-read-or-report.md) |
| Add a typed error | [references/recipe-5-typed-error.md](references/recipe-5-typed-error.md) |
| Plugin loader work | [references/recipe-6-plugin.md](references/recipe-6-plugin.md) |

UI screens follow the unidirectional Redux flow in `src/openMarket/user_interface/AGENTS.md` (template `order/new_order`); epics call use cases through `OpenMarket.get('<key>')`.

## Review checklist (use for "review this diff")

- [ ] No new `*Store`/`*Dao`/`*Manager`/`*Helper`, and every persistence class is `<Name>Repository`
- [ ] Repository methods are collection-like. No business decision inside SQL or adapter code.
- [ ] Behaviour is on aggregates. Use cases load → call → save. No `obj._field =` from outside.
- [ ] Use cases depend on ports via the constructor, never on another use case, with multiple writes in `transaction.run`
- [ ] Durable events are saved, and live events are recorded, inside the caller's transaction. `raise()` after commit drains the bus queue, and `discard()` runs when the transaction fails. The bus and `SqliteTransaction` do not reference each other
- [ ] Typed `AppError` with an `ErrorCode`, and no `new Error('…')` for shop failures
- [ ] Container factory added. Facade key added if the UI needs it.
- [ ] JSDoc: destructured params as `@param {{prop: Type}}`, `@typedef {import()}`, `@implements` on adapters, no `.ts` files and no `/** @import */`
- [ ] Tests: unit (ports faked), contract line for new adapters, itest for SQL
