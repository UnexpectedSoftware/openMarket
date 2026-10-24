import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import ProductView from '../../../../../openMarket/domain/product/ProductView';
import ProductsQuery from '../../../../../openMarket/domain/product/ProductsQuery';
import {SALE_TILES_FAILED, SALE_TILES_LOADED, SALE_TILES_REQUESTED} from '../../../../../openMarket/user_interface/order/new_order/action';
import {makeSaleTilesEpic} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';

const epicFile = path.join(__dirname, '../../../../../openMarket/user_interface/order/new_order/epic.js');
const factoryFile = path.join(__dirname, '../../../../../openMarket/user_interface/order/new_order/epicFactory.js');

describe('makeSaleTilesEpic', () => {
  const view = new ProductView({
    barcode: '0001',
    name: 'Milk',
    priceCents: 200,
    basePriceCents: 100,
    vat: {kind: 'S1', percent: 10, cause: null},
    stock: 1,
    stockMin: 4,
    weighted: false,
    imageUrl: null
  });

  it('asks for products for sale and reads the tile fields', done => {
    let criteria;
    const listProducts = {
      list: query => {
        criteria = query;
        return Rx.Observable.of({items: [view], total: 1});
      }
    };
    makeSaleTilesEpic(listProducts)(Rx.Observable.of({
      type: SALE_TILES_REQUESTED,
      payload: {text: 'mi', categoryId: 'dairy', limit: 24}
    })).toArray().subscribe(
      actions => {
        expect(criteria).to.be.instanceof(ProductsQuery);
        expect(criteria.forSale).to.equal(true);
        expect(criteria.text).to.equal('mi');
        expect(criteria.categoryId).to.equal('dairy');
        expect(criteria.limit).to.equal(24);
        expect(actions).to.have.lengthOf(1);
        expect(actions[0].type).to.equal(SALE_TILES_LOADED);
        expect(actions[0].payload).to.deep.equal([{
          barcode: '0001',
          name: 'Milk',
          priceCents: 200,
          vat: {kind: 'S1', percent: 10, cause: null},
          weighted: false,
          lowStock: true,
          imageUrl: null
        }]);
        expect(actions[0].payload[0].marginPercent).to.equal(undefined);
      },
      error => done(error),
      () => done()
    );
  });

  it('builds a for-sale query when the request has no payload', done => {
    let criteria;
    const listProducts = {
      list: query => {
        criteria = query;
        return Rx.Observable.of({items: [], total: 0});
      }
    };
    makeSaleTilesEpic(listProducts)(Rx.Observable.of({type: SALE_TILES_REQUESTED})).toArray().subscribe(
      actions => {
        expect(criteria.forSale).to.equal(true);
        expect(criteria.text).to.equal(null);
        expect(criteria.categoryId).to.equal(null);
        expect(criteria.limit).to.equal(undefined);
        expect(actions[0].payload).to.deep.equal([]);
      },
      error => done(error),
      () => done()
    );
  });

  it('drops a slower search when a newer one arrives', () => {
    const first = new Rx.Subject();
    let calls = 0;
    const seenQueries = [];
    const listProducts = {
      list: query => {
        calls += 1;
        seenQueries.push(query);
        if (calls === 1) {
          return first;
        }
        return Rx.Observable.of({
          items: [{
            barcode: '2',
            name: 'Second',
            priceCents: 1,
            vat: null,
            weighted: false,
            lowStock: false,
            imageUrl: null
          }],
          total: 1
        });
      }
    };
    const actions = new Rx.Subject();
    const seen = [];
    const subscription = makeSaleTilesEpic(listProducts)(actions).subscribe(action => seen.push(action));
    actions.next({type: SALE_TILES_REQUESTED, payload: {text: 'first', limit: 24}});
    actions.next({type: SALE_TILES_REQUESTED, payload: {text: 'second', limit: 24}});
    expect(seen.map(action => action.type)).to.deep.equal([SALE_TILES_LOADED]);
    expect(seen[0].payload[0].name).to.equal('Second');
    expect(seenQueries[0].text).to.equal('first');
    expect(seenQueries[1].forSale).to.equal(true);
    expect(seenQueries[1].text).to.equal('second');
    first.next({items: [{barcode: '1', name: 'First', priceCents: 1, vat: null, weighted: false, lowStock: false, imageUrl: null}], total: 1});
    first.complete();
    expect(seen).to.have.lengthOf(1);
    subscription.unsubscribe();
  });

  it('reports a failure as saleTilesFailed', done => {
    const listProducts = {list: () => Rx.Observable.throw(new Error('db down'))};
    makeSaleTilesEpic(listProducts)(Rx.Observable.of({type: SALE_TILES_REQUESTED, payload: {text: 'mi'}}))
      .toArray()
      .subscribe(
        actions => {
          expect(actions).to.deep.equal([{type: SALE_TILES_FAILED}]);
        },
        error => done(error),
        () => done()
      );
  });

  it('does not mention the removed sale query', () => {
    const epic = fs.readFileSync(epicFile, 'utf8');
    const factory = fs.readFileSync(factoryFile, 'utf8');
    expect(epic).to.not.contain('products_list_for_sale_query');
    expect(factory).to.not.contain('products_list_for_sale_query');
    expect(factory).to.not.contain('listForSale');
  });
});
