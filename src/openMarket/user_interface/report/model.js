import {rangeFor} from './ranges';

/**
 * @returns {ReportState}
 */
export function state() {
  const week = rangeFor('week');
  return {
    rangeKey: 'week',
    from: week.from,
    to: week.to,
    loading: true,
    error: '',
    summary: null,
    customOpen: false,
    customFrom: week.from.slice(0, 10),
    customTo: week.to.slice(0, 10),
    customError: ''
  };
}

/**
 * @param {ReportState} current
 * @param {{key: string, from: string, to: string}} action
 * @returns {ReportState}
 */
export function selectRange(current, action) {
  return {
    ...current,
    rangeKey: action.key,
    from: action.from,
    to: action.to,
    loading: true,
    error: '',
    customOpen: false,
    customError: ''
  };
}

/**
 * @param {ReportState} current
 * @param {{summary: object}} action
 * @returns {ReportState}
 */
export function summaryLoaded(current, action) {
  return {
    ...current,
    loading: false,
    error: '',
    summary: action.summary
  };
}

/**
 * @param {ReportState} current
 * @param {{message: string}} action
 * @returns {ReportState}
 */
export function summaryFailed(current, action) {
  return {
    ...current,
    loading: false,
    error: action.message,
    summary: null
  };
}

/**
 * @param {ReportState} current
 * @returns {ReportState}
 */
export function openCustom(current) {
  return {
    ...current,
    customOpen: true,
    customError: '',
    customFrom: current.from.slice(0, 10),
    customTo: current.to.slice(0, 10)
  };
}

/**
 * @param {ReportState} current
 * @returns {ReportState}
 */
export function closeCustom(current) {
  return {...current, customOpen: false, customError: ''};
}

/**
 * @param {ReportState} current
 * @param {{field: 'from'|'to', value: string}} action
 * @returns {ReportState}
 */
export function customChanged(current, action) {
  const next = {...current, customError: ''};
  if (action.field === 'from') {
    next.customFrom = action.value;
  } else {
    next.customTo = action.value;
  }
  return next;
}

/**
 * @param {ReportState} current
 * @param {{message: string}} action
 * @returns {ReportState}
 */
export function customRejected(current, action) {
  return {...current, customError: action.message};
}

/**
 * @typedef {object} ReportState
 * @property {string} rangeKey
 * @property {string} from
 * @property {string} to
 * @property {boolean} loading
 * @property {string} error
 * @property {object | null} summary
 * @property {boolean} customOpen
 * @property {string} customFrom
 * @property {string} customTo
 * @property {string} customError
 */
