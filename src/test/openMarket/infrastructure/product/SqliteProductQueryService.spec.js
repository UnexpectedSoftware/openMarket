import {expect} from 'chai';
import ProductStatus from '../../../../openMarket/domain/product/ProductStatus';
import SqliteProductQueryService from '../../../../openMarket/infrastructure/product/SqliteProductQueryService';

const statement = 'SELECT p.barcode FROM product p WHERE 1 = 1';
const countStatement = 'SELECT count(*) AS total FROM product p WHERE 1 = 1';

describe('SqliteProductQueryService product page', () => {
  const service = new SqliteProductQueryService();

  function page(query) {
    return service.productPage({
      statement,
      countStatement,
      orderBySql: ' ORDER BY ',
      filterSql: ' /*filter*/',
      query
    });
  }

  it('caps a sale page at 80 and defaults to 24', () => {
    expect(page({forSale: true, sort: 'name_asc', offset: 0}).params.slice(-2)).to.deep.equal([24, 0]);
    expect(page({forSale: true, limit: 10, offset: 3}).params.slice(-2)).to.deep.equal([10, 3]);
    expect(page({forSale: true, limit: 1, offset: 0}).params.slice(-2)).to.deep.equal([1, 0]);
    expect(page({forSale: true, limit: 80, offset: 0}).params.slice(-2)).to.deep.equal([80, 0]);
    expect(page({forSale: true, limit: 81, offset: 0}).params.slice(-2)).to.deep.equal([80, 0]);
    expect(page({forSale: true, limit: 0, offset: 0}).params.slice(-2)).to.deep.equal([24, 0]);
    expect(page({forSale: true, limit: 1.5, offset: 0}).params.slice(-2)).to.deep.equal([24, 0]);
  });

  it('does not cap a management page', () => {
    expect(page({limit: 500, offset: 20}).params.slice(-2)).to.deep.equal([500, 20]);
    expect(page({limit: 1, offset: 0}).params.slice(-2)).to.deep.equal([1, 0]);
    expect(page({}).params.slice(-2)).to.deep.equal([-1, 0]);
    expect(page({limit: 0}).params.slice(-2)).to.deep.equal([-1, 0]);
  });

  it('forces enabled products for sale and keeps a management status', () => {
    const sale = page({forSale: true, status: ProductStatus.DISABLED, text: '  mi  ', categoryId: 'dairy', weighted: false, lowStock: true});
    expect(sale.params.slice(0, 10)).to.deep.equal([
      ProductStatus.ENABLED, ProductStatus.ENABLED,
      'dairy', 'dairy',
      0, 0,
      1,
      '%mi%', '%mi%', '%mi%'
    ]);
    const both = page({status: 'NOPE', weighted: null, lowStock: false, text: ''});
    expect(both.params.slice(0, 10)).to.deep.equal([
      null, null,
      null, null,
      null, null,
      0,
      null, null, null
    ]);
    const disabled = page({status: ProductStatus.DISABLED, weighted: true, categoryId: 0});
    expect(disabled.params[0]).to.equal(ProductStatus.DISABLED);
    expect(disabled.params[2]).to.equal(null);
    expect(disabled.params[4]).to.equal(1);
  });

  it('escapes a like pattern and orders with the catalog sorts', () => {
    const escaped = page({text: '100%_j\\uice'});
    expect(escaped.params[7]).to.equal('%100\\%\\_j\\\\uice%');
    expect(page({sort: 'name_asc'}).sql).to.contain('COLLATE NOCASE ASC');
    expect(page({sort: 'name_desc'}).sql).to.contain('COLLATE NOCASE DESC');
    expect(page({sort: 'stock_asc'}).sql).to.contain('p.stock ASC');
    expect(page({sort: 'stock_desc'}).sql).to.contain('p.stock DESC');
    expect(page({sort: 'nope'}).sql).to.contain('COLLATE NOCASE ASC');
    expect(page({sort: 'name_asc'}).sql).to.contain('/*filter*/');
    expect(page({sort: 'name_asc'}).countSql).to.equal(countStatement + ' /*filter*/');
    expect(page().sql.startsWith(statement)).to.equal(true);
  });

  it('treats a missing query as an uncapped list', () => {
    const listed = page(undefined);
    expect(listed.params.slice(-2)).to.deep.equal([-1, 0]);
    expect(listed.sql).to.contain('COLLATE NOCASE ASC');
  });
});
