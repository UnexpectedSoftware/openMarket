import {rangeFor} from './ranges';

export const PAGE_SIZE = 20;

const EMPTY_SUMMARY = {totalCents: 0, ticketCount: 0, averageCents: 0};

export function state() {
  const today = rangeFor('today');
  return {
    rangeKey: 'today',
    from: today.from,
    to: today.to,
    offset: 0,
    limit: PAGE_SIZE,
    items: [],
    total: 0,
    summary: EMPTY_SUMMARY,
    loading: true,
    loadingMore: false,
    error: '',
    selectedOrderId: null,
    customOpen: false,
    customFrom: today.from.slice(0, 10),
    customTo: today.to.slice(0, 10),
    customError: ''
  };
}

/**
 * @param {object} current
 * @param {{key: string, from: string, to: string, offset?: number, limit?: number, append?: boolean}} action
 */
export function selectRange(current, action) {
  const append = action.append === true;
  return {
    ...current,
    rangeKey: action.key,
    from: action.from,
    to: action.to,
    offset: action.offset || 0,
    limit: action.limit || current.limit,
    loading: !append,
    loadingMore: append,
    error: '',
    customOpen: false,
    customError: '',
    items: append ? current.items : [],
    summary: append ? current.summary : EMPTY_SUMMARY,
    selectedOrderId: append ? current.selectedOrderId : null
  };
}

/**
 * @param {object} current
 * @param {{items?: object[], total: number, append?: boolean}} action
 */
export function ordersLoaded(current, action) {
  const incoming = action.items || [];
  const items = action.append === true ? current.items.concat(incoming) : incoming;
  return {
    ...current,
    items,
    total: action.total,
    loading: false,
    loadingMore: false,
    error: '',
    selectedOrderId: keptSelection(items, current.selectedOrderId)
  };
}

/**
 * @param {object[]} items
 * @param {string | null} selectedOrderId
 * @returns {string | null}
 */
function keptSelection(items, selectedOrderId) {
  const stillThere = items.some(item => item.orderId === selectedOrderId);
  if (stillThere) {
    return selectedOrderId;
  }
  return items.length ? items[0].orderId : null;
}

/**
 * @param {object} current
 * @param {{message?: string}} action
 */
export function ordersFailed(current, action) {
  return {
    ...current,
    loading: false,
    loadingMore: false,
    error: action.message || 'No se han podido cargar los pedidos'
  };
}

/**
 * @param {object} current
 * @param {{totalCents: number, ticketCount: number, averageCents: number}} action
 */
export function summaryLoaded(current, action) {
  return {
    ...current,
    summary: {
      totalCents: action.totalCents,
      ticketCount: action.ticketCount,
      averageCents: action.averageCents
    }
  };
}

/**
 * @param {object} current
 * @param {number} delta
 */
export function moveSelection(current, delta) {
  const items = current.items || [];
  if (!items.length) {
    return current;
  }
  const index = items.findIndex(item => item.orderId === current.selectedOrderId);
  const next = clamp(index < 0 ? -1 + delta : index + delta, items.length);
  if (items[next].orderId === current.selectedOrderId) {
    return current;
  }
  return {...current, selectedOrderId: items[next].orderId};
}

/**
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
function clamp(index, length) {
  if (index < 0) {
    return 0;
  }
  if (index >= length) {
    return length - 1;
  }
  return index;
}

/** @param {object} current */
export function customOpened(current) {
  return {
    ...current,
    customOpen: true,
    customFrom: String(current.from).slice(0, 10),
    customTo: String(current.to).slice(0, 10),
    customError: ''
  };
}

/** @param {object} current */
export function customClosed(current) {
  return {...current, customOpen: false, customError: ''};
}

/**
 * @param {object} current
 * @param {{field?: string, value: string}} action
 */
export function customDraft(current, action) {
  if (action.field === 'to') {
    return {...current, customTo: action.value, customError: ''};
  }
  return {...current, customFrom: action.value, customError: ''};
}

/**
 * @param {object} current
 * @param {{message?: string}} action
 */
export function customRejected(current, action) {
  return {...current, customError: action.message || ''};
}

/**
 * @param {object} current
 * @param {string} orderId
 */
export function rowSelected(current, orderId) {
  return {...current, selectedOrderId: orderId};
}
