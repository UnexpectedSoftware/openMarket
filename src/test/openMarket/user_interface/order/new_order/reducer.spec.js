import {expect} from 'chai';
import newOrderReducer from '../../../../../openMarket/user_interface/order/new_order/reducer';
import {
  NEW_ORDER_PRODUCT_DELETED,
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_PRODUCT_QUANTITY_CHANGE
} from '../../../../../openMarket/user_interface/order/new_order/action';
import OrderFactoryImpl from '../../../../../openMarket/infrastructure/order/OrderFactoryImpl';
import RandomUUIDIdentity from '../../../../../openMarket/domain/RandomUUIDIdentity';
import {LIST_ORDER_DETAIL_LOADED} from '../../../../../openMarket/user_interface/order/list_orders/action';

const orderFactory = new OrderFactoryImpl({identity: new RandomUUIDIdentity()});

function view(current) {
  return {
    readonly: current.readonly,
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
    it('should handle initial state', () => {
      expect(view(newOrderReducer(undefined, {}))).to.deep.equal({
        readonly: false,
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
        readonly: false,
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

  describe('view Order', () => {
    it('should handle LIST_ORDER_DETAIL_LOADED to load previous order', () => {
      const givenOrder = orderFactory.createWith({
        lines: [{barcode: '0002', name: 'Ninja2', price: 0.6, quantity: 1}]
      });
      const state = newOrderReducer(undefined, {type: LIST_ORDER_DETAIL_LOADED, payload: givenOrder});
      expect(state.readonly).to.equal(true);
      expect(view(state).lines).to.deep.equal([
        {barcode: '0002', name: 'Ninja2', cents: 60, milli: 1000, amountCents: 60}
      ]);
      expect(view(state).totalCents).to.equal(60);
      expect(state.order.createdAt).to.equal(givenOrder.createdAt);
    });
  });
});

function euroLines(lines) {
  return {
    order: {lines, total: 0},
    readonly: false
  };
}

function change(initial, barcode, quantityChanged) {
  return newOrderReducer(initial, {
    type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE,
    payload: {barcode, quantityChanged}
  });
}
