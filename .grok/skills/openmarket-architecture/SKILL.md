---
name: openmarket-architecture
description: Step-by-step recipes and code templates for adding code to OpenMarket's DDD/hexagonal architecture. Use whenever you add or change a use case, repository, adapter, domain event, query or report, error, or plugin, or when you review a diff for architecture problems.
when-to-use: new use case, new repository, new table, new adapter, new port, domain event, event handler, query service, report, statistics, plugin, Verifactu, architecture review, "where should this code go"
argument-hint: "[use-case|repository|event|query|error|plugin|review] <short description>"
metadata:
  short-description: OpenMarket architecture recipes
---

# OpenMarket architecture recipes

Root `AGENTS.md` has the rules. This skill has the **how**. Pick one recipe, follow its file checklist in order, then run **Finish** (at the end).
The examples use a made-up `Supplier` context and an `AdjustStock` use case. Rename them to fit your task. Match the surrounding code style (2-space indent, RxJS 5 `Rx.Observable`, named-object constructor params).

---

## Recipe 1: add a use case

Checklist:
1. `src/openMarket/application/service/<ctx>/<VerbNoun>.js`
2. Domain behaviour it needs: add a method on the aggregate (`domain/<ctx>/<Aggregate>.js`). Never put it in the use case or the repository.
3. A typed error if a new failure is possible (Recipe 5)
4. `infrastructure/dic/Container.js`: add a `_<verbNoun>()` factory
5. `application/index.js`: add `this.deps.set('<ctx-plural>_<action>_use_case', container.getInstance({key: '<verbNoun>'}))` if the UI calls it
6. A unit test at `src/test/openMarket/application/service/<ctx>/<VerbNoun>.spec.js`, plus an itest if it writes to SQLite

```js
// src/openMarket/application/service/product/AdjustStock.js
import * as Rx from 'rxjs';
import ProductNotFoundError from '../../../domain/product/ProductNotFoundError';
import observableError from '../../../infrastructure/logging/observableError';
/** @import { Observable } from 'rxjs/Observable' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */
/** @import Product from '../../../domain/product/Product' */

/**
 * Sets a counted stock level after a stocktake.
 */
export default class AdjustStock {

  /** @param {{productRepository: ProductRepository}} deps */
  constructor({productRepository}) {
    this._productRepository = productRepository;
  }

  /**
   * @param {{barcode: string, quantity: number}} command
   * @returns {Observable<Product>}
   */
  adjustStock({barcode, quantity}) {
    return this._productRepository.findByBarcode({barcode})
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'adjustStock'}));
        }
        product.addStock({quantity});          // behaviour lives on the aggregate
        return this._productRepository.save({product}).map(() => product);
      });
  }

}
```

Container and facade:
```js
// infrastructure/dic/Container.js
import AdjustStock from "../../application/service/product/AdjustStock";
  _adjustStock() {
    return new AdjustStock({productRepository: this.getInstance({key: 'productRepository'})});
  }
// application/index.js (constructor)
    this.deps.set('products_adjust_stock_use_case', container.getInstance({key:'adjustStock'}));
```

Unit test (fake the ports with plain objects):
```js
import {expect} from 'chai';
import * as Rx from 'rxjs';
import AdjustStock from '../../../../../openMarket/application/service/product/AdjustStock';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

describe('AdjustStock', () => {
  it('fails with PRODUCT_NOT_FOUND for an unknown barcode', done => {
    const useCase = new AdjustStock({productRepository: {findByBarcode: () => Rx.Observable.empty()}});
    useCase.adjustStock({barcode: '0', quantity: 1}).subscribe(
      () => done(new Error('should fail')),
      error => { expect(error.code).to.equal(ErrorCode.PRODUCT_NOT_FOUND); done(); });
  });
});
```

Multiple writes (for example an order and the stock of every product) must commit together. Inject `transaction` (port `domain/service/Transaction.js`, container key `'transaction'`) and wrap the writes: `this._transaction.run(() => …writes…)`. Look at `application/service/order/CreateOrder.js`.

---

## Recipe 2: add a repository (port, adapter, mapper, table, contract test)

