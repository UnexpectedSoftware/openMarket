import {expect} from 'chai';
import {orderListKey} from '../../../../../openMarket/user_interface/order/list_orders/keys';

const screen = {customOpen: false, selectedOrderId: 'a'};

describe('orderListKey', () => {
  it('moves the selection with the arrow keys', () => {
    expect(orderListKey({key: 'ArrowDown'}, screen)).to.deep.equal({type: 'move', delta: 1});
    expect(orderListKey({key: 'ArrowUp'}, screen)).to.deep.equal({type: 'move', delta: -1});
  });

  it('opens the selected order when Enter is not on a button', () => {
    expect(orderListKey({key: 'Enter', target: {tagName: 'DIV'}}, screen)).to.deep.equal({
      type: 'open',
      orderId: 'a'
    });
  });

  it('leaves Enter to the focused button and ignores typing and the range dialog', () => {
    expect(orderListKey({key: 'Enter', target: {tagName: 'BUTTON'}}, screen)).to.equal(null);
    expect(orderListKey({key: 'ArrowDown', target: {tagName: 'INPUT'}}, screen)).to.equal(null);
    expect(orderListKey({key: 'ArrowDown', target: {tagName: 'TEXTAREA'}}, screen)).to.equal(null);
    expect(orderListKey({key: 'ArrowUp', target: {tagName: 'SELECT'}}, screen)).to.equal(null);
    expect(orderListKey({key: 'ArrowDown'}, {customOpen: true, selectedOrderId: 'a'})).to.equal(null);
    expect(orderListKey({key: 'Enter', target: {tagName: 'DIV'}}, {customOpen: false, selectedOrderId: null})).to.equal(null);
    expect(orderListKey({key: 'Escape'}, screen)).to.equal(null);
    expect(orderListKey({key: 'ArrowDown', target: null}, screen)).to.deep.equal({type: 'move', delta: 1});
  });
});
