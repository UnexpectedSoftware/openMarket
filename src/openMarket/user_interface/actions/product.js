// @flow
import type { counterStateType } from '../reducers/counter';

export const CREATE_PRODUCT = 'CREATE_PRODUCT';


export function create() {
  return {
    type: CREATE_PRODUCT
  };
}

