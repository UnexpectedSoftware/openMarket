# domain/: extra rules

- Pure JavaScript. Import only other `domain/` files plus `moment`/`rxjs` where already used. **No** `fs`, `path`, `node:sqlite`, `electron`, React, or anything from `infrastructure/`, `application/` or `user_interface/`.
- Aggregates own their rules: validate in the constructor (throw a typed error), change state only through intention-revealing methods (`addStock`, `subtractStock`, `enable`, `disable`, `isStockLow`). Expose read-only getters.
- Ports are `/** @interface */` classes. Every method throws `'<Port>#<method> must be implemented'` and has JSDoc for its destructured param and its `Observable<…>` result. A port speaks domain language (`findByBarcode`, `save`), never SQL or table names.
- Repository ports are collection-like: `save`, `findById`/`findBy<Key>`, `findAll(filter)`, `remove`, counts. A find that feeds a screen takes a criteria value (`OrdersQuery`, `ProductsQuery`) and returns a read model of that aggregate (`OrderView` or `ProductView` for a list row, `OrderDetail` for a detail), not the write aggregate. A different read model, such as sale statistics, keeps its own port (`product/ProductSaleStatisticsRepository.js`).
- Events (`event/`) are past-tense, immutable data snapshots (copy arrays, primitives only). No behaviour, no references to aggregates.
- Errors extend `error/AppError.js`, add a key to `error/ErrorCode.js`, and pass `context: defined({...})` and `level` (`'warn'` for expected shop situations).
