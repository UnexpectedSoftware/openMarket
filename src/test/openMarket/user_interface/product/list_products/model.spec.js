import {expect} from 'chai';
import {
  categoriesLoaded,
  filtersActive,
  filtersChanged,
  pageChanged,
  pageOpened,
  productDisabled,
  productsFailed,
  productsLoaded,
  queryChanged,
  showingLabel,
  state
} from '../../../../../openMarket/user_interface/product/list_products/model';

const page = {offset: 0, limit: 20, total: 0};

describe('products list model', () => {
  it('labels the current page, the last page, and an empty catalog', () => {
    expect(showingLabel({offset: 20, limit: 20, total: 50})).to.equal('Mostrando 21–40 de 50');
    expect(showingLabel({offset: 40, limit: 20, total: 50})).to.equal('Mostrando 41–50 de 50');
    expect(showingLabel({offset: 0, limit: 20, total: 5})).to.equal('Mostrando 1–5 de 5');
    expect(showingLabel(page)).to.equal('Mostrando 0–0 de 0');
  });

  it('treats text, chips, weight, stock, and category as active filters', () => {
    expect(filtersActive(state())).to.equal(false);
    expect(filtersActive({query: '  '})).to.equal(false);
    expect(filtersActive({query: 'leche'})).to.equal(true);
    expect(filtersActive({lowStock: true})).to.equal(true);
    expect(filtersActive({status: 'ENABLED'})).to.equal(true);
    expect(filtersActive({categoryId: 'dairy'})).to.equal(true);
    expect(filtersActive({weighted: true})).to.equal(true);
  });

  it('opens a page, changes the query, and moves the offset', () => {
    const opened = pageOpened(state(), {lowStock: true, query: 'pan'});
    expect(opened.loading).to.equal(true);
    expect(opened.lowStock).to.equal(true);
    expect(opened.items).to.deep.equal([]);
    const typed = queryChanged({...opened, offset: 20, items: [{barcode: '1'}]}, 'le');
    expect(typed.query).to.equal('le');
    expect(typed.offset).to.equal(0);
    const filtered = filtersChanged(typed, {
      lowStock: false,
      status: 'DISABLED',
      categoryId: 'bakery',
      weighted: true,
      sort: 'stock_desc'
    });
    expect(filtered.status).to.equal('DISABLED');
    expect(filtered.weighted).to.equal(true);
    expect(filtered.sort).to.equal('stock_desc');
    expect(pageChanged(filtered, {offset: 40}).offset).to.equal(40);
  });

  it('stores a matching page and ignores a stale one', () => {
    const current = {...state(), query: 'leche', offset: 0};
    const stale = productsLoaded(current, {
      query: 'le',
      items: [{barcode: '1'}],
      total: 1
    });
    expect(stale).to.equal(current);
    const loaded = productsLoaded(current, {
      query: 'leche',
      lowStock: false,
      status: null,
      categoryId: null,
      weighted: null,
      sort: 'name_asc',
      offset: 0,
      items: [{barcode: '1', name: 'Leche'}],
      total: 4
    });
    expect(loaded.items).to.deep.equal([{barcode: '1', name: 'Leche'}]);
    expect(loaded.total).to.equal(4);
    expect(loaded.loading).to.equal(false);
    expect(loaded.error).to.equal('');
  });

  it('keeps the error for the page that failed and disables one row', () => {
    const current = {...state(), status: 'ENABLED'};
    expect(productsFailed(current, {query: 'no', message: 'db'}).error).to.equal('');
    const failed = productsFailed(current, {
      query: '',
      status: 'ENABLED',
      message: 'db'
    });
    expect(failed.loading).to.equal(false);
    expect(failed.error).to.equal('db');
    const disabled = productDisabled({
      ...state(),
      items: [{barcode: '1', status: 'ENABLED'}, {barcode: '2', status: 'ENABLED'}]
    }, '1');
    expect(disabled.items.map(item => item.status)).to.deep.equal(['DISABLED', 'ENABLED']);
    expect(categoriesLoaded(state(), [{id: 'a', name: 'Fruta'}]).categories).to.have.length(1);
  });
});
