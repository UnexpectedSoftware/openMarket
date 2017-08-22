// @flow

export const DIALOG_SHOW = 'DIALOG_SHOW';
export const DIALOG_HIDE = 'DIALOG_HIDE';

export const dialogShow = payload => ({ type: DIALOG_SHOW, payload });
export const dialogHide = () => ({ type: DIALOG_HIDE });


