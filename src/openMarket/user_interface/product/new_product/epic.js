import fs from 'fs';
import os from 'os';
import path from 'path';
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import { success, error } from 'react-notification-system-redux';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as newProductActions from "./action";
import {reset} from 'redux-form';
import {makeProductCloseEpic, makeProductSalesEpic} from "./epicFactory";
import {LIST_PRODUCTS_DETAIL_LOADED} from "../list_products/action";
import ImageStore, {dataUrlForFile, imagesDirectory} from "../../../infrastructure/service/ImageStore";

const categoryImages = new ImageStore({directory: imagesDirectory('category-images')});

let fetchedTemp = null;

function unlinkFetchedTemp(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return;
  }
  if (path.basename(imagePath).indexOf('openfoodfacts-') !== 0) {
    return;
  }
  if (path.resolve(path.dirname(imagePath)) !== path.resolve(os.tmpdir())) {
    return;
  }
  try {
    fs.unlinkSync(imagePath);
  } catch (unlinkError) {
    // The copy already succeeded, or a cancelled lookup never wrote the file.
  }
}

function rememberFetched(imagePath) {
  if (fetchedTemp && fetchedTemp !== imagePath) {
    unlinkFetchedTemp(fetchedTemp);
  }
  fetchedTemp = imagePath;
}

function forgetFetched() {
  unlinkFetchedTemp(fetchedTemp);
  fetchedTemp = null;
}

function lookupError(title, message) {
  return error({
    title,
    message,
    position: 'tr',
    autoDismiss: 4
  });
}


const saveProductEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_SAVE)
    .flatMap(action => OpenMarket.get("products_create_or_update_use_case").createOrUpdate({
      id: action.product.id,
      barcode: action.product.barcode,
      name: action.product.name,
      description: action.product.description,
      price: action.product.price,
      basePrice: action.product.basePrice,
      stock: action.product.stock,
      stockMin: action.product.stockMin,
      weighted: action.product.weighted,
      categoryId: action.product.categoryId,
      status: action.product.status,
      imagePath: action.product.imagePath
    })
      .map(() => newProductActions.newProductSaved({ edition: action.product.edition }))
      .catch(saveError => Rx.Observable.of(error({
        title: 'Product was not saved',
        message: saveError && saveError.message ? saveError.message : 'Product was not saved',
        position: 'tr',
        autoDismiss: 4
      }))));

const savedToast = edition => success(edition ? {
  title: 'Changes applied',
  message: 'Your changes were applied',
  position: 'tr',
  autoDismiss: 4
} : {
  title: 'Product saved!',
  message: 'Product saved in database',
  position: 'tr',
  autoDismiss: 4
});

const savedProductEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_SAVED)
    .mergeMap(action => {
      const toast = savedToast(action.edition);
      if (action.edition) {
        return Rx.Observable.of(toast);
      }
      return Rx.Observable.of(
        reset('new_product'),
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses(),
        toast
      );
    });

const fetchCategoriesEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_FETCH_CATEGORIES)
    .flatMap(action => OpenMarket.get("categories_list_all_use_case").findAllWithStats())
    .map(categories => newProductActions.newProductFetchedCategories(
      (categories || [])
        .map(category => ({
          id: category.id,
          name: category.name,
          imageSrc: categoryImages.readDataUrl(category.imageName)
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
    ));


const fetchStatusesEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_FETCH_STATUSES)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAllStatuses())
    .map(statuses => newProductActions.productFetchedStatuses(statuses));


const fetchProductEpic = action$ =>
  action$.ofType(newProductActions.EDIT_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.payload}))
    .map(product => newProductActions.editProductFetched({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: product.price,
      basePrice: product.basePrice,
      stock: product.stock,
      stockMin: product.stockMin,
      weighted: product.isWeighted,
      categoryId: product.category.id,
      status: product.status
    }));

const productPageLoadedEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_PAGE_LOADED)
    .flatMap(action =>
      Rx.Observable.of(
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses()
      )
    );

const newProductLocationLoadedEpic = action$ =>
  action$.ofType(LOCATION_CHANGE)
    .filter(action => action.payload.pathname === '/create_product' && action.payload.search !== '?edition=true' )
    .map(action => newProductActions.productPageLoaded());

const listProductsDetailLoadedEpic = action$ =>
  action$.ofType(LIST_PRODUCTS_DETAIL_LOADED)
    .flatMap(action =>
      Rx.Observable.of(
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses()
      )
    );

const findProductImageEpic = (action$, store) =>
  action$.ofType(newProductActions.FIND_PRODUCT_IMAGE)
    .switchMap(action => {
      const barcode = String(action.barcode || '').trim();
      if (!barcode) {
        return Rx.Observable.of(
          lookupError('Barcode needed', 'Enter a barcode first'),
          newProductActions.productImageLookupFinished()
        );
      }
      const generation = store.getState().newProduct.lookupGeneration;
      return OpenMarket.get('products_find_image_use_case').findByBarcode({barcode})
        .flatMap(imagePath => {
          const page = store.getState().newProduct;
          if (page.lookupGeneration !== generation || page.edition) {
            unlinkFetchedTemp(imagePath);
            return Rx.Observable.empty();
          }
          const imageSrc = imagePath ? dataUrlForFile(imagePath) : null;
          if (!imageSrc) {
            unlinkFetchedTemp(imagePath);
            return Rx.Observable.of(
              lookupError('No image found', 'No image found for this barcode'),
              newProductActions.productImageLookupFinished()
            );
          }
          rememberFetched(imagePath);
          return Rx.Observable.of(newProductActions.productImageFound({imagePath, imageSrc}));
        })
        .catch(() => Rx.Observable.of(
          lookupError('Image lookup failed', 'Could not look up the image'),
          newProductActions.productImageLookupFinished()
        ));
    });

const productSalesEpic = makeProductSalesEpic(
  ({barcode, window}) => OpenMarket.get('product_sale_statistics_use_case').salesOfProduct({barcode, window})
);

const releaseFetchedImageEpic = action$ =>
  action$.ofType(
    newProductActions.PRODUCT_CLOSE,
    newProductActions.PRODUCT_PAGE_LOADED,
    newProductActions.NEW_PRODUCT_SAVED,
    LIST_PRODUCTS_DETAIL_LOADED
  )
    .do(action => {
      if (action.type === newProductActions.NEW_PRODUCT_SAVED && action.edition) {
        return;
      }
      forgetFetched();
    })
    .ignoreElements();

export default (action$, store) =>
  Rx.Observable.merge(
    saveProductEpic(action$),
    savedProductEpic(action$),
    fetchCategoriesEpic(action$),
    fetchStatusesEpic(action$),
    fetchProductEpic(action$),
    productPageLoadedEpic(action$),
    newProductLocationLoadedEpic(action$),
    listProductsDetailLoadedEpic(action$),
    findProductImageEpic(action$, store),
    productSalesEpic(action$),
    releaseFetchedImageEpic(action$)
  ).do(() => null,error => console.log(error),()=> null);
