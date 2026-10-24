import {expect} from 'chai';
import {
  isCreateRoute,
  lowStockQuery,
  routeChanged,
  routePlan
} from '../../../../../openMarket/user_interface/product/list_products/route';

const list = {pathname: '/list_products', query: {}};
const low = {pathname: '/list_products', query: {lowStock: '1'}};
const create = {pathname: '/create_product', query: {}};

describe('product list route', () => {
  it('reads the low-stock query and the create path', () => {
    expect(lowStockQuery(null)).to.equal(false);
    expect(lowStockQuery({query: {}})).to.equal(false);
    expect(lowStockQuery(low)).to.equal(true);
    expect(lowStockQuery({query: {lowStock: 1}})).to.equal(true);
    expect(isCreateRoute(null)).to.equal(false);
    expect(isCreateRoute(list)).to.equal(false);
    expect(isCreateRoute(create)).to.equal(true);
  });

  it('notices a path change and a low-stock change', () => {
    const current = {location: list};
    expect(routeChanged(current, {location: create})).to.equal(true);
    expect(routeChanged(current, {location: low})).to.equal(true);
    expect(routeChanged(current, {location: list})).to.equal(false);
    expect(routeChanged({location: null}, {location: null})).to.equal(false);
    expect(routeChanged(current, {})).to.equal(false);
  });

  it('loads the catalog on arrival and opens or closes the create drawer', () => {
    expect(routePlan({location: list}, null)).to.deep.equal({
      loadCatalog: true,
      lowStock: false,
      openCreate: false,
      closeCreate: false
    });
    expect(routePlan({location: low}, null).lowStock).to.equal(true);
    expect(routePlan({location: create}, null).openCreate).to.equal(true);
    expect(routePlan(null, null).loadCatalog).to.equal(true);

    const staying = routePlan({location: list, products: {}}, {location: list});
    expect(staying.loadCatalog).to.equal(false);
    expect(staying.openCreate).to.equal(false);
    expect(staying.closeCreate).to.equal(false);

    const entered = routePlan({location: create}, {location: list});
    expect(entered.openCreate).to.equal(true);
    expect(entered.loadCatalog).to.equal(false);

    const leftOpen = routePlan(
      {location: list, products: {drawerOpen: true, mode: 'create'}},
      {location: create}
    );
    expect(leftOpen.closeCreate).to.equal(true);
    expect(leftOpen.openCreate).to.equal(false);

    const leftClosed = routePlan(
      {location: list, products: {drawerOpen: false, mode: 'create'}},
      {location: create}
    );
    expect(leftClosed.closeCreate).to.equal(false);

    const leftEdit = routePlan(
      {location: list, products: {drawerOpen: true, mode: 'edit'}},
      {location: create}
    );
    expect(leftEdit.closeCreate).to.equal(false);

    const stockChanged = routePlan({location: low, products: {}}, {location: list});
    expect(stockChanged.loadCatalog).to.equal(true);
    expect(stockChanged.lowStock).to.equal(true);
  });
});