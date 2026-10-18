import * as newProductDialogActions from "./action";
import * as newOrderActions from "../new_order/action";
import * as Rx from "rxjs";
import {toast} from "../../components/toast";


export const makeNewProductDialogEpic = action$ =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_PRODUCT_NOT_FOUND)
    .map(action => newProductDialogActions.showNewProductDialog(action.payload));


export const makeNewProductSavedDialogEpic = productCreateUseCase => configuration => action$ =>
  action$
    .filter(action => action.type === newProductDialogActions.NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG)
    .flatMap(action => productCreateUseCase.createOrUpdate({
        barcode: action.payload.barcode,
        name: action.payload.name,
        description: configuration.description,
        price: action.payload.price,
        basePrice: configuration.basePrice,
        stock: configuration.stock,
        stockMin: configuration.stockMin,
        weighted: configuration.weighted,
        categoryId: configuration.categoryId,
        status: configuration.status
      })
      .flatMap(() => Rx.Observable.of(
        newOrderActions.newOrderProductFetch(action.payload.barcode),
        newProductDialogActions.hideNewProductDialog(),
        toast.success('Product saved!', 'Product saved in database')
      ))
    );


