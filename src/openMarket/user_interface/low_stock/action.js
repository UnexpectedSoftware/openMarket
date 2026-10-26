export const LOW_STOCK_COUNT_REQUESTED = 'LOW_STOCK_COUNT_REQUESTED';
export const LOW_STOCK_COUNT_LOADED = 'LOW_STOCK_COUNT_LOADED';
export const LOW_STOCK_COUNT_FAILED = 'LOW_STOCK_COUNT_FAILED';

export const lowStockCountRequested = () => ({type: LOW_STOCK_COUNT_REQUESTED});

/** @param {number} count */
export const lowStockCountLoaded = count => ({type: LOW_STOCK_COUNT_LOADED, count});

export const lowStockCountFailed = () => ({type: LOW_STOCK_COUNT_FAILED});
