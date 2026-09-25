import FixturesService from './FixturesService';
import * as demoCatalog from './demoCatalog';
import * as demoOrders from './demoOrders';

export function createFixturesService({database}) {
  return new FixturesService({
    database,
    demoCatalog,
    demoOrders
  });
}
