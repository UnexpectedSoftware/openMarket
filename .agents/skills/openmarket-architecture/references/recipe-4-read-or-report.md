## Recipe 4: add a read or a report

Decide which case you're in:

| Need | Where |
|---|---|
| **Data for a screen** | `repository.find(new OrdersQuery({from, to, limit, offset}))` or `repository.find(new ProductsQuery({...}))`. `OrdersQuery` and `ProductsQuery` are frozen criteria values, not ports. The find returns a read model (`OrderView` / `ProductView` for a list row, `OrderDetail` for a detail): frozen fields, no write invariants, not the write aggregate. `summary` returns `OrderRangeSummary`. The SQLite repository maps the rows. A use case forwards the find (`ListAllOrders`, `ListAllProducts.list`). Do not add a query port. |
| Existing screens not yet redesigned (list, filter, page) | a finder already on the aggregate's repository (`findCatalog`, `findAllByDates`) |
| Long SQL clause building or row folding for that finder | `infrastructure/<ctx>/Sqlite<Name>QueryService.js`, injected **only** into `Sqlite<Name>Repository` (constructor `queryService`). Not a port, never imported outside infrastructure |
| A different read model (sums per day, most sold) | its **own** port `domain/<ctx>/<Thing>Repository.js` + `Sqlite<Thing>Repository` (precedent: `ProductSaleStatisticsRepository`, kept current by the `RecordProductSales` handler), plus a use case that reads it |

`OrderRepository.calculateTotalAmount*` is old code. A new period total is `summary`, which returns `OrderRangeSummary`. Don't copy the old total methods.

```js
// infrastructure/supplier/SqliteSupplierQueryService.js
export default class SqliteSupplierQueryService {
  /** @param {{text?: string}} filter @returns {{sql: string, params: Array<string>}} */
  nameFilter({text}) {
    const value = text == null ? '' : String(text).trim();
    return value ? {sql: ' WHERE name LIKE ?', params: [`%${value}%`]} : {sql: '', params: []};
  }
}
// container: _sqliteSupplierQueryService() { return new SqliteSupplierQueryService(); }
// and pass queryService: this.getInstance({key: 'sqliteSupplierQueryService'}) to _supplierRepository()
```
