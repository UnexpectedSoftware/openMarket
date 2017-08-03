import { expect } from 'chai';
import listOrdersReducer from '../../../../openMarket/user_interface/order/list_orders/reducer';
import {
  LIST_ORDER_FETCHED,
  LIST_ORDER_FILTERS_END_DATE_CHANGED,
  LIST_ORDER_FILTERS_START_DATE_CHANGED
} from '../../../../openMarket/user_interface/order/list_orders/action';



describe('reducers', () => {
  describe('listOrders', () => {
    it('should handle initial state', () => {

      const resultState = listOrdersReducer(undefined, {});

      expect(resultState).to.have.deep.property('orders',[]);
      expect(resultState).to.have.deep.property('total_pages', 0);
      expect(resultState).to.have.deep.property('current_page', 0);
      expect(resultState).to.have.deep.property('total', 0.0);
      expect(resultState.filters).to.have.deep.property('offset',0);
      expect(resultState.filters).to.have.deep.property('limit',20);
      expect(resultState.filters).to.have.deep.property('startDate');
      expect(resultState.filters).to.have.deep.property('endDate');

    });


    it('should handle LIST_ORDER_FETCHED with given state', () => {
      const givenOrders = {
        orders: [{id:'001',createdAt:'',total:5.50}, {id:'002',createdAt:'',total:5.50}],
        total: 2,
        amount: 1.1,
        page: 0
      };

      const givenState = {
        orders: [],
        filters: {
          startDate: '',
          endDate: '',
          offset: 0,
          limit: 20
        },
        total_pages: 0,
        current_page: 0,
        total: 0.0
      };

      const expectedState = {
        orders: [{id:'001',createdAt:'',total:5.50}, {id:'002',createdAt:'',total:5.50}],
        filters: {
          startDate: '',
          endDate: '',
          offset: 0,
          limit: 20
        },
        total_pages: 1,
        current_page: 0,
        total: 1.1
      };

      const resultState = listOrdersReducer(givenState, { type: LIST_ORDER_FETCHED, payload: givenOrders });

      expect(resultState).to.deep.equal(expectedState);
    });



    it('should handle LIST_ORDER_FILTERS_START_DATE_CHANGED with given state', () => {
      const givenDate = '16/07/2017 17:53:04';

      const givenState = {
        orders: [],
        filters: {
          startDate: '',
          endDate: '',
          offset: 0,
          limit: 20
        },
        total_pages: 0,
        current_page: 0,
        total: 0.0
      };

      const expectedState = {
        orders: [],
        filters: {
          startDate: givenDate,
          endDate: '',
          offset: 0,
          limit: 20
        },
        total_pages: 0,
        current_page: 0,
        total: 0.0
      };

      const resultState = listOrdersReducer(givenState, { type: LIST_ORDER_FILTERS_START_DATE_CHANGED, payload: givenDate });

      expect(resultState).to.deep.equal(expectedState);
    });

    it('should handle LIST_ORDER_FILTERS_END_DATE_CHANGED with given state', () => {
      const givenDate = '31/07/2017 17:53:04';

      const givenState = {
        orders: [],
        filters: {
          startDate: '16/07/2017 17:53:04',
          endDate: '',
          offset: 0,
          limit: 20
        },
        total_pages: 0,
        current_page: 0,
        total: 0.0
      };

      const expectedState = {
        orders: [],
        filters: {
          startDate: '16/07/2017 17:53:04',
          endDate: givenDate,
          offset: 0,
          limit: 20
        },
        total_pages: 0,
        current_page: 0,
        total: 0.0
      };

      const resultState = listOrdersReducer(givenState, { type: LIST_ORDER_FILTERS_END_DATE_CHANGED, payload: givenDate });

      expect(resultState).to.deep.equal(expectedState);
    });


  });
});
