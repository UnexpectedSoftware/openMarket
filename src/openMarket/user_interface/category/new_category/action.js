// @flow
export const NEW_CATEGORY_SAVE = 'NEW_CATEGORY_SAVE';
export const NEW_CATEGORY_SAVED = 'NEW_CATEGORY_SAVED';

export const newCategorySave = category => ({ type: NEW_CATEGORY_SAVE,category});
export const newCategorySaved = () => ({ type: NEW_CATEGORY_SAVED });
