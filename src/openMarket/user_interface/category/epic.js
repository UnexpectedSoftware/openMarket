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

const loadCategoriesEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_PAGE_LOADED)
    .flatMap(() => OpenMarket.get("categories_list_all_use_case").findAll())
    .map(categories => categoryActions.categoriesFetched(
      categories
        .map(category => ({
          id: category.id,
          name: category.name,
          imageSrc: images.readDataUrl(category.imageName)
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

export default action$ =>
  Rx.Observable.merge(
    loadCategoriesEpic(action$),
    saveCategoryEpic(action$),
    savedCategoryEpic(action$),
    renameCategoryEpic(action$),
    replaceImageEpic(action$),
    clearImageEpic(action$),
    updatedCategoryEpic(action$)
  );
