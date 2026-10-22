import {expect} from 'chai';
import listOrdersReducer from '../../../../../openMarket/user_interface/order/list_orders/reducer';
import {PAGE_SIZE} from '../../../../../openMarket/user_interface/order/list_orders/model';
import {rangeFor} from '../../../../../openMarket/user_interface/order/list_orders/ranges';
import {
  LIST_ORDER_DETAIL,
  ORDERS_CUSTOM_CLOSED,
  ORDERS_CUSTOM_DRAFT_CHANGED,
  ORDERS_CUSTOM_OPENED,
  ORDERS_CUSTOM_REJECTED,
  ORDERS_FAILED,
  ORDERS_LOADED,
  ORDERS_RANGE_SELECTED,
  ORDERS_ROW_SELECTED,
  ORDERS_SELECTION_MOVED,
  ORDERS_SUMMARY_LOADED
} from '../../../../../openMarket/user_interface/order/list_orders/action';

const row = (orderId, totalCents) => ({
  orderId,
  invoiceNumber: orderId,
  createdAt: '2026-10-21T10:00:00',
  itemCount: 1,
  paymentMethod: 'cash',
  totalCents,
  cancelled: false
});

describe('listOrders reducer', () => {
  it('starts on today, loading, with an empty summary', () => {
    const today = rangeFor('today');
    const result = listOrdersReducer(undefined, {type: '@@INIT'});
    expect(result.rangeKey).to.equal('today');
    expect(result.from).to.equal(today.from);
    expect(result.to).to.equal(today.to);
    expect(result.limit).to.equal(PAGE_SIZE);
    expect(result.items).to.deep.equal([]);
    expect(result.summary).to.deep.equal({totalCents: 0, ticketCount: 0, averageCents: 0});
    expect(result.loading).to.equal(true);
    expect(result.selectedOrderId).to.equal(null);
  });

  it('replaces the list when a range is selected and appends when asked', () => {
    const loaded = listOrdersReducer(undefined, {
      type: ORDERS_LOADED,
      items: [row('a', 100)],
      total: 1,
      append: false
    });
    const replaced = listOrdersReducer(loaded, {
      type: ORDERS_RANGE_SELECTED,
      key: 'yesterday',
      from: '2026-10-20 00:00:00',
      to: '2026-10-20 23:59:59',
      offset: 0,
      append: false
    });
    expect(replaced.items).to.deep.equal([]);
    expect(replaced.loading).to.equal(true);
    expect(replaced.summary.ticketCount).to.equal(0);
    expect(replaced.selectedOrderId).to.equal(null);
    expect(replaced.rangeKey).to.equal('yesterday');

    const appended = listOrdersReducer(loaded, {
      type: ORDERS_RANGE_SELECTED,
      key: 'today',
      from: loaded.from,
      to: loaded.to,
      offset: 20,
      limit: 20,
      append: true
    });
    expect(appended.items).to.deep.equal(loaded.items);
    expect(appended.loading).to.equal(false);
    expect(appended.loadingMore).to.equal(true);
    expect(appended.offset).to.equal(20);
    expect(appended.selectedOrderId).to.equal('a');
  });

  it('selects the first row, keeps a selection that is still present, and appends', () => {
    const first = listOrdersReducer(undefined, {
      type: ORDERS_LOADED,
      items: [row('a', 100), row('b', 200)],
      total: 4
    });
    expect(first.selectedOrderId).to.equal('a');
    expect(first.loading).to.equal(false);
    expect(first.total).to.equal(4);

    const kept = listOrdersReducer({...first, selectedOrderId: 'b'}, {
      type: ORDERS_LOADED,
      items: [row('b', 200)],
      total: 1,
      append: false
    });
    expect(kept.selectedOrderId).to.equal('b');

    const more = listOrdersReducer(first, {
      type: ORDERS_LOADED,
      items: [row('c', 300)],
      total: 4,
      append: true
    });
    expect(more.items.map(item => item.orderId)).to.deep.equal(['a', 'b', 'c']);
    expect(more.selectedOrderId).to.equal('a');

    const empty = listOrdersReducer(first, {type: ORDERS_LOADED, items: [], total: 0});
    expect(empty.selectedOrderId).to.equal(null);
  });

  it('stores the failure and the summary', () => {
    const current = listOrdersReducer(undefined, {
      type: ORDERS_LOADED,
      items: [row('a', 100)],
      total: 1
    });
    const failed = listOrdersReducer(current, {type: ORDERS_FAILED, message: 'db down'});
    expect(failed.error).to.equal('db down');
    expect(failed.loading).to.equal(false);
    expect(failed.items).to.have.lengthOf(1);
    const fallback = listOrdersReducer(current, {type: ORDERS_FAILED});
    expect(fallback.error).to.equal('No se han podido cargar los pedidos');
    const summary = listOrdersReducer(failed, {
      type: ORDERS_SUMMARY_LOADED,
      totalCents: 855,
      ticketCount: 7,
      averageCents: 122
    });
    expect(summary.summary).to.deep.equal({totalCents: 855, ticketCount: 7, averageCents: 122});
  });

  it('moves the keyboard selection and clamps at the ends', () => {
    const current = listOrdersReducer(undefined, {
      type: ORDERS_LOADED,
      items: [row('a', 1), row('b', 2), row('c', 3)],
      total: 3
    });
    const down = listOrdersReducer(current, {type: ORDERS_SELECTION_MOVED, delta: 1});
    expect(down.selectedOrderId).to.equal('b');
    const end = listOrdersReducer(down, {type: ORDERS_SELECTION_MOVED, delta: 5});
    expect(end.selectedOrderId).to.equal('c');
    expect(listOrdersReducer(end, {type: ORDERS_SELECTION_MOVED, delta: 1})).to.equal(end);
    const top = listOrdersReducer(current, {type: ORDERS_SELECTION_MOVED, delta: -1});
    expect(top).to.equal(current);
    const none = listOrdersReducer({...current, selectedOrderId: null, items: []}, {
      type: ORDERS_SELECTION_MOVED,
      delta: 1
    });
    expect(none.selectedOrderId).to.equal(null);
    const fromNone = listOrdersReducer({...current, selectedOrderId: null}, {
      type: ORDERS_SELECTION_MOVED,
      delta: 1
    });
    expect(fromNone.selectedOrderId).to.equal('a');
  });

  it('tracks the custom range dialog and an explicit row', () => {
    const opened = listOrdersReducer(undefined, {type: ORDERS_CUSTOM_OPENED});
    expect(opened.customOpen).to.equal(true);
    expect(opened.customFrom).to.equal(opened.from.slice(0, 10));
    const from = listOrdersReducer(opened, {
      type: ORDERS_CUSTOM_DRAFT_CHANGED,
      field: 'from',
      value: '2026-10-01'
    });
    const to = listOrdersReducer(from, {
      type: ORDERS_CUSTOM_DRAFT_CHANGED,
      field: 'to',
      value: '2026-10-21'
    });
    expect(to.customFrom).to.equal('2026-10-01');
    expect(to.customTo).to.equal('2026-10-21');
    const rejected = listOrdersReducer(to, {type: ORDERS_CUSTOM_REJECTED, message: 'no'});
    expect(rejected.customError).to.equal('no');
    expect(listOrdersReducer(rejected, {type: ORDERS_CUSTOM_REJECTED}).customError).to.equal('');
    const closed = listOrdersReducer(rejected, {type: ORDERS_CUSTOM_CLOSED});
    expect(closed.customOpen).to.equal(false);
    expect(closed.customError).to.equal('');
    const selected = listOrdersReducer(closed, {type: ORDERS_ROW_SELECTED, orderId: 'a'});
    expect(selected.selectedOrderId).to.equal('a');
    expect(listOrdersReducer(selected, {type: LIST_ORDER_DETAIL, payload: 'a'})).to.equal(selected);
  });

  it('fills a missing offset from zero', () => {
    const result = listOrdersReducer(undefined, {
      type: ORDERS_RANGE_SELECTED,
      key: 'week',
      from: '2026-10-10 00:00:00',
      to: '2026-10-16 23:59:59'
    });
    expect(result.offset).to.equal(0);
    expect(result.limit).to.equal(PAGE_SIZE);
  });
});
