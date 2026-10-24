import * as Rx from 'rxjs';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/ignoreElements';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import ProductDetailQuery from '../../../domain/product/ProductDetailQuery';
import {userText} from '../../../infrastructure/logging/ErrorLog';
import {toast} from '../../components/toast';
import {
  PRODUCTS_ARCHIVE,
  PRODUCTS_DRAWER_CLOSED,
  PRODUCTS_DRAWER_OPENED,
  PRODUCTS_IMAGE_REQUESTED,
  PRODUCTS_SAVE,
  PRODUCTS_SAVED,
  listProductsFetch,
  productsArchived,
  productsDetailLoaded,
  productsDrawerFailed,
  productsImageFound,
  productsImageMissed,
  productsSaveFailed,
  productsSaved
} from './action';
import {draftErrors, draftFromDetail, saveCommand} from './model';
import {forgetFetched, rememberFetched, unlinkFetchedTemp} from './lookupTemp';

const SAVE_ERROR = 'No se ha podido guardar el producto';
const OPEN_ERROR = 'No se ha podido abrir el producto';
const MISSING = 'No se ha encontrado el producto';
const ARCHIVE_ERROR = 'No se ha podido desactivar el producto';

/**
 * Loads the edit draft. Create opens with an empty draft in the reducer.
 * @param {{detail: Function}} listProducts
 */
export function makeDetailEpic(listProducts) {
  return action$ => action$
    .filter(action => action.type === PRODUCTS_DRAWER_OPENED && action.payload && action.payload.mode === 'edit')
    .switchMap(action => loadDetail(listProducts, action.payload.barcode));
}

/**
 * @param {{createOrUpdate: Function}} createOrUpdate
 */
export function makeSaveEpic(createOrUpdate) {
  return (action$, store) => action$
    .filter(action => action.type === PRODUCTS_SAVE)
    .mergeMap(action => saveDraft(createOrUpdate, action, readPage(store)));
}

/** Toast and reload after a product is stored. */
export function makeSavedEpic() {
  return action$ => action$
    .filter(action => action.type === PRODUCTS_SAVED)
    .mergeMap(() => Rx.Observable.of(
      toast.success('Producto guardado', 'Los cambios ya están en el catálogo'),
      listProductsFetch()
    ));
}

/**
 * Disables the product. Does not call enableForSale: that path adds one unit on a scan.
 * @param {{disable: Function}} disableProduct
 */
export function makeArchiveEpic(disableProduct) {
  return action$ => action$
    .filter(action => action.type === PRODUCTS_ARCHIVE)
    .mergeMap(action => disableProduct.disable({barcode: action.payload.barcode})
      .mergeMap(() => Rx.Observable.of(
        productsArchived(action.payload.barcode),
        toast.success('Producto desactivado', 'Sigue en el catálogo y sale de la venta.')
      ))
      .catch(error => Rx.Observable.of(productsSaveFailed({
        message: userText(error, ARCHIVE_ERROR),
        code: error && error.code
      }))));
}

/**
 * Looks up a photo on create. The detail row already carries imageUrl on edit.
 * @param {{findByBarcode: Function}} findImage
 */
export function makeImageEpic(findImage) {
  return (action$, store) => action$
    .filter(action => action.type === PRODUCTS_IMAGE_REQUESTED)
    .switchMap(() => lookupImage(findImage, store));
}

/** Drops a downloaded temp file when the drawer closes or the product is saved. */
export function makeReleaseImageEpic() {
  return action$ => action$
    .filter(action => action.type === PRODUCTS_DRAWER_CLOSED || action.type === PRODUCTS_SAVED)
    .do(() => forgetFetched())
    .ignoreElements();
}

/**
 * @param {{detail: Function}} listProducts
 * @param {string} barcode
 */
function loadDetail(listProducts, barcode) {
  return listProducts.detail(new ProductDetailQuery({barcode}))
    .map(detail => productsDetailLoaded({barcode, draft: draftFromDetail(detail)}))
    .defaultIfEmpty(productsDrawerFailed({barcode, message: MISSING}))
    .catch(error => Rx.Observable.of(productsDrawerFailed({
      barcode,
      message: userText(error, OPEN_ERROR)
    })));
}

/**
 * @param {{createOrUpdate: Function}} createOrUpdate
 * @param {{payload?: {imagePath?: string | null}}} action
 * @param {object} page
 */
function saveDraft(createOrUpdate, action, page) {
  const errors = draftErrors(page.draft, page.mode);
  if (Object.keys(errors).length) {
    return Rx.Observable.of(productsSaveFailed({errors}));
  }
  const imagePath = action.payload && action.payload.imagePath;
  return createOrUpdate.createOrUpdate(saveCommand(page.draft, imagePath))
    .map(() => productsSaved())
    .defaultIfEmpty(productsSaveFailed({errors: {categoryId: 'Obligatorio'}}))
    .catch(error => Rx.Observable.of(productsSaveFailed({
      message: userText(error, SAVE_ERROR),
      code: error && error.code
    })));
}

/**
 * @param {{findByBarcode: Function}} findImage
 * @param {object} page
 */
function lookupImage(findImage, store) {
  const page = readPage(store);
  if (!page.drawerOpen || page.mode !== 'create') {
    return Rx.Observable.empty();
  }
  const barcode = String(page.draft && page.draft.barcode || '').trim();
  if (!barcode) {
    return Rx.Observable.of(productsSaveFailed({errors: {barcode: 'Obligatorio'}}));
  }
  return findImage.findByBarcode({barcode})
    .map(found => foundImage(readPage(store), found))
    .defaultIfEmpty(productsImageMissed())
    .catch(error => Rx.Observable.of(productsImageMissed(userText(error, 'No se ha encontrado la imagen'))));
}

/**
 * @param {object} page
 * @param {{imagePath?: string, imageUrl?: string | null} | null} found
 */
function foundImage(page, found) {
  if (!found || !found.imagePath) {
    return productsImageMissed();
  }
  if (!page.drawerOpen || page.mode !== 'create') {
    unlinkFetchedTemp(found.imagePath);
    return productsImageMissed('');
  }
  rememberFetched(found.imagePath);
  return productsImageFound({imagePath: found.imagePath, imageUrl: found.imageUrl || null});
}

/**
 * @param {{getState?: Function}} store
 */
function readPage(store) {
  const state = store && store.getState ? store.getState() : {};
  return state.listProducts || {};
}
