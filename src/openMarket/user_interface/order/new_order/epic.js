import * as newOrderActions from "./action";
import OpenMarket from "../../../index";

export default action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.barcode}))
    .do(data => console.log("product:",data))
    .map(product => newOrderActions.newOrderProductFetched(product));
