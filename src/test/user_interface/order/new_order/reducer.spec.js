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
            quantity: 1,
            subtotal: 9.99
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
            quantity: 1,
            subtotal: 9.99
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
            quantity: 2,
            subtotal: 19.98
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
            quantity: 1,
            subtotal: 9.99
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
            quantity: 5,
            subtotal: 49.95
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
            quantity: 1,
            subtotal: 9.99
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
            quantity: 1,
            subtotal: 9.99
          }],
          total: 9.99
        }
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });


    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity 6 and get a total with 2 decimals', () => {
      const givenQuantityChange = {
        barcode: '0001',
        quantityChanged: 6,
      };

      const giveInitialState = {
        order: {
          lines: [
            {
              barcode: '0001',
              name: 'Ninja',
              price: 0.55,
              quantity: 1,
              subtotal: 0.55
            },
            {
              barcode: '0002',
              name: 'Ninja2',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            },
            {
              barcode: '0003',
              name: 'Ninja3',
              price: 0.6,
              quantity: 2,
              subtotal: 1.2
            },
            {
              barcode: '0004',
              name: 'Ninja4',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            }

          ],
          total: 2.94
        }
      };

      const expectedState = {
        order: {
          lines: [
            {
              barcode: '0001',
              name: 'Ninja',
              price: 0.55,
              quantity: 6,
              subtotal: 3.3
            },
            {
              barcode: '0002',
              name: 'Ninja2',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            },
            {
              barcode: '0003',
              name: 'Ninja3',
              price: 0.6,
              quantity: 2,
              subtotal: 1.2
            },
            {
              barcode: '0004',
              name: 'Ninja4',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            }

          ],
          total: 5.7
        }
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });





  });
});