Checklist:
1. Aggregate `domain/<ctx>/<Name>.js` (if it's new)
2. Port `domain/<ctx>/<Name>Repository.js`. Collection methods only.
3. Table in `infrastructure/service/SqliteConnection.js` → `SCHEMA` (`CREATE TABLE IF NOT EXISTS`). For a column on an existing table, use `ensureColumn(...)` in the constructor.
4. Mapper `infrastructure/<ctx>/Sql<Name>Mapper.js`
5. Adapter `infrastructure/<ctx>/Sqlite<Name>Repository.js` with `/** @implements {<Name>Repository} */`
6. Container: `_<name>Mapper()`, `_<name>Repository()`
7. Contract test line in `src/test/openMarket/contracts/ports.spec.js` (create the helper below if it's missing)
8. Integration test `src/itest/<Name>Spec.js`

Allowed repository methods: `save({x})`, `findById({id})`, `findBy<Key>({key})`, `findAll({filter})` / paged finders, `remove({id})`, and `count…` reads. **Not allowed:** `decreaseStock`, `markAsPaid`, `applyDiscount`, `calculateTotal`, `enableIfDisabled`. Those are aggregate methods or use cases.

```js
// src/openMarket/domain/supplier/Supplier.js
export default class Supplier {
  /** @param {{id: string, name: string, nif: string}} props */
  constructor({id, name, nif}) {
    this._id = id;
    this._name = name;
    this._nif = nif;
  }
  get id() { return this._id; }
  get name() { return this._name; }
  get nif() { return this._nif; }
  /** @param {{name: string}} change */
  rename({name}) { this._name = name; return this; }
}
```

```js
// src/openMarket/domain/supplier/SupplierRepository.js
/** @import { Observable } from 'rxjs/Observable' */
/** @import Supplier from './Supplier' */

/**
 * Port: the shop's suppliers, as a collection.
 * @interface
 */
export default class SupplierRepository {
  /**
   * @param {{supplier: Supplier}} params
   * @returns {Observable<Supplier>}
   */
  save({supplier}) {
    throw new Error('SupplierRepository#save must be implemented');
  }

  /**
   * Completes empty when there is no such supplier.
   * @param {{id: string}} params
   * @returns {Observable<Supplier>}
   */
  findById({id}) {
    throw new Error('SupplierRepository#findById must be implemented');
  }

  /** @returns {Observable<Supplier[]>} */
  findAll() {
    throw new Error('SupplierRepository#findAll must be implemented');
  }

  /**
   * @param {{id: string}} params
   * @returns {Observable<null>}
   */
  remove({id}) {
    throw new Error('SupplierRepository#remove must be implemented');
  }
}
```

```js
// infrastructure/service/SqliteConnection.js: append inside SCHEMA
CREATE TABLE IF NOT EXISTS supplier (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nif TEXT
);
```

```js
// src/openMarket/infrastructure/supplier/SqlSupplierMapper.js
import Supplier from '../../domain/supplier/Supplier';

export default class SqlSupplierMapper {
  /**
   * @param {{row: {id: string, name: string, nif: string}}} params
   * @returns {Supplier}
   */
  toDomain({row}) {
    return new Supplier({id: row.id, name: row.name, nif: row.nif});
  }
}
```

```js
// src/openMarket/infrastructure/supplier/SqliteSupplierRepository.js
import * as Rx from 'rxjs';
import {rethrow} from '../logging/ErrorLog';
/** @import { Observable } from 'rxjs/Observable' */
/** @import SupplierRepository from '../../domain/supplier/SupplierRepository' */
/** @import Supplier from '../../domain/supplier/Supplier' */
/** @import SqlSupplierMapper from './SqlSupplierMapper' */

const UPSERT_SUPPLIER_SQL = 'INSERT INTO supplier (id, name, nif) VALUES (?, ?, ?) ' +
  'ON CONFLICT(id) DO UPDATE SET name = excluded.name, nif = excluded.nif';
const FIND_BY_ID_SQL = 'SELECT id, name, nif FROM supplier WHERE id = ?';
const FIND_ALL_SQL = 'SELECT id, name, nif FROM supplier ORDER BY name COLLATE NOCASE ASC';
const DELETE_SQL = 'DELETE FROM supplier WHERE id = ?';

/** @implements {SupplierRepository} */
export default class SqliteSupplierRepository {

  /** @param {{connection: {database: any}, supplierMapper: SqlSupplierMapper}} deps */
  constructor({connection, supplierMapper}) {
    this._database = connection.database;
    this._mapper = supplierMapper;
  }

  /**
   * @param {{supplier: Supplier}} params
   * @returns {Observable<Supplier>}
   */
  save({supplier}) {
    return Rx.Observable.defer(() => {
      try {
        this._database.prepare(UPSERT_SUPPLIER_SQL).run(supplier.id, supplier.name, supplier.nif);
      } catch (error) {
        rethrow(error, {message: 'Could not save the supplier', context: {id: supplier.id, operation: 'save'}});
      }
      return Rx.Observable.of(supplier);
    });
  }

  /**
   * @param {{id: string}} params
   * @returns {Observable<Supplier>}
   */
  findById({id}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(FIND_BY_ID_SQL).get(String(id));
      return row ? Rx.Observable.of(this._mapper.toDomain({row})) : Rx.Observable.empty();
    });
  }

  /** @returns {Observable<Supplier[]>} */
  findAll() {
    return Rx.Observable.defer(() => Rx.Observable.of(
      this._database.prepare(FIND_ALL_SQL).all().map(row => this._mapper.toDomain({row}))));
  }

  /**
   * @param {{id: string}} params
   * @returns {Observable<null>}
   */
  remove({id}) {
    return Rx.Observable.defer(() => {
      this._database.prepare(DELETE_SQL).run(String(id));
      return Rx.Observable.of(null);
    });
  }

}
```

```js
// infrastructure/dic/Container.js
  _supplierMapper() {
    return new SqlSupplierMapper();
  }

  _supplierRepository() {
    return new SqliteSupplierRepository({
      connection: this.getInstance({key: 'sqliteConnection'}),
      supplierMapper: this.getInstance({key: 'supplierMapper'})
    });
  }
```

Contract test helper. Create `src/test/openMarket/contracts/assertImplements.js` once, if it doesn't exist:
```js
import {expect} from 'chai';

/** @param {Function} Port @returns {string[]} */
export function portMethods(Port) {
  return Object.getOwnPropertyNames(Port.prototype)
    .filter(name => name !== 'constructor' && !name.startsWith('_'))
    .filter(name => typeof Port.prototype[name] === 'function');
}

/** @param {Function} Port @param {Function} Adapter */
export function describeContract(Port, Adapter) {
  describe(`${Adapter.name} implements ${Port.name}`, () => {
    portMethods(Port).forEach(method => {
      it(`implements ${method}()`, () => {
        const impl = Adapter.prototype[method];
        expect(impl, `${Adapter.name}#${method} is missing`).to.be.a('function');
        expect(impl, `${Adapter.name}#${method} is the port stub`).not.to.equal(Port.prototype[method]);
        expect(impl.toString(), `${Adapter.name}#${method} is not implemented`)
          .not.to.match(/must be implemented|\bsuper\.\w+\(/);
      });
    });
  });
}
```
Then add the pair to `src/test/openMarket/contracts/ports.spec.js` (create it with a `describe('ports and adapters', …)` if it's missing):
```js
import SupplierRepository from '../../../openMarket/domain/supplier/SupplierRepository';
import SqliteSupplierRepository from '../../../openMarket/infrastructure/supplier/SqliteSupplierRepository';
  describeContract(SupplierRepository, SqliteSupplierRepository);
