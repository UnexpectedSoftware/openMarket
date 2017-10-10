import * as newProductActions from "./action";

export const makeProductCloseEpic = resetForm => action$ =>
  action$
    .filter(action => action.type === newProductActions.PRODUCT_CLOSE)
    .map(action => resetForm('new_product'));

