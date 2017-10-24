import { expect } from 'chai';
import newOrderReducer from '../../../../../openMarket/user_interface/order/new_order/reducer';
import {
  NEW_ORDER_PRODUCT_DELETED,
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_PRODUCT_QUANTITY_CHANGE
} from '../../../../../openMarket/user_interface/order/new_order/action';
import OrderFactoryImpl from "../../../../../openMarket/infrastructure/order/OrderFactoryImpl";
import UUIDIdentity from "../../../../../openMarket/infrastructure/service/UUIDIdentity";
import {LIST_ORDER_DETAIL_LOADED} from "../../../../../openMarket/user_interface/order/list_orders/action";

const orderFactory = new OrderFactoryImpl({identity: new UUIDIdentity()});

describe('reducers', () => {
  describe('newOrder', () => {
    it('should handle initial state', () => {
      const expectedInitialState = {
        order: {
          lines: [],
          total: 0.0
        },

        readonly: false
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

      const givenPayload = {
        product: givenProduct,
        quantity: 1
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
        },

        readonly: false
      };
      expect(newOrderReducer(undefined, { type: NEW_ORDER_PRODUCT_FETCHED, payload: givenPayload }))
        .to.deep.equal(expectedState);
    });


    it('should handle NEW_ORDER_PRODUCT_FETCHED with a repeated product', () => {
      const givenProduct = {
        barcode: '0001',
        name: 'Ninja',
        quantity: 1,
        price: 9.99
      };

      const givenPayload = {
        product: givenProduct,
        quantity: 1
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
        },

        readonly: false
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
        },

        readonly: false
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_FETCHED, payload: givenPayload }))
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
        },

        readonly: false
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
        },

        readonly: false
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
        },

        readonly: false
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
        },

        readonly: false
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });


    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity as blank', () => {
      const givenQuantityChange = {
        barcode: '0001',
        quantityChanged: '',
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
        },

        readonly: false
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
        },

        readonly: false
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
        },

        readonly: false
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
        },

        readonly: false
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });



    it('should handle NEW_ORDER_PRODUCT_QUANTITY_CHANGE with quantity 0.6 and get a total with 2 decimals', () => {
      const givenQuantityChange = {
        barcode: '0001',
        quantityChanged: 0.6,
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
        },

        readonly: false
      };

      const expectedState = {
        order: {
          lines: [
            {
              barcode: '0001',
              name: 'Ninja',
              price: 0.55,
              quantity: 0.6,
              subtotal: 0.33
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
          total: 2.73
        },

        readonly: false
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE, payload: givenQuantityChange }))
        .to.deep.equal(expectedState);
    });





    it('should handle NEW_ORDER_PRODUCT_DELETED with an order with some products on it', () => {
      const givenActionWithBarcode = '0001';


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
            }
          ],
          total: 1.15
        },

        readonly: false
      };

      const expectedState = {
        order: {
          lines: [
            {
              barcode: '0002',
              name: 'Ninja2',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            }
          ],
          total: 0.6
        },

        readonly: false
      };
      expect(newOrderReducer(giveInitialState, { type: NEW_ORDER_PRODUCT_DELETED, barcode: givenActionWithBarcode }))
        .to.deep.equal(expectedState);
    });
  });

  describe('view Order', () => {
    it('should handle LIST_ORDER_DETAIL_LOADED to load previous order',() =>{
      const giveInitialState = {
        order: {
          lines: [],
          total: 0
        },
        readonly: false
      };

      const givenOrder =  orderFactory.createWith({
        lines: [{
          barcode: '0002',
          name: 'Ninja2',
          price: 0.6,
          quantity: 1
        }]
      });

      const expectedState = {
        order: {
          lines: [
            {
              barcode: '0002',
              name: 'Ninja2',
              price: 0.6,
              quantity: 1,
              subtotal: 0.6
            }
          ],
          total: 0.6,
          createdAt: givenOrder.createdAt
        },
        readonly: true
      };

      expect(newOrderReducer(giveInitialState, { type: LIST_ORDER_DETAIL_LOADED, payload: givenOrder }))
        .to.deep.equal(expectedState);

    });
  });
});