```

Integration test (`src/itest/SupplierSpec.js`): get the adapter with `container.getInstance({key: 'supplierRepository'})`, then `save` → `findById` → `remove` → `findById` completes empty.

---

## Recipe 3: add a domain event (and a handler)

**The current convention (already in the code):**
- Event class in `domain/event/<PastTense>.js`. It's a plain snapshot of primitives, with a static `type` and no behaviour. Register it in `domain/event/registry.js`.
- Inside the caller's transaction, `domainEventBus.save(event)` inserts the row and queues the event on the bus. After `transaction.run` emits (that is after `COMMIT`), `domainEventBus.raise()` notifies every queued event. On the error path, `discard()` drops the queue. The caller does not keep its own list. Look at `CreateOrder.createOrder`.
- The bus does not take a `Transaction`, and `SqliteTransaction` does not take the bus. `save` joins whatever transaction is already open on the shared connection.
- `ofType` is the hot stream for toasts. It does not replay. `subscribeSync` also runs from `raise`; a throw cannot roll the fact back.
- A durable handler uses `subscribeDurable`. `DomainEventDispatcher` claims the event later and inserts one `PENDING` row per subscriber. A subscriber does not see events stored before its registration time. `RecordProductSales` is durable and idempotent on the order id. Start handlers before `domainEventDispatcher.start()` in `application/index.js`.
- The UI listens through an epic on `OpenMarket.get('domain_event_bus').ofType(Event)`. See `user_interface/order/new_order/epicFactory.js`.
- Delivery rules are in `docs/domain-event-bus.md`.

Checklist: event class and registry → `save` inside the transaction and `raise` after it → (optional) handler + container factory + `.start()` in `application/index.js` before the dispatcher → unit test that the event is raised once and is not raised when the transaction fails (copy `src/test/openMarket/application/service/order/CreateOrder.spec.js`).

```js
// src/openMarket/domain/event/StockAdjusted.js
/**
 * A stocktake set a product's stock to a counted value.
 */
