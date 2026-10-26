import {expect} from 'chai';
import newOrderReducer from '../../../../../openMarket/user_interface/order/new_order/reducer';
import {
  NEW_ORDER_CLOSED,
  NEW_ORDER_FREE_LINE_ADDED,
  NEW_ORDER_NOTE_LOW_STOCK,
  NEW_ORDER_PRODUCT_DELETED,
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_PRODUCT_QUANTITY_CHANGE,
  NEW_ORDER_SAVE,
  NEW_ORDER_SAVED,
  PAYMENT_FAILED,
  PAYMENT_PREVIEW_LOADED,
  REPRINT_PREVIEW_LOADED,
  SALE_CATEGORIES_LOADED,
  SALE_CATEGORY_SELECTED,
  SALE_TILES_FAILED,
  SALE_TILES_LOADED,
  SALE_TILES_REQUESTED
} from '../../../../../openMarket/user_interface/order/new_order/action';
import {LOCATION_CHANGE} from 'react-router-redux';

function view(current) {
  return {
    totalCents: current.order.total.cents,
    createdAt: current.order.createdAt || null,
    lines: current.order.lines.map(line => ({
      barcode: line.barcode,
      name: line.name,
      cents: line.unitPrice.cents,
      milli: line.quantity.milli,
      amountCents: line.quantity.milli <= 0 ? 0 : line.unitPrice.times(line.quantity).cents
    }))
  };
}

