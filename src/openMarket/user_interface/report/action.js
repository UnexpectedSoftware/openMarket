export const REPORT_RANGE_SELECTED = 'REPORT_RANGE_SELECTED';
export const REPORT_SUMMARY_LOADED = 'REPORT_SUMMARY_LOADED';
export const REPORT_SUMMARY_FAILED = 'REPORT_SUMMARY_FAILED';
export const REPORT_CUSTOM_OPENED = 'REPORT_CUSTOM_OPENED';
export const REPORT_CUSTOM_CLOSED = 'REPORT_CUSTOM_CLOSED';
export const REPORT_CUSTOM_CHANGED = 'REPORT_CUSTOM_CHANGED';
export const REPORT_CUSTOM_REJECTED = 'REPORT_CUSTOM_REJECTED';

/**
 * @param {{key: string, from: string, to: string}} range
 */
export const reportRangeSelected = range => ({type: REPORT_RANGE_SELECTED, ...range});

/**
 * @param {object} summary
 */
export const reportSummaryLoaded = summary => ({type: REPORT_SUMMARY_LOADED, summary});

/**
 * @param {string} message
 */
export const reportSummaryFailed = message => ({type: REPORT_SUMMARY_FAILED, message});

export const reportCustomOpened = () => ({type: REPORT_CUSTOM_OPENED});

export const reportCustomClosed = () => ({type: REPORT_CUSTOM_CLOSED});

/**
 * @param {{field: 'from'|'to', value: string}} draft
 */
export const reportCustomChanged = draft => ({type: REPORT_CUSTOM_CHANGED, ...draft});

/**
 * @param {string} message
 */
export const reportCustomRejected = message => ({type: REPORT_CUSTOM_REJECTED, message});
