import {
  NEW_ORDER_PRODUCT_FETCHED,
  NEW_ORDER_PRODUCT_QUANTITY_CHANGE,
  NEW_ORDER_PRODUCT_DELETED,
  NEW_ORDER_FREE_LINE_ADDED,
  NEW_ORDER_SAVED,
  NEW_ORDER_CLOSED,
  NEW_ORDER_NOTE_LOW_STOCK,
  SALE_TILES_REQUESTED,
  SALE_TILES_LOADED,
  SALE_TILES_FAILED,
  NEW_ORDER_SAVE,
  PAYMENT_FAILED,
  PAYMENT_PREVIEW_LOADED,
  REPRINT_PREVIEW_LOADED
} from './action';
import {state as initialState, addProduct, addFreeLine, updateQuantity, removeProduct, loadOrder} from './model';
import {LIST_ORDER_DETAIL_LOADED} from '../list_orders/action';
import {LOCATION_CHANGE} from 'react-router-redux';

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
    reprintHtml: current.reprintHtml || ''
  };
}

export default function reducer(current = initialState(), action) {
  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      return keep(current, addProduct({
        lines: current.order.lines,
        product: action.payload.product,
        quantity: action.payload.quantity,
        lowStockBarcodes: current.lowStockBarcodes,
        replace: action.payload.replace
      }));

    case NEW_ORDER_FREE_LINE_ADDED:
      return keep(current, addFreeLine({
        lines: current.order.lines,
        description: action.payload.description,
        amount: action.payload.amount,
        vatRate: action.payload.vatRate
      }));

    case NEW_ORDER_PRODUCT_QUANTITY_CHANGE:
      return keep(current, updateQuantity({
        barcode: action.payload.barcode,
        quantity: action.payload.quantityChanged,
        lines: current.order.lines
      }));

    case NEW_ORDER_PRODUCT_DELETED:
      return keep(current, removeProduct({
        lines: current.order.lines,
        barcode: action.barcode,
        index: action.index
      }));

    case NEW_ORDER_NOTE_LOW_STOCK: {
      const barcode = action.payload && action.payload.barcode;
      const known = current.lowStockBarcodes || [];
      if (!barcode || known.indexOf(barcode) !== -1) {
        return current;
      }
      return {...current, lowStockBarcodes: known.concat(barcode)};
    }

    case SALE_TILES_REQUESTED:
      return {...current, tilesStatus: 'loading'};

    case SALE_TILES_LOADED:
      return {...current, tiles: action.payload || [], tilesStatus: 'ready'};

    case SALE_TILES_FAILED:
      return {...current, tilesStatus: 'error'};

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
        tilesStatus: current.tilesStatus || 'idle'
      };

    case LIST_ORDER_DETAIL_LOADED:
      return keep(current, loadOrder({order: action.payload}));

    case NEW_ORDER_CLOSED:
      return initialState();

    case LOCATION_CHANGE:
      // hashHistory emits POP right after the nav-rail PUSH, once the grid has loaded.
      if (action.payload.action === 'POP') {
        return {
          ...initialState(),
          lowStockBarcodes: current.lowStockBarcodes || [],
          lastOrder: current.lastOrder || null,
          tiles: current.tiles || [],
          tilesStatus: current.tilesStatus || 'idle'
        };
      }
      return current;

    default:
      return current;
  }
}
