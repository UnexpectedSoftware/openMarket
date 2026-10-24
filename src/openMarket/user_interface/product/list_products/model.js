import Money from '../../../domain/money/Money';
import ProductStatus from '../../../domain/product/ProductStatus';
import {marginPercent} from '../../../domain/product/margin';
import VatRate from '../../../domain/tax/VatRate';

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
    error: '',
    drawerOpen: false,
    mode: 'create',
    editingBarcode: null,
    draft: emptyDraft(),
    errors: {},
    formError: '',
    saving: false,
    confirmArchive: false,
    loadingDraft: false,
    imageLookupBusy: false
  };
}

/** @returns {object} */
export function emptyDraft() {
  return {
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    price: '',
    basePrice: '',
    marginPercent: null,
    vatRate: VatRate.standard().code(),
    stock: '',
    stockMin: '',
    weighted: false,
    active: true,
    imageUrl: null,
    imagePath: null
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

const DRAFT_FIELDS = [
  'barcode',
  'name',
  'description',
  'categoryId',
  'price',
  'basePrice',
  'vatRate',
  'stock',
  'stockMin',
  'weighted',
  'active',
  'imageUrl',
  'imagePath'
];

/**
 * @param {object} current
 * @param {{mode?: string, barcode?: string}} action
 */
export function drawerOpened(current, action) {
  const request = action || {};
  if (request.mode === 'edit') {
    return {
      ...current,
      drawerOpen: true,
      mode: 'edit',
      editingBarcode: request.barcode == null ? '' : String(request.barcode),
      draft: emptyDraft(),
      errors: {},
      formError: '',
      saving: false,
      confirmArchive: false,
      loadingDraft: true,
      imageLookupBusy: false
    };
  }
  return {
    ...current,
    drawerOpen: true,
    mode: 'create',
    editingBarcode: null,
    draft: emptyDraft(),
    errors: {},
    formError: '',
    saving: false,
    confirmArchive: false,
    loadingDraft: false,
    imageLookupBusy: false
  };
}

/** @param {object} current */
export function drawerClosed(current) {
  return {
    ...current,
    drawerOpen: false,
    confirmArchive: false,
    saving: false,
    loadingDraft: false,
    imageLookupBusy: false,
    errors: {},
    formError: '',
    editingBarcode: null
  };
}

/**
 * @param {object} detail
 * @returns {object}
 */
export function draftFromDetail(detail) {
  const row = detail || {};
  return withMargin({
    ...emptyDraft(),
    barcode: row.barcode == null ? '' : String(row.barcode),
    name: row.name == null ? '' : String(row.name),
    description: row.description == null ? '' : String(row.description),
    categoryId: row.categoryId || '',
    price: eurosOf(row.priceCents),
    basePrice: eurosOf(row.basePriceCents),
    vatRate: vatCode(row.vat),
    stock: row.stock == null ? '' : row.stock,
    stockMin: row.stockMin == null ? '' : row.stockMin,
    weighted: !!row.weighted,
    active: row.status !== ProductStatus.DISABLED,
    imageUrl: row.imageUrl || null,
    imagePath: null
  });
}

/**
 * @param {object} current
 * @param {{barcode?: string, draft?: object}} action
 */
export function detailLoaded(current, action) {
  const loaded = action || {};
  if (!current.drawerOpen || current.mode !== 'edit') {
    return current;
  }
  if (String(current.editingBarcode || '') !== String(loaded.barcode || '')) {
    return current;
  }
  return {
    ...current,
    draft: loaded.draft || emptyDraft(),
    loadingDraft: false,
    errors: {},
    formError: ''
  };
}

/**
 * @param {object} current
 * @param {{barcode?: string, message?: string}} action
 */
export function drawerFailed(current, action) {
  const failed = action || {};
  if (!current.drawerOpen || String(current.editingBarcode || '') !== String(failed.barcode || '')) {
    return current;
  }
  return {
    ...current,
    loadingDraft: false,
    saving: false,
    formError: failed.message || 'No se ha podido abrir el producto'
  };
}

/**
 * @param {object} current
 * @param {{field?: string, value?: *}} change
 */
export function draftChanged(current, change) {
  const field = change && change.field;
  if (!current.drawerOpen || DRAFT_FIELDS.indexOf(field) === -1) {
    return current;
  }
  if (field === 'barcode' && current.mode === 'edit') {
    return current;
  }
  const draft = {...(current.draft || emptyDraft()), [field]: change.value};
  const next = field === 'price' || field === 'basePrice' ? withMargin(draft) : draft;
  const errors = {...(current.errors || {})};
  delete errors[field];
  return {...current, draft: next, errors, formError: ''};
}

/**
 * @param {object} draft
 * @param {string} mode
 * @returns {Record<string, string>}
 */
export function draftErrors(draft, mode) {
  const fields = draft || {};
  const errors = {};
  put(errors, 'name', requiredText(fields.name));
  put(errors, 'barcode', barcodeError(fields.barcode, mode));
  put(errors, 'price', positiveAmount(fields.price));
  put(errors, 'basePrice', positiveAmount(fields.basePrice));
  put(errors, 'stock', stockAmount(fields.stock));
  put(errors, 'stockMin', minimumAmount(fields.stockMin));
  put(errors, 'categoryId', requiredText(fields.categoryId));
  put(errors, 'vatRate', vatError(fields.vatRate));
  return errors;
}

/**
 * @param {object} current
 */
export function saveRequested(current) {
  const errors = draftErrors(current.draft, current.mode);
  if (Object.keys(errors).length) {
    return {...current, errors, saving: false};
  }
  return {...current, errors: {}, formError: '', saving: true};
}

/**
 * @param {object} draft
 * @param {string | null | undefined} imagePath
 */
export function saveCommand(draft, imagePath) {
  const fields = draft || {};
  const command = {
    barcode: String(fields.barcode || '').trim(),
    name: String(fields.name || '').trim(),
    description: fields.description == null ? '' : String(fields.description),
    price: fields.price,
    basePrice: fields.basePrice,
    stock: fields.stock,
    stockMin: fields.stockMin,
    weighted: !!fields.weighted,
    categoryId: fields.categoryId,
    status: fields.active ? ProductStatus.ENABLED : ProductStatus.DISABLED,
    vatRate: fields.vatRate
  };
  if (imagePath) {
    command.imagePath = imagePath;
  }
  return command;
}

/**
 * @param {object} current
 * @param {{errors?: Record<string, string>, message?: string}} action
 */
export function saveFailed(current, action) {
  const failed = action || {};
  return {
    ...current,
    saving: false,
    imageLookupBusy: false,
    errors: failed.errors || current.errors || {},
    formError: failed.message || ''
  };
}

/** @param {object} current */
export function productSaved(current) {
  return {
    ...drawerClosed(current),
    loading: true,
    error: ''
  };
}

/** @param {object} current */
export function archivePrompted(current) {
  if (!current.drawerOpen || current.mode !== 'edit') {
    return current;
  }
  return {...current, confirmArchive: true};
}

/** @param {object} current */
export function archiveDismissed(current) {
  return {...current, confirmArchive: false};
}

/** @param {object} current */
export function archiveStarted(current) {
  return {...current, confirmArchive: false, saving: true};
}

/**
 * @param {object} current
 * @param {string} barcode
 */
export function productArchived(current, barcode) {
  return drawerClosed(productDisabled(current, barcode));
}

/** @param {object} current */
export function imageRequested(current) {
  if (!current.drawerOpen || current.mode !== 'create') {
    return current;
  }
  return {...current, imageLookupBusy: true, formError: ''};
}

/**
 * @param {object} current
 * @param {{imagePath?: string | null, imageUrl?: string | null}} action
 */
export function imageFound(current, action) {
  if (!current.drawerOpen || current.mode !== 'create') {
    return current;
  }
  const found = action || {};
  return {
    ...current,
    imageLookupBusy: false,
    formError: '',
    draft: {
      ...(current.draft || emptyDraft()),
      imagePath: found.imagePath || null,
      imageUrl: found.imageUrl || null
    }
  };
}

/**
 * @param {object} current
 * @param {string} [message]
 */
export function imageMissed(current, message) {
  if (!current.drawerOpen) {
    return current;
  }
  return {
    ...current,
    imageLookupBusy: false,
    formError: message || 'No se ha encontrado una imagen para este código'
  };
}

/**
 * @param {object} draft
 */
function withMargin(draft) {
  return {
    ...draft,
    marginPercent: marginPercent({
      priceCents: centsOf(draft.price),
      baseCents: centsOf(draft.basePrice)
    })
  };
}

/**
 * @param {*} euros
 * @returns {number | null}
 */
function centsOf(euros) {
  if (typeof euros !== 'number' || !Number.isFinite(euros)) {
    return null;
  }
  try {
    return Money.fromEuros(euros).cents;
  } catch (error) {
    return null;
  }
}

/**
 * @param {*} cents
 * @returns {number | ''}
 */
function eurosOf(cents) {
  if (!Number.isInteger(cents)) {
    return '';
  }
  return Money.ofCents(cents).toEuros();
}

/**
 * @param {{kind?: string, percent?: number, cause?: string | null} | null | undefined} vat
 * @returns {string}
 */
function vatCode(vat) {
  if (!vat) {
    return VatRate.standard().code();
  }
  try {
    return VatRate.from(vat).code();
  } catch (error) {
    return VatRate.standard().code();
  }
}

/**
 * @param {Record<string, string>} errors
 * @param {string} key
 * @param {string} message
 */
function put(errors, key, message) {
  if (message) {
    errors[key] = message;
  }
}

/**
 * @param {*} value
 * @returns {string}
 */
function requiredText(value) {
  const text = value == null ? '' : String(value).trim();
  return text ? '' : 'Obligatorio';
}

/**
 * @param {*} barcode
 * @param {string} mode
 * @returns {string}
 */
function barcodeError(barcode, mode) {
  if (mode === 'edit') {
    return '';
  }
  const text = barcode == null ? '' : String(barcode).trim();
  if (!text) {
    return 'Obligatorio';
  }
  if (text.length > 15) {
    return '15 caracteres como máximo';
  }
  return '';
}

/**
 * @param {*} value
 * @returns {string}
 */
function positiveAmount(value) {
  return amountError(value, number => number <= 0, 'Debe ser mayor que 0');
}

/**
 * @param {*} value
 * @returns {string}
 */
function stockAmount(value) {
  return amountError(value, number => number < 0, 'Debe ser 0 o mayor');
}

/**
 * @param {*} value
 * @returns {string}
 */
function minimumAmount(value) {
  return amountError(value, number => number <= 0, 'Debe ser mayor que 0');
}

/**
 * @param {*} value
 * @param {(number: number) => boolean} reject
 * @param {string} message
 * @returns {string}
 */
function amountError(value, reject, message) {
  if (value == null || value === '') {
    return 'Obligatorio';
  }
  const number = asNumber(value);
  if (number == null) {
    return 'Debe ser un número';
  }
  if (reject(number)) {
    return message;
  }
  return '';
}

/**
 * @param {*} value
 * @returns {number | null}
 */
function asNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim().replace(',', '.');
  if (!text) {
    return null;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/**
 * @param {*} code
 * @returns {string}
 */
function vatError(code) {
  if (code == null || code === '') {
    return 'Obligatorio';
  }
  const known = VatRate.options().some(option => option.code === code);
  return known ? '' : 'Elige un IVA';
}
