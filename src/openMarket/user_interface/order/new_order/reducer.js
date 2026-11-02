import {
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_PRODUCT_QUANTITY_CHANGE,
  NEW_ORDER_PRODUCT_DELETED,
  NEW_ORDER_CLEARED,
  NEW_ORDER_FREE_LINE_ADDED,
  NEW_ORDER_SAVED,
  NEW_ORDER_CLOSED,
  NEW_ORDER_NOTE_LOW_STOCK,
  SALE_TILES_REQUESTED,
  SALE_TILES_LOADED,
  SALE_TILES_FAILED,
  SALE_CATEGORIES_LOADED,
  SALE_CATEGORY_SELECTED,
  SELL_PREFERENCES_LOADED,
  NEXT_INVOICE_LOADED,
  CHECKOUT_OPENED,
  CHECKOUT_CLOSED,
  CHECKOUT_METHOD_CHANGED,
  CHECKOUT_PART_CHANGED,
  CHECKOUT_TENDER_CHANGED,
  REPRINT_OPENED,
  REPRINT_CLOSED,
  NEW_ORDER_SAVE,
  PAYMENT_FAILED,
  PAYMENT_PREVIEW_LOADED,
  REPRINT_PREVIEW_LOADED
} from './action';
import {state as initialState, addProduct, addFreeLine, updateQuantity, removeProduct, clearLines, applyLowStock, sellPreferencesState, openCheckout, closeCheckout, setPayMethod, setMixedPart, setTenderCents} from './model';

/**
 * Keeps the grid, the low-stock set, and the last ticket across a cart edit.
 * @param {object} current
 * @param {object} next
 */
function keep(current, next) {
  return {
    ...next,
    lowStockBarcodes: current.lowStockBarcodes || [],
    lastOrder: current.lastOrder || null,
    tiles: current.tiles || [],
    tilesStatus: current.tilesStatus || 'idle',
    saving: !!current.saving,
    previewHtml: current.previewHtml || '',
    reprintHtml: current.reprintHtml || '',
    categories: current.categories || [],
    categoryId: current.categoryId || null,
    sellPreferences: current.sellPreferences || sellPreferencesState(null),
    nextInvoiceNumber: current.nextInvoiceNumber || '',
    paymentOpen: !!current.paymentOpen,
    payMethod: current.payMethod || 'cash',
    tenderedCents: current.tenderedCents || 0,
    mixedFirst: current.mixedFirst || 'cash',
    mixedSecond: current.mixedSecond || 'card',
    reprintOpen: !!current.reprintOpen
  };
}

/**
 * Line adds, quantity edits, and deletes. Null leaves the action to the screen reducer.
 * @param {object} current
 * @param {{type: string, payload?: object, barcode?: string, index?: number}} action
 * @returns {object | null}
 */
function editLines(current, action) {
  const lines = current.order.lines;
  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      return keep(current, addProduct({
        lines,
        product: action.payload.product,
        quantity: action.payload.quantity,
        lowStockBarcodes: current.lowStockBarcodes,
        replace: action.payload.replace
      }));

    case NEW_ORDER_FREE_LINE_ADDED:
      return keep(current, addFreeLine({
        lines,
        description: action.payload.description,
        amount: action.payload.amount,
        vatRate: action.payload.vatRate
      }));

    case NEW_ORDER_PRODUCT_QUANTITY_CHANGE:
      return keep(current, updateQuantity({
        barcode: action.payload.barcode,
        quantity: action.payload.quantityChanged,
        lines
      }));

    case NEW_ORDER_PRODUCT_DELETED:
      return keep(current, removeProduct({
        lines,
        barcode: action.barcode,
        index: action.index
      }));

    case NEW_ORDER_CLEARED:
      return keep(current, clearLines());

    default:
      return null;
  }
}

export default function reducer(current = initialState(), action) {
  const edited = editLines(current, action);
  if (edited) {
    return edited;
  }
  switch (action.type) {
    case NEW_ORDER_NOTE_LOW_STOCK:
      return applyLowStock(current, action.payload);

    case SALE_TILES_REQUESTED:
      return {...current, tilesStatus: 'loading'};

    case SALE_TILES_LOADED:
      return {...current, tiles: action.payload || [], tilesStatus: 'ready'};

    case SALE_TILES_FAILED:
      return {...current, tilesStatus: 'error'};

    case SALE_CATEGORIES_LOADED:
      return {...current, categories: action.payload || []};

    case SALE_CATEGORY_SELECTED:
      return {...current, categoryId: action.categoryId || null};

    case SELL_PREFERENCES_LOADED:
      return {...current, sellPreferences: sellPreferencesState(action.payload)};

    case NEXT_INVOICE_LOADED:
      return {...current, nextInvoiceNumber: action.payload ? String(action.payload) : ''};

    case CHECKOUT_OPENED:
      return openCheckout(current);

    case CHECKOUT_CLOSED:
      return closeCheckout(current);

    case CHECKOUT_METHOD_CHANGED:
      return setPayMethod(current, action.method);

    case CHECKOUT_PART_CHANGED:
      return setMixedPart(current, action.slot, action.method);

    case CHECKOUT_TENDER_CHANGED:
      return setTenderCents(current, action.cents);

    case REPRINT_OPENED:
      return {...current, reprintOpen: true};

    case REPRINT_CLOSED:
      return {...current, reprintOpen: false};

    case NEW_ORDER_SAVE:
      return {...current, saving: true};

    case PAYMENT_FAILED:
      return {...current, saving: false};

    case PAYMENT_PREVIEW_LOADED:
      return {...current, previewHtml: action.payload || ''};

    case REPRINT_PREVIEW_LOADED:
      return {...current, reprintHtml: action.payload || ''};

    case NEW_ORDER_SAVED:
      return {
        ...initialState(),
        lowStockBarcodes: current.lowStockBarcodes || [],
        lastOrder: action.payload || null,
        tiles: current.tiles || [],
        tilesStatus: current.tilesStatus || 'idle',
        categories: current.categories || [],
        categoryId: current.categoryId || null,
        sellPreferences: current.sellPreferences || sellPreferencesState(null),
        nextInvoiceNumber: ''
      };

    case NEW_ORDER_CLOSED:
      return {
        ...initialState(),
        sellPreferences: current.sellPreferences || sellPreferencesState(null)
      };

    default:
      return current;
  }
}
