import {IMAGE_FETCH_FINISHED, IMAGE_FETCH_PROGRESSED} from './action';

export default function reducer(state = null, action) {
  switch (action.type) {
    case IMAGE_FETCH_PROGRESSED:
      return {percent: action.percent};
    case IMAGE_FETCH_FINISHED:
      return null;
    default:
      return state;
  }
}
