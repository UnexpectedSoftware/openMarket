import 'rxjs/add/operator/switchMap';
import * as newProductActions from "./action";

export const makeProductCloseEpic = resetForm => action$ =>
  action$
    .filter(action => action.type === newProductActions.PRODUCT_CLOSE)
    .map(action => resetForm('new_product'));

export const makeProductSalesEpic = salesOfProduct => action$ =>
  action$
    .filter(action => action.type === newProductActions.PRODUCT_SALES_WINDOW_SELECTED)
    .switchMap(action => salesOfProduct({barcode: action.barcode, window: action.window})
      .map(sales => newProductActions.productSalesLoaded(sales)));