export default class StockAdjusted {
  /** @param {{barcode: string, previous: number, counted: number, at: string}} data */
  constructor({barcode, previous, counted, at}) {
    this.barcode = barcode;
    this.previous = previous;
    this.counted = counted;
    this.at = at;
  }
}
```
```js
// save inside the transaction; raise() drains the bus queue after run emits
return this._transaction.run(() => this._productRepository.save({product}).do(() => {
  this._domainEventBus.save(new StockAdjusted({barcode, previous, counted: quantity, at}));
})).do(
  () => this._domainEventBus.raise(),
  () => this._domainEventBus.discard()
).map(() => product);
```
```js
// src/openMarket/application/service/product/LogStockAdjustments.js (handler)
import StockAdjusted from '../../../domain/event/StockAdjusted';
import {record} from '../../../infrastructure/logging/ErrorLog';
/** @import DomainEventBus from '../../../domain/service/DomainEventBus' */

export default class LogStockAdjustments {
  /** @param {{domainEventBus: DomainEventBus, adjustmentRepository: any}} deps */
  constructor({domainEventBus, adjustmentRepository}) {
    this._bus = domainEventBus;
    this._repository = adjustmentRepository;
    this._started = false;
  }
  start() {
    if (this._started) { return; }
    this._started = true;
    this._bus.ofType(StockAdjusted).subscribe(event => {
      this._repository.save({adjustment: event}).subscribe({error: error => record(error)});
    });
  }
}
```

**PROPOSAL (not in the code yet; use it only if Victor has adopted it):** aggregates *record* their events and the use case *publishes* them after the commit, so the "what happened" decision lives in the domain:
```js
// in the aggregate
this._events = [];                     // in constructor
adjustStock({counted, at}) {
  const previous = this._stock;
  this._stock = counted;
  this._events.push(new StockAdjusted({barcode: this._barcode, previous, counted, at}));
  return this;
}
pullEvents() { const events = this._events; this._events = []; return events; }
// in the use case, after the commit
// save each event inside the transaction; raise() drains the bus queue after run emits
```

---

## Recipe 4: add a query or report

Decide which case you're in:

| Need | Where |
|---|---|
| Aggregates for a screen (list, filter, page) | a finder on the aggregate's repository port (`findCatalog`, `findAllByDates`), returning aggregates or small row DTOs |
| Long SQL clause building or row folding for that finder | `infrastructure/<ctx>/Sqlite<Name>QueryService.js`, injected **only** into `Sqlite<Name>Repository` (constructor `queryService`). Not a port, never imported outside infrastructure |
| A report or statistics read model (sums per day, most sold) | its **own** read port `domain/<ctx>/<Thing>Repository.js` + `Sqlite<Thing>Repository` (precedent: `ProductSaleStatisticsRepository`, kept current by the `RecordProductSales` handler), plus a use case that reads it |

Don't add new report methods to an aggregate repository. (`OrderRepository.calculateTotalAmount*` is old code. Don't copy it.)

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

---

## Recipe 5: add a typed error

1. Add a key to `domain/error/ErrorCode.js` (UPPER_SNAKE, stable. Logs and toasts branch on it.)
2. `domain/<ctx>/<Name>Error.js`:
```js
import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A supplier NIF failed the format check.
 */
