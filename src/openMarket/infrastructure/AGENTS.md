# infrastructure/: extra rules

- An adapter implements exactly one domain port: `/** @implements {Port} */`, with no `extends` in new code. Every public method of the port is implemented, with the same destructured params. There are no extra public methods that use cases rely on (put those on the port first).
- `Sqlite<Name>Repository`: SQL statements are `const …_SQL` at the top of the file. Use `this._database = connection.database`, wrap every method in `Rx.Observable.defer(...)`, map rows with the `Sql<Name>Mapper`, and wrap driver errors with `rethrow(error, {message, context})` from `logging/ErrorLog`.
- No business decisions in repositories (no stock arithmetic, status rules or totals). The existing guarded category delete is an atomic backstop that raises `CategoryNotEmptyError`. It isn't a pattern to extend.
- `Sqlite<Name>QueryService` holds SQL clause and row-folding helpers for **one** repository. The container injects it only into that repository. It is never a port and never reaches `application/`.
- New tables and columns go in `service/SqliteConnection.js` (`CREATE TABLE IF NOT EXISTS …` in `SCHEMA`, `ensureColumn(...)` for added columns). Store money as it is stored today until the money/VAT work lands. Don't invent a migration framework.
- Every new class gets a `_camelName()` factory in `dic/Container.js`, and dependencies are passed as a named object. Never `new` an adapter inside a use case.
- Each adapter gets a line in `src/test/openMarket/contracts/ports.spec.js` (create it from the skill if missing) and an integration test in `src/itest/` through the real container (NODE_ENV=test uses a temp SQLite file).
- `configuration/` is build tooling (webpack). Don't touch it for feature work.
