export const ORDERS_RANGE_SELECTED = 'ORDERS_RANGE_SELECTED';
export const ORDERS_LOADED = 'ORDERS_LOADED';
export const ORDERS_FAILED = 'ORDERS_FAILED';
export const ORDERS_SUMMARY_LOADED = 'ORDERS_SUMMARY_LOADED';
export const ORDERS_SELECTION_MOVED = 'ORDERS_SELECTION_MOVED';
export const ORDERS_ROW_SELECTED = 'ORDERS_ROW_SELECTED';
export const ORDERS_CUSTOM_OPENED = 'ORDERS_CUSTOM_OPENED';
export const ORDERS_CUSTOM_CLOSED = 'ORDERS_CUSTOM_CLOSED';
export const ORDERS_CUSTOM_DRAFT_CHANGED = 'ORDERS_CUSTOM_DRAFT_CHANGED';
export const ORDERS_CUSTOM_REJECTED = 'ORDERS_CUSTOM_REJECTED';
export const LIST_ORDER_DETAIL = 'LIST_ORDER_DETAIL';
export const LIST_ORDER_DETAIL_LOADED = 'LIST_ORDER_DETAIL_LOADED';

/** @param {{key: string, from: string, to: string, offset: number, limit: number, append: boolean}} payload */
export const ordersRangeSelected = payload => ({type: ORDERS_RANGE_SELECTED, ...payload});

/** @param {{items: object[], total: number, append: boolean}} payload */
export const ordersLoaded = payload => ({type: ORDERS_LOADED, ...payload});

/** @param {string} message */
export const ordersFailed = message => ({type: ORDERS_FAILED, message});

/** @param {{totalCents: number, ticketCount: number, averageCents: number}} summary */
export const ordersSummaryLoaded = summary => ({type: ORDERS_SUMMARY_LOADED, ...summary});

/** @param {number} delta */
export const ordersSelectionMoved = delta => ({type: ORDERS_SELECTION_MOVED, delta});

/** @param {string} orderId */
export const ordersRowSelected = orderId => ({type: ORDERS_ROW_SELECTED, orderId});

export const ordersCustomOpened = () => ({type: ORDERS_CUSTOM_OPENED});

export const ordersCustomClosed = () => ({type: ORDERS_CUSTOM_CLOSED});

/** @param {{field: string, value: string}} payload */
export const ordersCustomDraftChanged = payload => ({type: ORDERS_CUSTOM_DRAFT_CHANGED, ...payload});

/** @param {string} message */
export const ordersCustomRejected = message => ({type: ORDERS_CUSTOM_REJECTED, message});

export const listOrderDetail = payload => ({type: LIST_ORDER_DETAIL, payload});

export const listOrderDetailLoaded = payload => ({type: LIST_ORDER_DETAIL_LOADED, payload});
