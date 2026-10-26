import {
  LOW_STOCK_COUNT_FAILED,
  LOW_STOCK_COUNT_LOADED,
  LOW_STOCK_COUNT_REQUESTED
} from './action';
import {failed, loaded, requested, state as initialState} from './model';

export default function reducer(current = initialState(), action) {
  switch (action.type) {
    case LOW_STOCK_COUNT_REQUESTED:
      return requested(current);
    case LOW_STOCK_COUNT_LOADED:
      return loaded(current, action.count);
    case LOW_STOCK_COUNT_FAILED:
      return failed(current);
    default:
      return current;
  }
}
