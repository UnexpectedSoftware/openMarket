// @flow

export const SHOW_WEIGHTED_DIALOG = 'SHOW_WEIGHTED_DIALOG';
export const HIDE_WEIGHTED_DIALOG = 'HIDE_WEIGHTED_DIALOG';

export const showWeightedDialog = payload => ({ type: SHOW_WEIGHTED_DIALOG, payload});
export const hideWeightedDialog = payload => ({ type: HIDE_WEIGHTED_DIALOG, payload});


