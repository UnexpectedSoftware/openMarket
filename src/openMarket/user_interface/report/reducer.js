import {
  REPORT_CUSTOM_CHANGED,
  REPORT_CUSTOM_CLOSED,
  REPORT_CUSTOM_OPENED,
  REPORT_CUSTOM_REJECTED,
  REPORT_RANGE_SELECTED,
  REPORT_SUMMARY_FAILED,
  REPORT_SUMMARY_LOADED
} from './action';
import {
  closeCustom,
  customChanged,
  customRejected,
  openCustom,
  selectRange,
  state,
  summaryFailed,
  summaryLoaded
} from './model';

/**
 * @param {object} [current]
 * @param {{type: string}} action
 */
export default function reducer(current = state(), action) {
  switch (action.type) {
    case REPORT_RANGE_SELECTED:
      return selectRange(current, action);
    case REPORT_SUMMARY_LOADED:
      return summaryLoaded(current, action);
    case REPORT_SUMMARY_FAILED:
      return summaryFailed(current, action);
    case REPORT_CUSTOM_OPENED:
      return openCustom(current);
    case REPORT_CUSTOM_CLOSED:
      return closeCustom(current);
    case REPORT_CUSTOM_CHANGED:
      return customChanged(current, action);
    case REPORT_CUSTOM_REJECTED:
      return customRejected(current, action);
    default:
      return current;
  }
}
