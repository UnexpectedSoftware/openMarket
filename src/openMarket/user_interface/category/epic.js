import OpenMarket from "../../application/index";
import * as Rx from "rxjs";
import { reset } from 'redux-form';
import { success, error } from 'react-notification-system-redux';
import * as categoryActions from "./action";
import ImageStore, {imagesDirectory} from "../../infrastructure/service/ImageStore";

const images = new ImageStore({directory: imagesDirectory('category-images')});

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
      .catch(saveError => Rx.Observable.of(error({
        title: 'Category was not saved',
        message: saveError && saveError.message ? saveError.message : 'Category was not saved',
        position: 'tr',
        autoDismiss: 4
      }))));

const savedCategoryEpic = action$ =>
  action$.ofType(categoryActions.CATEGORIES_SAVED)
    .flatMap(() => Rx.Observable.of(
      reset('categories'),
      categoryActions.categoriesFormCleared(),
      categoryActions.categoriesPageLoaded(),
      success({
        title: 'Category saved!',
        message: 'Category saved in database',
        position: 'tr',
        autoDismiss: 4
      })
    ));

export default action$ =>
  Rx.Observable.merge(
    loadCategoriesEpic(action$),
    saveCategoryEpic(action$),
    savedCategoryEpic(action$)
  );
