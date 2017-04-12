import * as listProductActions from "./action";
import OpenMarket from "../../../index";

export default action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAll({limit:100,offset:0}))
    .map(products => listProductActions.listProductFetched(products))
