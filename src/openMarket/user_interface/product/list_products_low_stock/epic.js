import * as listProductActions from "./action";
import * as Rx from "rxjs";
import { success, error } from 'react-notification-system-redux';
import OpenMarket from "../../../application/index";
import ImageStore, {imagesDirectory} from "../../../infrastructure/service/ImageStore";

const images = new ImageStore({directory: imagesDirectory('product-images')});

function withImageSrc(products) {
  return products.map(product => {
    product.imageSrc = images.readDataUrl(product.imageName);
    return product;
  });
}

const fetchProductsEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH)
    .flatMap(action =>
      Rx.Observable.zip(
        OpenMarket.get("products_list_all_use_case").findAllWithLowStock({
          limit: action.payload.limit,
          offset: action.payload.offset
        }),
        OpenMarket.get("products_statistics_use_case").countProductsWithLowStock(),
        (products, total) => ({products: withImageSrc(products), total:total, page: action.payload.page})
      ))
     .map(products => listProductActions.listProductFetched(products));

const pageLoadedEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_PAGE_LOADED)
    .map(action => listProductActions.listProductFetch({
      limit: action.payload.limit,
      offset: action.payload.offset,
      page: action.payload.page
    }));


const pageChangedEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_PAGE_CHANGED)
    .map(action => listProductActions.listProductFetch({
      page: action.payload.page,
      limit: action.payload.limit,
      offset: action.payload.offset
    }));

const disableProductEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_DISABLE)
    .flatMap(action =>
      OpenMarket.get("products_disable_use_case").disable({barcode: action.payload.barcode})
        .mergeMap(() => Rx.Observable.of(
          listProductActions.listProductFetch({
            limit: action.payload.limit,
            offset: action.payload.offset,
            page: action.payload.page
          }),
          success({
            title: 'Product disabled',
            message: 'It stays on the catalog and drops out of the low stock list.',
            position: 'tr',
            autoDismiss: 4
          })
        ))
        .catch(disableError => Rx.Observable.of(error({
          title: 'Product was not disabled',
          message: disableError && disableError.message ? disableError.message : 'Product was not disabled',
          position: 'tr',
          autoDismiss: 4
        })))
    );


export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    pageLoadedEpic(action$),
    pageChangedEpic(action$),
    disableProductEpic(action$)
  ).do(data=>null,error=>console.log(error));
