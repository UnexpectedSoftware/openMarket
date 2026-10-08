import {CATALOG_PRINT_FINISHED, CATALOG_PRINT_PROGRESSED} from './action';

export default function reducer(state = null, action) {
  switch (action.type) {
    case CATALOG_PRINT_PROGRESSED:
      return {percent: action.percent};
    case CATALOG_PRINT_FINISHED:
      return null;
    default:
      return state;
  }
}
