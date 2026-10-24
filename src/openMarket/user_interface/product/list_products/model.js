export const NAME_ASC = 'name_asc';
export const NAME_DESC = 'name_desc';
export const STOCK_ASC = 'stock_asc';
export const STOCK_DESC = 'stock_desc';
export const defaultCatalogSort = NAME_ASC;
export const PAGE_SIZE = 20;
export const catalogLimit = PAGE_SIZE;

const LOAD_ERROR = 'No se han podido cargar los productos';

export function state() {
  return {
    query: '',
    lowStock: false,
    status: null,
    categoryId: null,
    weighted: null,
    sort: defaultCatalogSort,
    offset: 0,
    limit: PAGE_SIZE,
    categories: [],
    items: [],
    total: 0,
    loading: false,
    error: ''
  };
}

/**
 * @param {{query?: string, lowStock?: boolean, status?: string | null, categoryId?: string | null, weighted?: boolean | null}} page
 * @returns {boolean}
 */
export function filtersActive(page) {
  const current = page || {};
  return !!(
    String(current.query || '').trim() ||
    current.lowStock ||
    current.status ||
    current.categoryId ||
    current.weighted
  );
}

/**
 * @param {{offset?: number, limit?: number, total?: number}} page
 * @returns {string}
 */
export function showingLabel(page) {
  const total = Number(page && page.total) || 0;
  if (total < 1) {
    return 'Mostrando 0–0 de 0';
  }
  const offset = Math.max(0, Number(page.offset) || 0);
  const limit = Number(page.limit) || PAGE_SIZE;
  const start = offset + 1;
  const end = Math.min(offset + limit, total);
  return `Mostrando ${start}–${end} de ${total}`;
}

/**
 * @param {object} current
 * @param {{query?: string, lowStock?: boolean, status?: string | null, categoryId?: string | null, weighted?: boolean | null, sort?: string, limit?: number}} action
 */
export function pageOpened(current, action) {
  const next = action || {};
  return {
    ...current,
    query: next.query || '',
    lowStock: !!next.lowStock,
    status: next.status || null,
    categoryId: next.categoryId || null,
    weighted: next.weighted == null ? null : !!next.weighted,
    sort: next.sort || defaultCatalogSort,
    offset: 0,
    limit: next.limit || PAGE_SIZE,
    items: [],
    total: 0,
    loading: true,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {string} text
 */
export function queryChanged(current, text) {
  return {
    ...current,
    query: text == null ? '' : String(text),
    offset: 0,
    loading: true,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {{lowStock?: boolean, status?: string | null, categoryId?: string | null, weighted?: boolean | null, sort?: string}} action
 */
export function filtersChanged(current, action) {
  const next = action || {};
  return {
    ...current,
    lowStock: !!next.lowStock,
    status: next.status || null,
    categoryId: next.categoryId || null,
    weighted: next.weighted == null ? null : !!next.weighted,
    sort: next.sort || defaultCatalogSort,
    offset: 0,
    loading: true,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {{offset?: number}} action
 */
export function pageChanged(current, action) {
  const offset = Math.max(0, Number(action && action.offset) || 0);
  return {
    ...current,
    offset,
    loading: true,
    error: ''
  };
}

/** @param {object} current */
export function reloadStarted(current) {
  return {
    ...current,
    loading: true,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {object} action
 */
export function productsLoaded(current, action) {
  if (!samePage(current, action)) {
    return current;
  }
  return {
    ...current,
    items: action.items || [],
    total: Number(action.total) || 0,
    loading: false,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {object} action
 */
export function productsFailed(current, action) {
  if (!samePage(current, action)) {
    return current;
  }
  return {
    ...current,
    loading: false,
    error: (action && action.message) || LOAD_ERROR
  };
}

/**
 * @param {object} current
 * @param {Array<{id: string, name: string}>} categories
 */
export function categoriesLoaded(current, categories) {
  return {
    ...current,
    categories: categories || []
  };
}

/**
 * @param {object} current
 * @param {string} barcode
 */
export function productDisabled(current, barcode) {
  return {
    ...current,
    items: (current.items || []).map(item => (
      item.barcode === barcode ? {...item, status: 'DISABLED'} : item
    ))
  };
}

/**
 * @param {object} current
 * @param {object} action
 * @returns {boolean}
 */
function samePage(current, action) {
  const page = action || {};
  return (current.query || '') === (page.query || '')
    && !!current.lowStock === !!page.lowStock
    && (current.status || null) === (page.status || null)
    && (current.categoryId || null) === (page.categoryId || null)
    && weightOf(current.weighted) === weightOf(page.weighted)
    && (current.sort || defaultCatalogSort) === (page.sort || defaultCatalogSort)
    && (current.offset || 0) === (page.offset || 0);
}

/**
 * @param {boolean | null | undefined} weighted
 * @returns {boolean | null}
 */
function weightOf(weighted) {
  if (weighted == null) {
    return null;
  }
  return !!weighted;
}
