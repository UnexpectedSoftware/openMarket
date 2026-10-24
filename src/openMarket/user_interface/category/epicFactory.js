import * as Rx from 'rxjs';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import CategoriesQuery from '../../domain/category/CategoriesQuery';
import ErrorCode from '../../domain/error/ErrorCode';
import {record, userText} from '../../infrastructure/logging/ErrorLog';
import {toast} from '../components/toast';
import {
  CATEGORIES_DELETE,
  CATEGORIES_PAGE_LOADED,
  CATEGORIES_QUERY_CHANGED,
  CATEGORIES_SAVE,
  categoriesDeleted,
  categoriesFailed,
  categoriesLoaded,
  categoriesPageLoaded,
  categoriesSaveFailed,
  categoriesSaved
} from './action';
import {LOAD_ERROR, NOT_FOUND, SAVE_ERROR, trimmedName} from './model';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Latest search wins. Typing waits 300 ms. Opening the page does not.
 * @param {{list: Function}} listCategories
 */
export function makeCategoriesListEpic(listCategories) {
  return (action$, store) => {
    const immediate = action$.filter(action => action.type === CATEGORIES_PAGE_LOADED);
    const typed = action$
      .filter(action => action.type === CATEGORIES_QUERY_CHANGED)
      .debounceTime(SEARCH_DEBOUNCE_MS);
    return Rx.Observable.merge(immediate, typed)
      .switchMap(() => loadCategories(listCategories, store));
  };
}

/**
 * @param {{createCategory: Function}} createCategory
 * @param {{updateCategory: Function, replaceImage: Function, removeImage: Function}} updateCategory
 */
export function makeCategorySaveEpic(createCategory, updateCategory) {
  return (action$, store) => action$
    .filter(action => action.type === CATEGORIES_SAVE)
    .exhaustMap(() => submitDialog(createCategory, updateCategory, readPage(store)));
}

/**
 * @param {{deleteCategory: Function}} deleteCategory
 */
export function makeCategoryDeleteEpic(deleteCategory) {
  return action$ => action$
    .filter(action => action.type === CATEGORIES_DELETE)
    .exhaustMap(action => deleteCategory.deleteCategory({id: action.id})
      .mergeMap(() => Rx.Observable.of(
        categoriesDeleted(),
        categoriesPageLoaded(),
        deletedToast()
      ))
      .catch(error => deleteFailed(error)));
}

/**
 * @param {{list: Function}} listCategories
 * @param {{getState: Function}} store
 */
function loadCategories(listCategories, store) {
  const page = readPage(store);
  return listCategories.list(criteriaFor(page))
    .map(result => categoriesLoaded({
      items: (result.items || []).map(viewFields),
      total: result.total
    }))
    .catch(error => loadFailed(error));
}

/**
 * @param {Error} error
 */
function loadFailed(error) {
  record(error);
  return Rx.Observable.of(categoriesFailed(userText(error, LOAD_ERROR)));
}

/**
 * @param {{getState: Function}} store
 */
function readPage(store) {
  const root = store && store.getState ? store.getState() : {};
  return root.categoriesPage || {};
}

/**
 * @param {object} page
 * @returns {CategoriesQuery}
 */
function criteriaFor(page) {
  return new CategoriesQuery({text: String(page.text || '').trim()});
}

/**
 * @param {object} item
 */
function viewFields(item) {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl == null ? null : item.imageUrl,
    productCount: item.productCount,
    stockTotal: item.stockTotal,
    basePriceCents: item.basePriceCents,
    mostSold: copiedMostSold(item.mostSold)
  };
}

/**
 * @param {{barcode: string, name: string, quantity: number} | null | undefined} mostSold
 */
function copiedMostSold(mostSold) {
  if (!mostSold) {
    return null;
  }
  return {
    barcode: mostSold.barcode,
    name: mostSold.name,
    quantity: mostSold.quantity
  };
}

/**
 * @param {{createCategory: Function}} createCategory
 * @param {{updateCategory: Function, replaceImage: Function, removeImage: Function}} updateCategory
 * @param {object} page
 */
function submitDialog(createCategory, updateCategory, page) {
  const dialog = page.dialog;
  if (refusesSave(dialog)) {
    return Rx.Observable.empty();
  }
  const name = trimmedName(dialog.name);
  return requestFor(createCategory, updateCategory, page, dialog, name)
    .mergeMap(() => Rx.Observable.of(
      categoriesSaved(),
      categoriesPageLoaded(),
      savedToast(dialog.mode)
    ))
    .catch(error => failedSave(error));
}

/**
 * @param {object | null | undefined} dialog
 * @returns {boolean}
 */
function refusesSave(dialog) {
  return !dialog || !trimmedName(dialog.name) || !!dialog.fileError;
}

/**
 * @param {{createCategory: Function}} createCategory
 * @param {{updateCategory: Function, replaceImage: Function, removeImage: Function}} updateCategory
 * @param {object} page
 * @param {object} dialog
 * @param {string} name
 */
function requestFor(createCategory, updateCategory, page, dialog, name) {
  if (dialog.mode === 'edit') {
    return editRequest(updateCategory, page, dialog, name);
  }
  return createCategory.createCategory({
    name,
    imagePath: dialog.imagePath || null
  });
}

/**
 * @param {{updateCategory: Function, replaceImage: Function, removeImage: Function}} updateCategory
 * @param {object} page
 * @param {object} dialog
 * @param {string} name
 */
function editRequest(updateCategory, page, dialog, name) {
  return editSteps(updateCategory, page, dialog, name).reduce(
    (chain, step) => chain.mergeMap(() => step),
    Rx.Observable.of(null)
  );
}

/**
 * @param {{updateCategory: Function, replaceImage: Function, removeImage: Function}} updateCategory
 * @param {object} page
 * @param {object} dialog
 * @param {string} name
 */
function editSteps(updateCategory, page, dialog, name) {
  const steps = [];
  if (name !== storedName(page, dialog.id)) {
    steps.push(updateCategory.updateCategory({id: dialog.id, name}));
  }
  if (dialog.imagePath) {
    steps.push(updateCategory.replaceImage({id: dialog.id, imagePath: dialog.imagePath}));
  } else if (dialog.clearImage) {
    steps.push(updateCategory.removeImage({id: dialog.id}));
  }
  return steps;
}

/**
 * @param {object} page
 * @param {string} id
 * @returns {string}
 */
function storedName(page, id) {
  const found = (page.items || []).filter(item => item.id === id)[0];
  return found ? found.name : '';
}

/**
 * @param {string} mode
 */
function savedToast(mode) {
  if (mode === 'edit') {
    return toast.success('Cambios aplicados', 'La categoría queda actualizada');
  }
  return toast.success('Categoría guardada', 'La categoría queda en el listado');
}

/**
 * @param {Error} error
 */
function failedSave(error) {
  record(error);
  return Rx.Observable.of(categoriesSaveFailed(saveMessage(error)));
}

/**
 * @param {*} error
 * @returns {string}
 */
function saveMessage(error) {
  if (error && error.code === ErrorCode.CATEGORY_NOT_FOUND) {
    return NOT_FOUND;
  }
  return userText(error, SAVE_ERROR);
}

function deletedToast() {
  return toast.success('Categoría eliminada', 'La categoría ya no está en el listado');
}

/**
 * @param {Error} error
 */
function deleteFailed(error) {
  record(error);
  return Rx.Observable.of(toast.error(
    'No se ha podido eliminar la categoría',
    userText(error, 'No se ha podido eliminar la categoría')
  ));
}
