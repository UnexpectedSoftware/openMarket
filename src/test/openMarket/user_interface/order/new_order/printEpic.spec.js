import {expect} from 'chai';
import * as Rx from 'rxjs';
import {
  makePrintButtonClickedEpic,
  makePrinterDialogEpic
} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';
import {HIDE_PRINTER_DIALOG} from '../../../../../openMarket/user_interface/order/printer_dialog/action';
import {
  PRINT_ORDER_BUTTON_CLICKED,
  PRINT_ORDER_FINISHED
} from '../../../../../openMarket/user_interface/order/new_order/action';

describe('Order print epics', () => {
  it('finishes when the ticket is accepted', (done) => {
    const epic = makePrinterDialogEpic({
      build: () => Rx.Observable.of({blocks: []})
    })({
      print: () => Rx.Observable.of(true)
    });
    epic(Rx.Observable.of({
      type: HIDE_PRINTER_DIALOG,
      payload: {print: true, order: {id: '1'}}
    })).toArray().subscribe((actions) => {
      expect(actions).to.deep.equal([{type: PRINT_ORDER_FINISHED}]);
      done();
    }, done);
  });

  it('toasts a busy printer instead of failing the stream', (done) => {
    const epic = makePrintButtonClickedEpic({
      build: () => Rx.Observable.of({blocks: []})
    })({
      print: () => Rx.Observable.throw(new Error('Printer is busy'))
    });
    epic(Rx.Observable.of({
      type: PRINT_ORDER_BUTTON_CLICKED,
      payload: {id: '1'}
    })).toArray().subscribe((actions) => {
      expect(actions).to.have.length(1);
      expect(actions[0]).to.include({
        type: 'RNS_SHOW_NOTIFICATION',
        title: 'Print failed',
        message: 'Printer is busy',
        position: 'bc',
        autoDismiss: 0,
        level: 'error'
      });
      expect(actions[0].uid).to.match(/^print-failed-/);
      done();
    }, done);
  });
});
