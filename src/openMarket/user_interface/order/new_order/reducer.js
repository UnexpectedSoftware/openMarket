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
  NEW_ORDER_SAVE,
  PAYMENT_FAILED,
  PAYMENT_PREVIEW_LOADED,
  REPRINT_PREVIEW_LOADED
} from './action';
import {state as initialState, addProduct, addFreeLine, updateQuantity, removeProduct, clearLines, applyLowStock} from './model';

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
    categoryId: current.categoryId || null
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
        categoryId: current.categoryId || null
      };

    case NEW_ORDER_CLOSED:
      return initialState();

    default:
      return current;
  }
}
