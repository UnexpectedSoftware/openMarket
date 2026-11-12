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
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Supplier').default} Supplier */

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
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../domain/supplier/SupplierRepository').default} SupplierRepository */
/** @typedef {import('../../domain/supplier/Supplier').default} Supplier */
/** @typedef {import('./SqlSupplierMapper').default} SqlSupplierMapper */

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
