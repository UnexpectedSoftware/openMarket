// @flow

export const SHOW_PRINTER_DIALOG = 'SHOW_PRINTER_DIALOG';
export const HIDE_PRINTER_DIALOG = 'HIDE_PRINTER_DIALOG';

export const showPrinterDialog = payload => ({ type: SHOW_PRINTER_DIALOG, payload});
export const hidePrinterDialog = payload => ({ type: HIDE_PRINTER_DIALOG, payload});


