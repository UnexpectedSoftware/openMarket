import OpenMarket from "../../application/index";
import * as Rx from "rxjs";
import { success, error } from 'react-notification-system-redux';
import * as categoryActions from "./action";
import ImageStore, {imagesDirectory} from "../../infrastructure/service/ImageStore";

const images = new ImageStore({directory: imagesDirectory('category-images')});

const applied = () => success({
  title: 'Changes applied',
  message: 'Your changes were applied',
  position: 'tr',
  autoDismiss: 4
});

function failureActions(id, saveError) {
  const message = saveError && saveError.message ? saveError.message : 'Category was not saved';
  return Rx.Observable.of(
    categoryActions.categoriesChangeFailed(id, message),
    error({
      title: 'Category was not saved',
      message,
      position: 'tr',
      autoDismiss: 4
    })
  );
}

function deleteFailureActions(id, saveError) {
  const message = saveError && saveError.message ? saveError.message : 'Category was not deleted';
  return Rx.Observable.of(
    categoryActions.categoriesChangeFailed(id, message),
    error({
      title: 'Category was not deleted',
      message,
      position: 'tr',
      autoDismiss: 4
    })
  );
}

const loadCategoriesEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_PAGE_LOADED)
    .flatMap(() => OpenMarket.get("categories_list_all_use_case").findAllWithStats())
    .map(categories => categoryActions.categoriesFetched(
      categories
        .map(category => ({
          id: category.id,
          name: category.name,
          imageSrc: images.readDataUrl(category.imageName),
          productCount: category.productCount,
          stockTotal: category.stockTotal,
          basePriceTotal: category.basePriceTotal,
          mostSold: category.mostSold
            ? {name: category.mostSold.name, barcode: category.mostSold.barcode}
            : null
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
    ));

const saveCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_SAVE)
    .flatMap(action => OpenMarket.get("categories_create_use_case").createCategory({
      name: action.category.name,
      imagePath: action.category.imagePath
    })
      .map(() => categoryActions.categoriesSaved())
      .catch(saveError => failureActions(null, saveError)));

const savedCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_SAVED)
    .flatMap(() => Rx.Observable.of(
      categoryActions.categoriesPageLoaded(),
      success({
        title: 'Category saved!',
        message: 'Category saved in database',
        position: 'tr',
        autoDismiss: 4
      })
    ));

const renameCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_RENAME)
    .flatMap(action => OpenMarket.get("categories_update_use_case").updateCategory({
      id: action.id,
      name: action.name
    })
      .map(() => categoryActions.categoriesUpdated())
      .catch(saveError => failureActions(action.id, saveError)));

const replaceImageEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_IMAGE_REPLACE)
    .flatMap(action => OpenMarket.get("categories_update_use_case").replaceImage({
      id: action.id,
      imagePath: action.imagePath
    })
      .map(() => categoryActions.categoriesUpdated())
      .catch(saveError => failureActions(action.id, saveError)));

const clearImageEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_IMAGE_CLEAR)
    .flatMap(action => OpenMarket.get("categories_update_use_case").removeImage({
      id: action.id
    })
      .map(() => categoryActions.categoriesUpdated())
      .catch(saveError => failureActions(action.id, saveError)));

const updatedCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_UPDATED)
    .flatMap(() => Rx.Observable.of(
      categoryActions.categoriesPageLoaded(),
      applied()
    ));

const deleteCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_DELETE)
    .flatMap(action => OpenMarket.get("categories_delete_use_case").deleteCategory({
      id: action.id
    })
      .map(() => categoryActions.categoriesDeleted())
      .catch(saveError => deleteFailureActions(action.id, saveError)));

const deletedCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_DELETED)
    .flatMap(() => Rx.Observable.of(
      categoryActions.categoriesPageLoaded(),
      success({
        title: 'Category deleted',
        message: 'Category deleted from database',
        position: 'tr',
        autoDismiss: 4
      })
    ));

export default action$ =>
  Rx.Observable.merge(
    loadCategoriesEpic(action$),
    saveCategoryEpic(action$),
    savedCategoryEpic(action$),
    renameCategoryEpic(action$),
    replaceImageEpic(action$),
    clearImageEpic(action$),
    updatedCategoryEpic(action$),
    deleteCategoryEpic(action$),
    deletedCategoryEpic(action$)
  );
