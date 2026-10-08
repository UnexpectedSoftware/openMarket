import {expect} from 'chai';
import * as Rx from 'rxjs';
import PrintProductCatalog from '../../../../../openMarket/application/service/product/PrintProductCatalog';

function of(value) {
  return Rx.Observable.of(value);
}

describe('PrintProductCatalog', () => {
  it('reports percent as each page is accepted and cuts only the last page', async () => {
    const lookups = [];
    const batches = [];
    const pages = [
      {
        products: [
          {barcode: '1', name: 'Milk', stock: 4, status: 'ENABLED'},
          {barcode: '2', name: 'Bread', stock: 1, status: 'ENABLED'}
        ],
        hasMore: true
      },
      {
        products: [{barcode: '3', name: 'Soap', stock: 8, status: 'DISABLED'}],
        hasMore: false
      }
    ];
    const useCase = new PrintProductCatalog({
      productRepository: {
        countCatalog: () => of(3),
        findCatalog(filters) {
          lookups.push(filters);
          return of(pages.shift());
        }
      },
      catalogPrinter: {
        printBatch(batch) {
          batches.push({
            header: batch.header,
            cut: batch.cut,
            names: batch.products.map(product => product.name)
          });
          return of(true);
        }
      }
    });

    const values = await useCase.execute({
      query: 'mi',
      lowStock: true,
      status: 'ENABLED',
      categoryId: '2',
      sort: 'stock_desc',
      categoryName: 'Dairy',
      printedAt: 'today'
    }).toArray().toPromise();

    expect(values.map(value => value.percent)).to.deep.equal([0, 67, 100, undefined]);
    expect(values[3]).to.deep.equal({printed: 3});
    expect(lookups.map(filters => filters.after)).to.deep.equal([
      null,
      {name: 'Bread', stock: 1, barcode: '2'}
    ]);
    expect(lookups[0]).to.include({
      query: 'mi',
      lowStock: true,
      status: 'ENABLED',
      categoryId: '2',
      sort: 'stock_desc',
      limit: 20
    });
    expect(batches).to.deep.equal([
      {header: true, cut: false, names: ['Milk', 'Bread']},
      {header: false, cut: true, names: ['Soap']}
    ]);
  });

  it('emits no progress when nothing matches', async () => {
    let printed = false;
    const useCase = new PrintProductCatalog({
      productRepository: {
        countCatalog: () => of(0),
        findCatalog: () => { throw new Error('should not page'); }
      },
      catalogPrinter: {
        printBatch: () => { printed = true; return of(true); }
      }
    });
    const values = await useCase.execute({query: '', lowStock: false, status: null}).toArray().toPromise();
    expect(values).to.deep.equal([{printed: 0}]);
    expect(printed).to.equal(false);
  });

  it('keeps how many pages were sent when a later page fails', async () => {
    const pages = [
      {products: [{barcode: '1', name: 'Milk', stock: 1, status: 'ENABLED'}], hasMore: true},
      {products: [{barcode: '2', name: 'Bread', stock: 1, status: 'ENABLED'}], hasMore: false}
    ];
    let calls = 0;
    const useCase = new PrintProductCatalog({
      productRepository: {
        countCatalog: () => of(2),
        findCatalog: () => of(pages.shift())
      },
      catalogPrinter: {
        printBatch: () => {
          calls += 1;
          if (calls === 2) {
            return Rx.Observable.throw(new Error('Printer is busy'));
          }
          return of(true);
        }
      }
    });
    try {
      await useCase.execute({query: ''}).toArray().toPromise();
      throw new Error('should have failed');
    } catch (error) {
      expect(error.message).to.equal('Printer is busy');
      expect(error.printed).to.equal(1);
      expect(error.total).to.equal(2);
    }
  });
});