describe('reducers', () => {
  describe('newOrder', () => {
    it('keeps the category chip across a sale', () => {
      const picked = newOrderReducer(undefined, {type: SALE_CATEGORY_SELECTED, categoryId: 'dairy'});
      const named = newOrderReducer(picked, {
        type: SALE_CATEGORIES_LOADED,
        payload: [{id: 'dairy', name: 'Lácteos'}]
      });
      expect(named.categoryId).to.equal('dairy');
      expect(named.categories).to.deep.equal([{id: 'dairy', name: 'Lácteos'}]);
      const selling = newOrderReducer(named, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '1', name: 'Milk', price: 1}, quantity: 1}
      });
      expect(selling.categoryId).to.equal('dairy');
      expect(selling.categories).to.deep.equal([{id: 'dairy', name: 'Lácteos'}]);
      const saved = newOrderReducer(selling, {type: NEW_ORDER_SAVED, payload: {id: 'sale'}});
      expect(saved.order.lines).to.deep.equal([]);
      expect(saved.categoryId).to.equal('dairy');
      expect(saved.categories).to.deep.equal([{id: 'dairy', name: 'Lácteos'}]);
      const cleared = newOrderReducer(saved, {type: SALE_CATEGORY_SELECTED, categoryId: null});
      expect(cleared.categoryId).to.equal(null);
    });

    it('should handle initial state', () => {
      expect(view(newOrderReducer(undefined, {}))).to.deep.equal({
        totalCents: 0,
        createdAt: null,
        lines: []
      });
    });

    it('should handle NEW_ORDER_PRODUCT_FETCHED with initial state', () => {
      const state = newOrderReducer(undefined, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0001', name: 'Ninja', price: 9.99}, quantity: 1}
      });
      expect(view(state)).to.deep.equal({
        totalCents: 999,
        createdAt: null,
        lines: [{barcode: '0001', name: 'Ninja', cents: 999, milli: 1000, amountCents: 999}]
      });
      expect(state.order.lines[0].vatRate.code()).to.equal('S1:21');
    });

    it('should handle NEW_ORDER_PRODUCT_FETCHED with a repeated product', () => {
      const initial = newOrderReducer(undefined, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0001', name: 'Ninja', price: 9.99}, quantity: 1}
      });
      const state = newOrderReducer(initial, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0001', name: 'Ninja', price: 9.99}, quantity: 1}
      });
      expect(view(state).lines).to.deep.equal([
        {barcode: '0001', name: 'Ninja', cents: 999, milli: 2000, amountCents: 1998}
      ]);
      expect(view(state).totalCents).to.equal(1998);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with previous data', () => {
      const state = change(euroLines([{barcode: '0001', name: 'Ninja', price: 9.99, quantity: 1}]), '0001', 5);
      expect(view(state).lines[0].milli).to.equal(5000);
      expect(view(state).lines[0].amountCents).to.equal(4995);
      expect(view(state).totalCents).to.equal(4995);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity as not a number', () => {
      const state = change(euroLines([{barcode: '0001', name: 'Ninja', price: 9.99, quantity: 1}]), '0001', 'aaaa');
      expect(view(state).lines[0].milli).to.equal(1000);
      expect(view(state).totalCents).to.equal(999);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity as blank', () => {
      const state = change(euroLines([{barcode: '0001', name: 'Ninja', price: 9.99, quantity: 1}]), '0001', '');
      expect(view(state).lines[0].milli).to.equal(1000);
      expect(view(state).totalCents).to.equal(999);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity 6 and get a total with 2 decimals', () => {
      const state = change(euroLines([
        {barcode: '0001', name: 'Ninja', price: 0.55, quantity: 1},
        {barcode: '0002', name: 'Ninja2', price: 0.6, quantity: 1},
        {barcode: '0003', name: 'Ninja3', price: 0.6, quantity: 2},
        {barcode: '0004', name: 'Ninja4', price: 0.6, quantity: 1}
      ]), '0001', 6);
      expect(view(state).lines.map(line => line.amountCents)).to.deep.equal([330, 60, 120, 60]);
      expect(view(state).totalCents).to.equal(570);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity 0.6 and get a total with 2 decimals', () => {
      const state = change(euroLines([
        {barcode: '0001', name: 'Ninja', price: 0.55, quantity: 1},
        {barcode: '0002', name: 'Ninja2', price: 0.6, quantity: 1},
        {barcode: '0003', name: 'Ninja3', price: 0.6, quantity: 2},
        {barcode: '0004', name: 'Ninja4', price: 0.6, quantity: 1}
      ]), '0001', 0.6);
      expect(view(state).lines[0].amountCents).to.equal(33);
      expect(view(state).lines[0].milli).to.equal(600);
      expect(view(state).totalCents).to.equal(273);
    });

    it('stores quantity 0 so the row can be flagged', () => {
      const state = change(euroLines([{barcode: '0001', name: 'Ninja', price: 2, quantity: 1}]), '0001', 0);
      expect(view(state).lines[0].milli).to.equal(0);
      expect(view(state).lines[0].amountCents).to.equal(0);
      expect(view(state).totalCents).to.equal(0);
    });

    it('keeps the cart and the sale tiles when a POP follows the route push', () => {
      const selling = newOrderReducer(undefined, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0002', name: 'Ninja2', price: 0.6}, quantity: 1}
      });
      const tiles = [
        {barcode: '1001', name: 'Milk'},
        {barcode: '1002', name: 'Bread'}
      ];
      const loaded = newOrderReducer(selling, {type: SALE_TILES_LOADED, payload: tiles});
      expect(loaded.tilesStatus).to.equal('ready');
      expect(view(loaded).lines).to.have.length(1);

      const state = newOrderReducer(loaded, {
        type: LOCATION_CHANGE,
        payload: {action: 'POP', pathname: '/create_order'}
      });

      expect(state.tiles).to.deep.equal(tiles);
      expect(state.tilesStatus).to.equal('ready');
      expect(view(state).lines).to.deep.equal(view(loaded).lines);
      expect(view(state).totalCents).to.equal(view(loaded).totalCents);
    });

    it('keeps the grid when a sale is saved and ignores a repeated low-stock note', () => {
      const selling = newOrderReducer(undefined, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0001', name: 'Ninja', price: 1}, quantity: 1}
      });
      const withTiles = newOrderReducer(selling, {type: SALE_TILES_LOADED, payload: [{barcode: '1'}]});
      const noted = newOrderReducer(withTiles, {type: NEW_ORDER_NOTE_LOW_STOCK, payload: {barcode: '0001'}});
      expect(noted.lowStockBarcodes).to.deep.equal(['0001']);
      expect(newOrderReducer(noted, {type: NEW_ORDER_NOTE_LOW_STOCK, payload: {barcode: '0001'}})).to.equal(noted);
      expect(newOrderReducer(noted, {type: NEW_ORDER_NOTE_LOW_STOCK, payload: {}})).to.equal(noted);

      const saving = newOrderReducer(noted, {type: NEW_ORDER_SAVE});
      expect(saving.saving).to.equal(true);
      const failed = newOrderReducer(saving, {type: PAYMENT_FAILED});
      expect(failed.saving).to.equal(false);
      const preview = newOrderReducer(failed, {type: PAYMENT_PREVIEW_LOADED, payload: '<p>1</p>'});
      expect(preview.previewHtml).to.equal('<p>1</p>');
      const reprint = newOrderReducer(preview, {type: REPRINT_PREVIEW_LOADED, payload: '<p>2</p>'});
      expect(reprint.reprintHtml).to.equal('<p>2</p>');
      expect(newOrderReducer(reprint, {type: PAYMENT_PREVIEW_LOADED}).previewHtml).to.equal('');
      expect(newOrderReducer(reprint, {type: REPRINT_PREVIEW_LOADED}).reprintHtml).to.equal('');

      const free = newOrderReducer(reprint, {
        type: NEW_ORDER_FREE_LINE_ADDED,
        payload: {description: 'Bolsa', amount: 0.5}
      });
      expect(free.order.lines).to.have.length(2);
      expect(free.tiles).to.deep.equal([{barcode: '1'}]);
      expect(free.saving).to.equal(false);
      expect(free.previewHtml).to.equal('<p>1</p>');
      expect(free.reprintHtml).to.equal('<p>2</p>');

      const saved = newOrderReducer(free, {type: NEW_ORDER_SAVED, payload: {id: 'sale'}});
      expect(saved.order.lines).to.deep.equal([]);
      expect(saved.lastOrder).to.deep.equal({id: 'sale'});
      expect(saved.tiles).to.deep.equal([{barcode: '1'}]);
      expect(saved.tilesStatus).to.equal('ready');
      expect(saved.lowStockBarcodes).to.deep.equal(['0001']);
      expect(saved.saving).to.equal(false);

      const bare = newOrderReducer({order: {lines: []}}, {type: NEW_ORDER_SAVED});
      expect(bare.lastOrder).to.equal(null);
      expect(bare.tiles).to.deep.equal([]);
      expect(bare.tilesStatus).to.equal('idle');

      const errored = newOrderReducer(saved, {type: SALE_TILES_FAILED});
      expect(errored.tilesStatus).to.equal('error');
      const loading = newOrderReducer(errored, {type: SALE_TILES_REQUESTED});
      expect(loading.tilesStatus).to.equal('loading');
      const closed = newOrderReducer(loading, {type: NEW_ORDER_CLOSED});
      expect(closed.tiles).to.deep.equal([]);
      expect(closed.order.lines).to.deep.equal([]);
    });

    it('stamps Quedan stock onto the tile and replaces it when the same product is sold again', () => {
      const selling = newOrderReducer(undefined, {
        type: NEW_ORDER_PRODUCT_FETCHED,
        payload: {product: {barcode: '0001', name: 'Milk', price: 2, stock: 5, stockMin: 4}, quantity: 1}
      });
      const tiles = [{barcode: '0001', name: 'Milk', stock: 5, lowStock: false, weighted: false}];
      const loaded = newOrderReducer(selling, {type: SALE_TILES_LOADED, payload: tiles});
      const noted = newOrderReducer(loaded, {
        type: NEW_ORDER_NOTE_LOW_STOCK,
        payload: {barcode: '0001', stock: 3, weighted: false}
      });
      expect(noted.tiles[0]).to.deep.equal({
        barcode: '0001', name: 'Milk', stock: 3, lowStock: true, weighted: false
      });
      expect(noted.order.lines[0].stock).to.equal(3);
      expect(noted.order.lines[0].lowStock).to.equal(true);
      expect(newOrderReducer(noted, {
        type: NEW_ORDER_NOTE_LOW_STOCK,
        payload: {barcode: '0001', stock: 3, weighted: false}
      })).to.equal(noted);

      const lower = newOrderReducer(noted, {
        type: NEW_ORDER_NOTE_LOW_STOCK,
        payload: {barcode: '0001', stock: 1, weighted: false}
      });
      expect(lower.tiles[0].stock).to.equal(1);
      expect(lower.lowStockBarcodes).to.deep.equal(['0001']);
      const saved = newOrderReducer(lower, {type: NEW_ORDER_SAVED, payload: {id: 'sale'}});
      expect(saved.tiles[0].stock).to.equal(1);
      expect(saved.tiles[0].lowStock).to.equal(true);
      expect(saved.order.lines).to.deep.equal([]);
    });

    it('should handle NEW_ORDER_PRODUCT_DELETED with an order with some products on it', () => {
      const state = newOrderReducer(euroLines([
        {barcode: '0001', name: 'Ninja', price: 0.55, quantity: 1},
        {barcode: '0002', name: 'Ninja2', price: 0.6, quantity: 1}
      ]), {type: NEW_ORDER_PRODUCT_DELETED, barcode: '0001'});
      expect(view(state).lines).to.deep.equal([
        {barcode: '0002', name: 'Ninja2', cents: 60, milli: 1000, amountCents: 60}
      ]);
      expect(view(state).totalCents).to.equal(60);
    });
  });

});

function euroLines(lines) {
  return {
    order: {lines, total: 0}
  };
}

function change(initial, barcode, quantityChanged) {
  return newOrderReducer(initial, {
    type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE,
    payload: {barcode, quantityChanged}
  });
}
