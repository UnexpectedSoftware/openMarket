/**
 * Route decisions for the product list. The screen applies the plan; it does not decide it.
 * @param {{query?: {lowStock?: string}}} location
 * @returns {boolean}
 */
export function lowStockQuery(location) {
  const params = location && location.query;
  return !!(params && String(params.lowStock) === '1');
}

/**
 * @param {{pathname?: string}} location
 * @returns {boolean}
 */
export function isCreateRoute(location) {
  return !!(location && location.pathname === '/create_product');
}

/**
 * @param {{location?: object}} current
 * @param {{location?: object}} next
 * @returns {boolean}
 */
export function routeChanged(current, next) {
  const pathChanged = !!(next.location && current.location
    && next.location.pathname !== current.location.pathname);
  const lowChanged = lowStockQuery(next.location) !== lowStockQuery(current.location);
  return pathChanged || lowChanged;
}

/**
 * @param {{location?: object, products?: {drawerOpen?: boolean, mode?: string}}} next
 * @param {{location?: object} | null} previous
 * @returns {{loadCatalog: boolean, lowStock: boolean, openCreate: boolean, closeCreate: boolean}}
 */
export function routePlan(next, previous) {
  const lowStock = lowStockQuery(next && next.location);
  const create = isCreateRoute(next && next.location);
  if (!previous) {
    return {loadCatalog: true, lowStock, openCreate: create, closeCreate: false};
  }
  return planFromPrevious(next, previous, lowStock, create);
}

/**
 * @param {{products?: {drawerOpen?: boolean, mode?: string}}} next
 * @param {{location?: object}} previous
 * @param {boolean} lowStock
 * @param {boolean} create
 */
function planFromPrevious(next, previous, lowStock, create) {
  const prevCreate = isCreateRoute(previous.location);
  const products = (next && next.products) || {};
  return {
    loadCatalog: lowStock !== lowStockQuery(previous.location),
    lowStock,
    openCreate: create && !prevCreate,
    closeCreate: leavingCreate(create, prevCreate, products)
  };
}

/**
 * @param {boolean} create
 * @param {boolean} prevCreate
 * @param {{drawerOpen?: boolean, mode?: string}} products
 * @returns {boolean}
 */
function leavingCreate(create, prevCreate, products) {
  return !create && prevCreate && !!products.drawerOpen && products.mode === 'create';
}
