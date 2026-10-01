import 'rxjs/add/operator/switchMap';
import * as newProductActions from "./action";
import {LIST_PRODUCTS_DETAIL_LOADED} from "../list_products/action";
import {DEFAULT_SALES_WINDOW} from "../../../application/service/product/salesWindows";

export const makeProductCloseEpic = resetForm => action$ =>
  action$
    .filter(action => action.type === newProductActions.PRODUCT_CLOSE)
    .map(action => resetForm('new_product'));

export const makeProductSalesEpic = salesOfProduct => action$ =>
  action$
    .filter(action =>
      action.type === LIST_PRODUCTS_DETAIL_LOADED ||
      action.type === newProductActions.PRODUCT_SALES_WINDOW_SELECTED
    )
    .switchMap(action => {
      const barcode = action.type === LIST_PRODUCTS_DETAIL_LOADED
        ? action.payload.barcode
        : action.barcode;
      const window = action.type === newProductActions.PRODUCT_SALES_WINDOW_SELECTED
        ? action.window
        : DEFAULT_SALES_WINDOW;
      return salesOfProduct({barcode, window})
        .map(sales => newProductActions.productSalesLoaded(sales));
    });

