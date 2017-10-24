export const SHOW_NEW_PRODUCT_DIALOG = 'SHOW_NEW_PRODUCT_DIALOG';
export const HIDE_NEW_PRODUCT_DIALOG = 'HIDE_NEW_PRODUCT_DIALOG';
export const NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG = 'NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG';

export const showNewProductDialog = payload => ({ type: SHOW_NEW_PRODUCT_DIALOG, payload});
export const newProductSaveButtonClickedDialog = payload => ({ type: NEW_PRODUCT_SAVE_BUTTON_CLICKED_DIALOG, payload});
export const hideNewProductDialog = () => ({ type: HIDE_NEW_PRODUCT_DIALOG });


