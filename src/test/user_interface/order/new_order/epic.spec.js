import { expect } from 'chai';
import {makeNewOrderProductFetchEpic} from '../../../../openMarket/user_interface/order/new_order/epicFactory';
import {
  NEW_ORDER_PRODUCT_FETCH,
  NEW_ORDER_PRODUCT_FETCHED
} from "../../../../openMarket/user_interface/order/new_order/action";
import * as Rx from "rxjs";

const crash = (err) => { throw err; };  // rethrow

describe('epics', () => {
  describe('orderProductFetchEpic', () => {
    it('should return an Observable of actions with product and reset form actions', () => {
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
  });
});
