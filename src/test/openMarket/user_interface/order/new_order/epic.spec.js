import { expect } from 'chai';
import {
  makeNewOrderProductFetchEpic,
  makeNewOrderSaveEpic,
  makeLowStockWarningEpic,
  makeProductEnabledAgainEpic
} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';
import DomainEventBus from '../../../../../openMarket/domain/service/DomainEventBus';
import ProductWithLowStock from '../../../../../openMarket/domain/event/ProductWithLowStock';
import ProductEnabledAgain from '../../../../../openMarket/domain/event/ProductEnabledAgain';
import {
  NEW_ORDER_ERRORS_FOUND,
  NEW_ORDER_PRODUCT_FETCH,
  NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_NOT_FOUND, NEW_ORDER_SAVE, NEW_ORDER_SAVED
} from "../../../../../openMarket/user_interface/order/new_order/action";
import * as Rx from "rxjs";
import {SHOW_WEIGHTED_DIALOG} from "../../../../../openMarket/user_interface/order/weighted_dialog/action";

describe('Order Epics', () => {
  describe('Order Product Fetch', () => {
    it('should return an action of type NEW_ORDER_PRODUCT_FETCHED and action of type Redux reset form', (done) => {
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

      const enableProductUseCaseMock = {
        enableForSale: () => Rx.Observable.throw(new Error('enabled product must stay as it is'))
      };

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(enableProductUseCaseMock)(resetFormMock);

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
          (error) => done(new Error(error)),
        () => done()
      );

    });


    it('should return an action of type NEW_ORDER_PRODUCT_NOT_FOUND and Redux reset form action', (done) => {
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

      const enableProductUseCaseMock = {
        enableForSale: () => Rx.Observable.throw(new Error('missing product must not be enabled'))
      };

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(enableProductUseCaseMock)(resetFormMock);

      const actions$ = newOrderProductFetchEpic(givenActions$);


      const expectedActions =[
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
        },
        {
          type: NEW_ORDER_PRODUCT_NOT_FOUND,
          payload: givenBarcode
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

    it('should return an action of type SHOW_WEIGHTED_DIALOG and action of type Redux reset form', (done) => {
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

      const enableProductUseCaseMock = {
        enableForSale: () => Rx.Observable.throw(new Error('enabled product must stay as it is'))
      };

      const newOrderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCaseMock)(enableProductUseCaseMock)(resetFormMock);

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
          (error) => done(new Error(error)),
          () => done()
        );

    });

    it('enables a disabled product and adds it to the order', (done) => {
      const givenBarcode = '0005';
      const enabledProduct = {
        barcode: givenBarcode,
        name: 'Hidden',
        isWeighted: false,
        status: 'ENABLED'
      };
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_FETCH,
        barcode: givenBarcode
      });
      const findProductUseCaseMock = {
        findProductByBarcode: () => Rx.Observable.of({
          barcode: givenBarcode,
          name: 'Hidden',
          isWeighted: false,
          status: 'DISABLED'
        })
      };
      let enabledBarcode = null;
      const enableProductUseCaseMock = {
        enableForSale: ({barcode}) => {
          enabledBarcode = barcode;
          return Rx.Observable.of(enabledProduct);
        }
      };
      const resetFormMock = () => ({type: 'RESET_FORM_REDUX_WHATEVER'});
      const actions$ = makeNewOrderProductFetchEpic(findProductUseCaseMock)(enableProductUseCaseMock)(resetFormMock)(givenActions$);

      actions$
        .toArray()
        .subscribe(
          actionsArray => {
            expect(enabledBarcode).to.equal(givenBarcode);
            expect(actionsArray).to.deep.equal([
              {type: 'RESET_FORM_REDUX_WHATEVER'},
              {
                type: NEW_ORDER_PRODUCT_FETCHED,
                payload: {product: enabledProduct, quantity: 1}
              }
            ]);
          },
          error => done(new Error(error)),
          () => done()
        );
    });

    it('enables a disabled weighted product and opens the weight dialog', (done) => {
      const givenBarcode = '0006';
      const enabledProduct = {
        barcode: givenBarcode,
        name: 'Apples',
        isWeighted: true,
        status: 'ENABLED'
      };
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_PRODUCT_FETCH,
        barcode: givenBarcode
      });
      const findProductUseCaseMock = {
        findProductByBarcode: () => Rx.Observable.of({
          barcode: givenBarcode,
          isWeighted: true,
          status: 'DISABLED'
        })
      };
      const enableProductUseCaseMock = {
        enableForSale: () => Rx.Observable.of(enabledProduct)
      };
      const resetFormMock = () => ({type: 'RESET_FORM_REDUX_WHATEVER'});
      const actions$ = makeNewOrderProductFetchEpic(findProductUseCaseMock)(enableProductUseCaseMock)(resetFormMock)(givenActions$);

      actions$
        .toArray()
        .subscribe(
          actionsArray => expect(actionsArray).to.deep.equal([
            {type: 'RESET_FORM_REDUX_WHATEVER'},
            {type: SHOW_WEIGHTED_DIALOG, payload: enabledProduct}
          ]),
          error => done(new Error(error)),
          () => done()
        );
    });
  });


  describe('Order save', () => {
    it('should return an action of type NEW_ORDER_SAVED and action of type Redux reset form', (done) => {
      const givenLines = [
        {
          barcode: "0001",
          name: "Coca-Cola",
          price: 0.55,
          quantity: 5
        }
      ];
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_SAVE,
        order: {
          lines: givenLines
        }
      });

      const orderCreateUseCaseMock = {
        createOrder: ({lines}) => Rx.Observable.of({
          id: '42',
          createdAt: '',
          lines: givenLines,
          total: 9.99
        })
      };

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const notificationMock = anything => ({
        type: 'RNS_SHOW_NOTIFICATION'
      });

      const newOrderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCaseMock)(resetFormMock)(notificationMock)(notificationMock);

      const actions$ = newOrderSaveEpic(givenActions$);


      const expectedActions = [
        {
          type: 'RNS_SHOW_NOTIFICATION'
        },
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
        },
        {
          type: NEW_ORDER_SAVED,
          payload: {
            id: '42',
            createdAt: '',
            lines: givenLines,
            total: 9.99
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


    it('should return an action of type RNS_SHOW_NOTIFICATION and action of type Redux reset form', (done) => {
      const givenEmptyLines = [];
      const givenActions$ = Rx.Observable.of({
        type: NEW_ORDER_SAVE,
        order: {
          lines: givenEmptyLines
        }
      });

      const orderCreateUseCaseMock = {
        createOrder: ({lines}) => Rx.Observable.throw(new Error('Empty lines!'))
      };

      const notificationMock = anything => ({
        type: 'RNS_SHOW_NOTIFICATION'
      });

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const newOrderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCaseMock)(resetFormMock)(notificationMock)(notificationMock);

      const actions$ = newOrderSaveEpic(givenActions$);


      const expectedActions = [
        {
          type: 'RESET_FORM_REDUX_WHATEVER'
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

  describe('Low stock warning', () => {
    it('shows one warning for each ProductWithLowStock event', (done) => {
      const bus = new DomainEventBus();
      const warningNotification = options => ({
        type: 'RNS_SHOW_NOTIFICATION',
        title: options.title,
        message: options.message
      });
      const actions$ = makeLowStockWarningEpic(bus)(warningNotification)();

      actions$
        .take(2)
        .toArray()
        .subscribe(
          actions => expect(actions).to.deep.equal([
            {
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Stock is low',
              message: 'Coca-Cola has 4 left (minimum 10).'
            },
            {
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Stock is low',
              message: 'Water has 0 left (minimum 5).'
            }
          ]),
          error => done(new Error(error)),
          () => done()
        );

      bus.publish(new ProductWithLowStock({
        barcode: '0001',
        name: 'Coca-Cola',
        stock: 4,
        stockMin: 10
      }));
      bus.publish(new ProductWithLowStock({
        barcode: '0002',
        name: 'Water',
        stock: 0,
        stockMin: 5
      }));
    });
  });

  describe('Product enabled again', () => {
    it('warns that the product is enabled and stock increased by 1', (done) => {
      const bus = new DomainEventBus();
      const warningNotification = options => ({
        type: 'RNS_SHOW_NOTIFICATION',
        title: options.title,
        message: options.message,
        position: options.position,
        autoDismiss: options.autoDismiss
      });
      const actions$ = makeProductEnabledAgainEpic(bus)(warningNotification)();

      actions$
        .take(1)
        .subscribe(
          action => expect(action).to.deep.equal({
            type: 'RNS_SHOW_NOTIFICATION',
            title: 'Product enabled',
            message: 'Coca-Cola Zero 42 has been enabled again and the stock was increased by +1.',
            position: 'tr',
            autoDismiss: 8
          }),
          error => done(new Error(error)),
          () => done()
        );

      bus.publish(new ProductEnabledAgain({
        barcode: '0005',
        name: 'Coca-Cola Zero 42'
      }));
    });
  });
});