export default class InvalidSupplierNifError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.nif]
   */
  constructor({nif} = {}) {
    super({
      code: ErrorCode.SUPPLIER_NIF_INVALID,
      message: `Supplier NIF ${nif} is not valid`,
      userMessage: 'invalid NIF',
      context: defined({nif}),
      level: 'warn'
    });
  }
}
```
3. Raise it: in Rx code `return observableError(new InvalidSupplierNifError({nif}))`. In sync code `raise(new …)`. When wrapping a driver failure in an adapter, use `rethrow(error, {message, context})`. Constructing an error doesn't log it. `record`/`raise`/`observableError` write exactly one JSON line.

---

## Recipe 6: add a plugin (PROPOSAL: forward-looking)

There is no plugin system in the code yet. If one has landed, **follow its real API and ignore this recipe.** Until then, build plugin-shaped features (the first one is Verifactu) like this, so they can move behind a plugin API later:
- Everything lives under `src/openMarket/plugins/<pluginId>/` with the same inner layers: `domain/`, `application/`, `infrastructure/`. The core never imports from `plugins/`.
- The plugin reacts to core **domain events** (`OrderCreated`) through `subscribeDurable`. Enabling it requires a reboot. Its registration time is stored once, so it does not receive events saved before it was enabled. It never patches core use cases or repositories. If it needs data the event doesn't carry (VAT lines, totals, a sequential invoice number), propose adding it to the core event or to a core port first.
- It owns its ports, adapters, tables (prefix `<pluginId>_`, created in its own `ensureSchema(database)` called from its registration), error codes (prefix `<PLUGINID>_`), and its contract and architecture tests.
- A single entry point, `plugins/<pluginId>/index.js`:
```js
/**
 * @param {{container: any, domainEventBus: import('../../domain/service/DomainEventBus').default}} host
 * @returns {{id: string, start: () => void}}
 */
export default function register({container, domainEventBus}) {
  // build the plugin's own adapters and handlers here, from host services only
  return {id: 'verifactu', start() { /* handler.start() */ }};
}
```
- Receipt and UI integration (QR code, invoice status) go through extension points that the core exposes. Ask Victor before adding any.

---

## Review checklist (use for "review this diff")

- [ ] No new `*Store`/`*Dao`/`*Manager`/`*Helper`, and every persistence class is `<Name>Repository`
- [ ] Repository methods are collection-like. No business decision inside SQL or adapter code.
- [ ] Behaviour is on aggregates. Use cases load → call → save. No `obj._field =` from outside.
- [ ] Use cases depend on ports via the constructor, with multiple writes in `transaction.run`
- [ ] Events are saved inside the caller's transaction. `raise()` after commit drains the bus queue, and `discard()` runs when the transaction fails. The bus and `SqliteTransaction` do not reference each other
- [ ] Typed `AppError` with an `ErrorCode`, and no `new Error('…')` for shop failures
- [ ] Container factory added. Facade key added if the UI needs it.
- [ ] JSDoc: destructured params, `@import`, `@implements` on adapters, no `.ts` files
- [ ] Tests: unit (ports faked), contract line for new adapters, itest for SQL

## Finish (every recipe)

```bash
npm test                     # unit tests + architecture test + contract tests
npm run test:integration
npm run typecheck            # if the script exists
npm run build                # if UI or wiring changed, then: xvfb-run -a npm run test:ui
```
If `src/test/openMarket/architecture/architecture.spec.js` fails, fix the code. Don't edit the test's allow-lists.
