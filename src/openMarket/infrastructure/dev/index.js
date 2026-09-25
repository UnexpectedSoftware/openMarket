import FixturesService from './FixturesService';
import * as demoCatalog from './demoCatalog';
import * as demoOrders from './demoOrders';

export function createFixturesService({database, store}) {
  return new FixturesService({
    database: store === 'Sqlite' ? database : null,
    demoCatalog,
    demoOrders
  });
}
