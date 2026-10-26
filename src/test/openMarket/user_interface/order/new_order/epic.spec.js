import { expect } from 'chai';
import {
  makeNewOrderProductFetchEpic,
  makeNewOrderSaveEpic,
  makeLowStockWarningEpic,
  makeProductEnabledAgainEpic,
  savedActions
} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';
import {deliveringDomainEventBus} from '../../../support/domainEventBus';
import ProductWithLowStock from '../../../../../openMarket/domain/event/ProductWithLowStock';
import ProductEnabledAgain from '../../../../../openMarket/domain/event/ProductEnabledAgain';
import {
  NEW_ORDER_ERRORS_FOUND,
  NEW_ORDER_PRODUCT_FETCH,
  NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_NOT_FOUND, NEW_ORDER_SAVE, NEW_ORDER_SAVED,
  PAYMENT_FAILED,
  PRINT_ORDER_BUTTON_CLICKED
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

      const newOrderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCaseMock)(resetFormMock);

      const actions$ = newOrderSaveEpic(givenActions$);

      actions$
        .toArray()
        .subscribe(
          actionsArray => {
            expect(actionsArray).to.have.length(3);
            expect(actionsArray[0]).to.include({
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Order saved!',
              message: 'Order is saved in database',
              position: 'bc',
              autoDismiss: 2.5,
              uid: 'order-saved-42',
              level: 'success'
            });
            expect(actionsArray[1]).to.deep.equal({type: 'RESET_FORM_REDUX_WHATEVER'});
            expect(actionsArray[2]).to.deep.equal({
              type: NEW_ORDER_SAVED,
              payload: {
                id: '42',
                createdAt: '',
                lines: givenLines,
                total: 9.99
              }
            });
          },
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

      const resetFormMock = anything => ({
        type: 'RESET_FORM_REDUX_WHATEVER'
      });

      const newOrderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCaseMock)(resetFormMock);

      const actions$ = newOrderSaveEpic(givenActions$);

      actions$
        .toArray()
        .subscribe(
          actionsArray => {
            expect(actionsArray).to.have.length(3);
            expect(actionsArray[0]).to.deep.equal({type: 'RESET_FORM_REDUX_WHATEVER'});
            expect(actionsArray[1]).to.include({
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Order was not saved',
              message: 'Empty lines!',
              position: 'bc',
              autoDismiss: 0,
              level: 'error'
            });
            expect(actionsArray[1].uid).to.match(/^order-not-saved-/);
            expect(actionsArray[2]).to.deep.equal({type: PAYMENT_FAILED});
          },
          (error) => done(new Error(error)),
          () => done()
        );

    });

  });

  describe('savedActions', () => {
    function sale(mode, payment) {
      const dispatched = [];
      const actions = savedActions({
        savedOrder: {
          id: '42',
          payment: payment === undefined ? {method: 'card', changeCents: 0} : payment
        },
        preferences: mode == null ? null : {printMode: mode},
        resetForm: () => ({type: 'RESET'}),
        store: {dispatch: action => dispatched.push(action)}
      });
      return {actions, dispatched, notice: actions[0]};
    }

    function prints(actions) {
      return actions.filter(action => action.type === PRINT_ORDER_BUTTON_CLICKED);
    }

    it('prints a paid always sale and leaves the toast without an action', () => {
      const {actions, notice} = sale('always');
      expect(prints(actions)).to.have.length(1);
      expect(prints(actions)[0].payload.id).to.equal('42');
      expect(notice.action).to.equal(undefined);
      expect(notice.autoDismiss).to.equal(2.5);
      expect(notice.title).to.equal('Order saved!');
    });

    it('asks on a paid sale and does not print until the action is used', () => {
      const {actions, notice, dispatched} = sale('ask');
      expect(prints(actions)).to.deep.equal([]);
      expect(notice.autoDismiss).to.equal(0);
      expect(notice.action.label).to.equal('Imprimir ticket');
      notice.action.callback();
      expect(dispatched).to.have.length(1);
      expect(dispatched[0].type).to.equal(PRINT_ORDER_BUTTON_CLICKED);
      const missing = sale(null);
      expect(missing.notice.action.label).to.equal('Imprimir ticket');
      expect(prints(missing.actions)).to.deep.equal([]);
    });

    it('does not print a paid never sale and does not keep the toast', () => {
      const {actions, notice} = sale('never');
      expect(prints(actions)).to.deep.equal([]);
      expect(notice.action).to.equal(undefined);
      expect(notice.autoDismiss).to.not.equal(0);
      expect(notice.autoDismiss).to.equal(2.5);
    });

    it('does not print an unpaid sale in any mode', () => {
      ['always', 'ask', 'never'].forEach(mode => {
        const {actions, notice} = sale(mode, null);
        expect(prints(actions)).to.deep.equal([]);
        expect(notice.action).to.equal(undefined);
        expect(notice.autoDismiss).to.not.equal(0);
      });
    });

    it('asks when the preferences use case is missing and prints when it says always', done => {
      const order = {id: '42', payment: {method: 'card', changeCents: 0}};
      const reset = () => ({type: 'RESET'});
      const create = {createOrder: () => Rx.Observable.of(order)};
      const action = {type: NEW_ORDER_SAVE, order: {lines: [{barcode: '1'}]}, payment: order.payment};
      makeNewOrderSaveEpic(create)(reset)(Rx.Observable.of(action))
        .toArray()
        .subscribe(actions => {
          expect(actions[0].action.label).to.equal('Imprimir ticket');
          expect(prints(actions)).to.deep.equal([]);
          const always = {get: () => Rx.Observable.of({printMode: 'always'})};
          makeNewOrderSaveEpic(create, always)(reset)(Rx.Observable.of(action))
            .toArray()
            .subscribe(printed => {
              expect(printed[0].action).to.equal(undefined);
              expect(prints(printed)).to.have.length(1);
              const quiet = {get: () => Rx.Observable.of({printMode: 'never'})};
              makeNewOrderSaveEpic(create, quiet)(reset)(Rx.Observable.of(action))
                .toArray()
                .subscribe(silent => {
                  expect(silent[0].action).to.equal(undefined);
                  expect(silent[0].autoDismiss).to.equal(2.5);
                  expect(prints(silent)).to.deep.equal([]);
                  const empty = {get: () => Rx.Observable.empty()};
                  makeNewOrderSaveEpic(create, empty)(reset)(Rx.Observable.of(action))
                    .toArray()
                    .subscribe(asked => {
                      expect(asked[0].action.label).to.equal('Imprimir ticket');
                      expect(prints(asked)).to.deep.equal([]);
                      done();
                    }, done);
                }, done);
            }, done);
        }, done);
    });
  });

  describe('Low stock warning', () => {
    it('shows one warning for each ProductWithLowStock event', (done) => {
      const bus = deliveringDomainEventBus();
      const actions$ = makeLowStockWarningEpic(bus)();

      actions$
        .take(4)
        .toArray()
        .subscribe(
          actions => expect(actions).to.deep.equal([
            {
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Stock bajo',
              message: 'Quedan 4 de Coca-Cola (mínimo 10).',
              position: 'bc',
              autoDismiss: 2.5,
              uid: 'low-stock-0001-4',
              level: 'warning'
            },
            {type: 'NEW_ORDER_NOTE_LOW_STOCK', payload: {barcode: '0001', stock: 4, weighted: false}},
            {
              type: 'RNS_SHOW_NOTIFICATION',
              title: 'Stock bajo',
              message: 'Quedan 0 de Water (mínimo 5).',
              position: 'bc',
              autoDismiss: 2.5,
              uid: 'low-stock-0002-0',
              level: 'warning'
            },
            {type: 'NEW_ORDER_NOTE_LOW_STOCK', payload: {barcode: '0002', stock: 0, weighted: false}}
          ]),
          error => done(new Error(error)),
          () => done()
        );

      bus.record(new ProductWithLowStock({
        barcode: '0001',
        name: 'Coca-Cola',
        stock: 4,
        stockMin: 10
      }));
      bus.record(new ProductWithLowStock({
        barcode: '0002',
        name: 'Water',
        stock: 0,
        stockMin: 5
      }));
      bus.raise();
    });
  });

  describe('Product enabled again', () => {
    it('warns that the product is enabled and stock increased by 1', (done) => {
      const bus = deliveringDomainEventBus();
      const actions$ = makeProductEnabledAgainEpic(bus)();

      actions$
        .take(1)
        .subscribe(
          action => expect(action).to.deep.equal({
            type: 'RNS_SHOW_NOTIFICATION',
            title: 'Product enabled',
            message: 'Coca-Cola Zero 42 has been enabled again and the stock was increased by +1.',
            position: 'bc',
            autoDismiss: 2.5,
            uid: 'product-enabled-0005',
            level: 'warning'
          }),
          error => done(new Error(error)),
          () => done()
        );

      bus.record(new ProductEnabledAgain({
        barcode: '0005',
        name: 'Coca-Cola Zero 42'
      }));
      bus.raise();
    });
  });
});
