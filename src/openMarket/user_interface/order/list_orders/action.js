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
export const ORDER_DETAIL_REQUESTED = 'ORDER_DETAIL_REQUESTED';
export const ORDER_DETAIL_LOADED = 'ORDER_DETAIL_LOADED';
export const ORDER_DETAIL_FAILED = 'ORDER_DETAIL_FAILED';
export const ORDER_REPRINT_REQUESTED = 'ORDER_REPRINT_REQUESTED';
export const ORDER_REPRINT_PREVIEW_LOADED = 'ORDER_REPRINT_PREVIEW_LOADED';
export const ORDER_REPRINT_CLOSED = 'ORDER_REPRINT_CLOSED';
export const ORDER_REPRINT_CONFIRMED = 'ORDER_REPRINT_CONFIRMED';
export const ORDER_REPRINT_FINISHED = 'ORDER_REPRINT_FINISHED';
export const ORDER_REPRINT_FAILED = 'ORDER_REPRINT_FAILED';

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

/** @param {string} id */
export const orderDetailRequested = id => ({type: ORDER_DETAIL_REQUESTED, id});

/** @param {{id: string, detail: object | null}} payload */
export const orderDetailLoaded = payload => ({type: ORDER_DETAIL_LOADED, ...payload});

/** @param {{id: string, message: string}} payload */
export const orderDetailFailed = payload => ({type: ORDER_DETAIL_FAILED, ...payload});

/** @param {string} orderId */
export const orderReprintRequested = orderId => ({type: ORDER_REPRINT_REQUESTED, orderId});

/** @param {{orderId: string, html: string}} payload */
export const orderReprintPreviewLoaded = payload => ({type: ORDER_REPRINT_PREVIEW_LOADED, ...payload});

export const orderReprintClosed = () => ({type: ORDER_REPRINT_CLOSED});

/** @param {string} orderId */
export const orderReprintConfirmed = orderId => ({type: ORDER_REPRINT_CONFIRMED, orderId});

/** @param {{orderId: string}} payload */
export const orderReprintFinished = payload => ({type: ORDER_REPRINT_FINISHED, ...payload});

/** @param {{orderId: string, message: string}} payload */
export const orderReprintFailed = payload => ({type: ORDER_REPRINT_FAILED, ...payload});
