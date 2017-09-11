import { expect } from 'chai';
import {makeNewOrderProductFetchEpic} from '../../../../openMarket/user_interface/order/new_order/epicFactory';
import {
  NEW_ORDER_PRODUCT_FETCH,
  NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_NOT_FOUND
} from "../../../../openMarket/user_interface/order/new_order/action";
import * as Rx from "rxjs";
import {SHOW_WEIGHTED_DIALOG} from "../../../../openMarket/user_interface/order/weighted_dialog/action";

const crash = (err) => { throw err; };  // rethrow

describe('Order Epics', () => {
  describe('Order Product Fetch', () => {
    it('should return an action of type NEW_ORDER_PRODUCT_FETCHED and action of type Redux reset form', () => {
      const givenBarcode = '0001';
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_FETCH,
        barcode: givenBarcode
      });

      const findProductUseCaseMock = {
        findProductByBarcode: ({barcode}) => Rx.Observable.of({
          barcode: givenBarcode,
          isWeighted: false
        })
      }

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(resetFormMock);

      const actions$ = newOrderProductFetchEpic(givenActions$);


      const expectedActions =[
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
        },
        {
          type: NEW_ORDER_PRODUCT_FETCHED,
          payload: {
            product: {
              barcode: givenBarcode,
              isWeighted: false
            },
            quantity: 1
          }
        }
      ];

      actions$
        .toArray()
        .subscribe(
        actionsArray => expect(actionsArray).to.deep.equal(expectedActions),
        crash,
        () => {}
      );

    });


    it('should return an action of type NEW_ORDER_PRODUCT_NOT_FOUND and Redux reset form action', () => {
      const givenBarcode = '0042';
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_FETCH,
        barcode: givenBarcode
      });

      const findProductUseCaseMock = {
        findProductByBarcode: ({barcode}) => Rx.Observable.empty()
      };

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(resetFormMock);

      const actions$ = newOrderProductFetchEpic(givenActions$);


      const expectedActions =[
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
        },
        {
          type: NEW_ORDER_PRODUCT_NOT_FOUND,
          payload: {
            message: `Product with barcode ${givenBarcode} not found!`
          }
        }
      ];

      actions$
        .toArray()
        .subscribe(
          actionsArray => expect(actionsArray).to.deep.equal(expectedActions),
          crash,
          () => {}
        );

    });

    it('should return an action of type SHOW_WEIGHTED_DIALOG and action of type Redux reset form', () => {
      const givenBarcode = '0001';
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_FETCH,
        barcode: givenBarcode
      });

      const findProductUseCaseMock = {
        findProductByBarcode: ({barcode}) => Rx.Observable.of({
          barcode: givenBarcode,
          isWeighted: true
        })
      }

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(resetFormMock);

      const actions$ = newOrderProductFetchEpic(givenActions$);


      const expectedActions =[
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
        },
        {
          type: SHOW_WEIGHTED_DIALOG,
          payload: {
            barcode: givenBarcode,
            isWeighted: true
          }
        }
      ];

      actions$
        .toArray()
        .subscribe(
          actionsArray => expect(actionsArray).to.deep.equal(expectedActions),
          crash,
          () => {}
        );

    });
  });
});
