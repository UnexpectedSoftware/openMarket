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
} from './action';
import {
  customClosed,
  customDraft,
  customOpened,
  customRejected,
  moveSelection,
  ordersFailed,
  ordersLoaded,
  rowSelected,
  selectRange,
  state,
  summaryLoaded
} from './model';

export default function reducer(current = state(), action) {
  switch (action.type) {
    case ORDERS_RANGE_SELECTED:
      return selectRange(current, action);
    case ORDERS_LOADED:
      return ordersLoaded(current, action);
    case ORDERS_FAILED:
      return ordersFailed(current, action);
    case ORDERS_SUMMARY_LOADED:
      return summaryLoaded(current, action);
    case ORDERS_SELECTION_MOVED:
      return moveSelection(current, action.delta);
    case ORDERS_ROW_SELECTED:
      return rowSelected(current, action.orderId);
    case ORDERS_CUSTOM_OPENED:
      return customOpened(current);
    case ORDERS_CUSTOM_CLOSED:
      return customClosed(current);
    case ORDERS_CUSTOM_DRAFT_CHANGED:
      return customDraft(current, action);
    case ORDERS_CUSTOM_REJECTED:
      return customRejected(current, action);
    case LIST_ORDER_DETAIL:
      return current;
    default:
      return current;
  }
}
