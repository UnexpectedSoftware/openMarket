import SellLayout from '../../../domain/appearance/SellLayout';
import {parseDecimal} from '../../components/NumberField';

/**
 * Shop name for the top bar, and the NIF line the settings screen checks.
 * @param {{tradeName?: string, legalName?: string, nif?: string} | null | undefined} issuer
 * @returns {{shopName: string, subtitle: string | undefined}}
 */
export function issuerLine(issuer) {
  if (!issuer) {
    return {shopName: '', subtitle: undefined};
  }
  const name = issuer.tradeName || issuer.legalName;
  return {
    shopName: name || '',
    subtitle: issuer.nif ? name + ' · NIF ' + issuer.nif : undefined
  };
}

/**
 * @param {{freeDescription?: string, freeAmount?: string} | null | undefined} state
 * @returns {boolean}
 */
export function freeLineValid(state) {
  const current = state || {};
  const amount = parseDecimal(current.freeAmount);
  const description = String(current.freeDescription || '').trim();
  return description !== '' && amount != null && amount > 0;
}

/**
 * @param {string | null | undefined} layout
 * @returns {{layout: string, scanner: boolean, keypad: boolean}}
 */
export function sellFlags(layout) {
  const id = SellLayout.orDefault(layout);
  return {
    layout: id,
    scanner: id === 'escaner',
    keypad: id === 'tactil'
  };
}

/**
 * One search field is mounted either in the top bar or, for Escáner, under it.
 * @param {boolean} scanner
 * @param {*} search
 * @returns {{top: *, catalog: *}}
 */
export function placeSearch(scanner, search) {
  if (scanner) {
    return {top: null, catalog: search};
  }
  return {top: search, catalog: null};
}

/**
 * Values the sell screen renders. Handlers stay on the container.
 * @param {object | null | undefined} props
 * @param {object | null | undefined} state
 * @returns {object}
 */
export function sellView(props, state) {
  const source = props || {};
  const local = state || {};
  const flags = sellFlags(source.layout);
  const issuer = issuerLine(source.issuer);
  return {
    layout: flags.layout,
    scanner: flags.scanner,
    keypad: flags.keypad,
    subtitle: issuer.subtitle,
    shopName: issuer.shopName,
    freeValid: freeLineValid(local),
    search: local.search || '',
    categoryId: source.categoryId || null,
    categories: source.categories || [],
    tiles: source.tiles,
    tilesStatus: source.tilesStatus,
    order: source.order,
    selected: local.selected,
    lowStockBarcodes: source.lowStockBarcodes,
    saving: source.saving,
    previewHtml: source.previewHtml,
    reprintHtml: source.reprintHtml,
    freeOpen: !!local.freeOpen,
    helpOpen: !!local.helpOpen,
    paymentOpen: !!local.paymentOpen,
    reprintOpen: !!local.reprintOpen,
    payMethod: local.payMethod,
    tendered: local.tendered,
    previewOpen: local.previewOpen,
    freeDescription: local.freeDescription,
    freeAmount: local.freeAmount,
    freeVat: local.freeVat
  };
}
