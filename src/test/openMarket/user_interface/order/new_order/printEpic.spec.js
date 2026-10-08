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

function errorNotification(payload) {
  return {type: 'ERROR', payload};
}

describe('Order print epics', () => {
  it('finishes when the ticket is accepted', (done) => {
    const epic = makePrinterDialogEpic({
      print: () => Rx.Observable.of(true)
    })(errorNotification);
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
      print: () => Rx.Observable.throw(new Error('Printer is busy'))
    })(errorNotification);
    epic(Rx.Observable.of({
      type: PRINT_ORDER_BUTTON_CLICKED,
      payload: {id: '1'}
    })).toArray().subscribe((actions) => {
      expect(actions).to.have.length(1);
      expect(actions[0].payload).to.include({
        title: 'Print failed',
        message: 'Printer is busy',
        position: 'tr',
        autoDismiss: 4
      });
      done();
    }, done);
  });
});
