import { expect } from 'chai';
import {
  makeNewProductDialogEpic,
  makeNewProductSavedDialogEpic
} from "../../../../../openMarket/user_interface/order/new_product_dialog/epicFactory";
import {
  NEW_ORDER_PRODUCT_FETCH,
  NEW_ORDER_PRODUCT_NOT_FOUND
} from "../../../../../openMarket/user_interface/order/new_order/action";
import * as Rx from "rxjs";
import {
  HIDE_NEW_PRODUCT_DIALOG,
  NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG,
  SHOW_NEW_PRODUCT_DIALOG
} from "../../../../../openMarket/user_interface/order/new_product_dialog/action";
import container from "../../../../../openMarket/infrastructure/dic/Container";

describe('New Product Dialog Epics', () => {
  describe('New product dialog epic given an action of type NEW_ORDER_PRODUCT_NOT_FOUND', () => {
    it('should return an action of type SHOW_NEW_PRODUCT_DIALOG', (done) => {
      const givenBarcode = '42';
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_NOT_FOUND,
        payload:{
          barcode: givenBarcode
        }
      });

      const actions$ = makeNewProductDialogEpic(givenActions$);

      const expectedActions =[
        {
          type: SHOW_NEW_PRODUCT_DIALOG,
          payload: {
            barcode: givenBarcode
          }
        }
      ];
      actions$
        .toArray()
        .subscribe(
          actionsArray => expect(actionsArray).to.deep.equal(expectedActions),
          (error) => done(new Error(error)),
          () => done()
        );
    });
  });

  describe('New product dialog epic given an action of type NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG', () => {
    it('should return three actions', (done) => {
      const givenBarcode = '42';
      const givenName = 'Thor';
      const givenPrice = 9.99;

      const givenActions$ = Rx.Observable.of({
        type: NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG,
        payload:{
          barcode: givenBarcode,
          name: givenName,
          price: givenPrice
        }
      });

      const createProductUseCaseMock = {
        createOrUpdate: ({}) => Rx.Observable.of(null)
      };

      const notificationMock = {
        success: anything => ({
          type: 'RNS_SHOW_NOTIFICATION'
        }),
        error: anything => ({
          type: 'RNS_SHOW_NOTIFICATION'
        })
      };

      const productDefaults = container.environment.config.productDefaults;

      const actions$ = makeNewProductSavedDialogEpic(createProductUseCaseMock)({messaging:notificationMock})(productDefaults)(givenActions$);

      const expectedActions =[
        {
          type: NEW_ORDER_PRODUCT_FETCH,
          barcode: givenBarcode
        },
        {
          type: HIDE_NEW_PRODUCT_DIALOG
        },
        {
          type: 'RNS_SHOW_NOTIFICATION'
        }
      ];
      actions$
        .toArray()
        .subscribe(
          actionsArray => expect(actionsArray).to.deep.equal(expectedActions),
          (error) => done(new Error(error)),
          () => done()
        );
    });
  });


});
