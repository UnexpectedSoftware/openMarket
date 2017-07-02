import { expect } from 'chai';
import newOrderReducer from '../../../../openMarket/user_interface/order/new_order/reducer';
import { NEW_ORDER_PRODUCT_FETCH, NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_QUANTITY_CHANGE } from '../../../../openMarket/user_interface/order/new_order/action';

describe('reducers', () => {
  describe('newOrder', () => {
    it('should handle initial state', () => {
      const expectedInitialState = {
        order: {
          lines: [],
          total: 0.0
        }
      };
      expect(newOrderReducer(undefined, {})).to.deep.equal(expectedInitialState);
    });

    it('should handle NEW_ORDER_PRODUCT_FETCHED with initial state', () => {
      const givenProduct = {
        barcode: '0001',
        name: 'Ninja',
        quantity: 1,
        price: 9.99
      };

      const expectedState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 1
          }],
        total: 9.99
        }
      };
      expect(newOrderReducer(undefined, { type: NEW_ORDER_PRODUCT_FETCHED, payload: givenProduct }))
        .to.deep.equal(expectedState);
    });


    it('should handle NEW_ORDER_PRODUCT_FETCHED with a repeated product', () => {
      const givenProduct = {
        barcode: '0001',
        name: 'Ninja',
        quantity: 1,
        price: 9.99
      };

      const giveInitialState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 1
          }],
          total: 0.0
        }
      };

      const expectedState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 2
          }],
          total: 19.98
        }
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_FETCHED, payload: givenProduct }))
        .to.deep.equal(expectedState);
    });

    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with previous data', () => {
      const givenQuantityChange = {
        barcode: '0001',
        quantityChanged: 5,
      };

      const giveInitialState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 1
          }],
          total: 9.99
        }
      };

      const expectedState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 5
          }],
          total: 49.95
        }
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });


    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity as not a number', () => {
      const givenQuantityChange = {
        barcode: '0001',
        quantityChanged: 'aaaa',
      };

      const giveInitialState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 1
          }],
          total: 9.99
        }
      };

      const expectedState = {
        order: {
          lines: [{
            barcode: '0001',
            name: 'Ninja',
            price: 9.99,
            quantity: 1
          }],
          total: 9.99
        }
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });



  });
});
