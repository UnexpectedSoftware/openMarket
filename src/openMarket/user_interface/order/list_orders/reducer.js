import {
  ORDER_DETAIL_FAILED,
  ORDER_DETAIL_LOADED,
  ORDER_DETAIL_REQUESTED,
  ORDER_REPRINT_CLOSED,
  ORDER_REPRINT_CONFIRMED,
  ORDER_REPRINT_FAILED,
  ORDER_REPRINT_FINISHED,
  ORDER_REPRINT_PREVIEW_LOADED,
  ORDER_REPRINT_REQUESTED,
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
  detailFailed,
  detailLoaded,
  detailRequested,
  moveSelection,
  ordersFailed,
  ordersLoaded,
  reprintClosed,
  reprintConfirmed,
  reprintFailed,
  reprintFinished,
  reprintPreviewLoaded,
  reprintRequested,
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
    case ORDER_DETAIL_REQUESTED:
      return detailRequested(current, action);
    case ORDER_DETAIL_LOADED:
      return detailLoaded(current, action);
    case ORDER_DETAIL_FAILED:
      return detailFailed(current, action);
    case ORDER_REPRINT_REQUESTED:
      return reprintRequested(current, action);
    case ORDER_REPRINT_PREVIEW_LOADED:
      return reprintPreviewLoaded(current, action);
    case ORDER_REPRINT_CLOSED:
      return reprintClosed(current);
    case ORDER_REPRINT_CONFIRMED:
      return reprintConfirmed(current);
    case ORDER_REPRINT_FINISHED:
      return reprintFinished(current, action);
    case ORDER_REPRINT_FAILED:
      return reprintFailed(current, action);
    case ORDERS_CUSTOM_OPENED:
      return customOpened(current);
    case ORDERS_CUSTOM_CLOSED:
      return customClosed(current);
    case ORDERS_CUSTOM_DRAFT_CHANGED:
      return customDraft(current, action);
    case ORDERS_CUSTOM_REJECTED:
      return customRejected(current, action);
    default:
      return current;
  }
}
