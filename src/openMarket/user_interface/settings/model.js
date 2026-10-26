export const REQUIRED = 'Obligatorio';
export const NIF_INVALID = 'NIF no válido';
export const PHONE_TOO_LONG = 'Máximo 40 caracteres';
export const EMAIL_TOO_LONG = 'Máximo 80 caracteres';
export const COPY_TOO_LONG = 'Máximo 80 caracteres';
export const INTERFACE_TOO_LONG = 'Máximo 200 caracteres';
export const LOAD_ERROR = 'No se han podido cargar los ajustes';
export const SAVE_ERROR = 'No se han podido guardar los ajustes';
export const THEME_SAVE_ERROR = 'El tema no se ha guardado';
export const PRINT_ERROR = 'No se ha podido imprimir';

const PHONE_MAX = 40;
const EMAIL_MAX = 80;
const COPY_MAX = 80;
const INTERFACE_MAX = 200;
const SHOP_KEYS = [
  'nif', 'legalName', 'tradeName', 'street', 'postalCode', 'city',
  'province', 'country', 'phone', 'email'
];
const TICKET_KEYS = ['printMode', 'headerText', 'footerText', 'paperWidthMm'];
const PRINTER_KEYS = ['printerType', 'printerInterface', 'printerCharacterSet'];
const LANGUAGE_KEYS = ['locale'];
const DRAFT_KEYS = SHOP_KEYS.concat(['invoicingEnabled'], TICKET_KEYS, PRINTER_KEYS, LANGUAGE_KEYS, ['theme']);

/** @returns {object} */
export function state() {
  const shop = blankShop();
  const ticket = blankTicket();
  const printer = blankPrinter();
  const language = blankLanguage();
  return {
    saved: {...shop, ...ticket, ...printer, ...language, issuer: null},
    draft: {...shop, ...ticket, ...printer, ...language, theme: 'mercado'},
    issuer: null,
    persistedTheme: 'mercado',
    loading: true,
    error: null,
    saveError: null,
    saving: false,
    printing: false,
    printerError: null,
    fieldErrors: {}
  };
}

/** @param {object} current */
export function pageOpened(current) {
  return {...current, loading: true, error: null, printing: false, printerError: null};
}

/**
 * A page open copies the shop view, the ticket view, and the stored theme into the draft.
 * A sell-screen refresh (`keepDraft`) updates `saved` and `issuer` only.
 * @param {object} current
 * @param {object} [profile]
 * @param {{theme?: string, ticket?: object, printer?: object, language?: object, keepDraft?: boolean}} [options]
 */
export function shopLoaded(current, profile, options) {
  const fields = shopFields(profile);
  const issuer = issuerOf(profile);
  if (options && options.keepDraft) {
    return {
      ...current,
      saved: {
        ...printerFields(current.saved),
        ...languageFields(current.saved),
        ...ticketFields(current.saved),
        ...fields,
        issuer
      },
      issuer
    };
  }
  const copy = ticketFields(options && options.ticket);
  const device = printerFields(asPrinterDraft(options && options.printer));
  const locale = languageFields(options && options.language);
  const theme = storedTheme(options, current);
  return {
    ...current,
    saved: {...fields, ...copy, ...device, ...locale, issuer},
    issuer,
    draft: {...fields, ...copy, ...device, ...locale, theme},
    persistedTheme: theme,
    loading: false,
    error: null,
    saveError: null,
    saving: false,
    printing: false,
    printerError: null,
    fieldErrors: {}
  };
}

/**
 * @param {object} current
 * @param {string} [message]
 */
export function loadFailed(current, message) {
  return {
    ...current,
    loading: false,
    saving: false,
    printing: false,
    error: message || LOAD_ERROR
  };
}

/**
 * A draft edit never replaces the issuer the sell screen reads.
 * @param {object} current
 * @param {object} [patch]
 */
export function draftChanged(current, patch) {
  const change = patch || {};
  const draft = {...current.draft};
  const fieldErrors = {...(current.fieldErrors || {})};
  let touched = false;
  DRAFT_KEYS.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(change, key)) {
      return;
    }
    draft[key] = change[key];
    delete fieldErrors[key];
    touched = true;
  });
  if (!touched) {
    return current;
  }
  return {...current, draft, fieldErrors, saveError: null, printerError: null};
}

/**
 * Decides whether Guardar writes the shop, the ticket, the printer, the language, the theme, or nothing.
 * @param {object} current
 */
export function savePlan(current) {
  const fieldErrors = fieldErrorsFor(current.draft);
  const blocked = hasErrors(fieldErrors);
  const shop = !blocked && shopDirty(current);
  const ticket = !blocked && ticketDirty(current);
  const printer = !blocked && printerDirty(current);
  const language = !blocked && languageDirty(current);
  const theme = !blocked && themeDirty(current);
  return {
    proceed: shop || ticket || printer || language || theme,
    shop,
    ticket,
    printer,
    language,
    theme,
    fieldErrors,
    command: shopCommand(current.draft),
    ticketCommand: ticketCommand(current.draft),
    printerCommand: printerCommand(current.draft),
    languageCommand: languageCommand(current.draft),
    themeId: current.draft.theme,
    previousTheme: current.persistedTheme
  };
}

/**
 * The sample uses the saved printer, so a dirty interface is written first.
 * An empty interface does not print.
 * @param {object} current
 */
export function testPrintPlan(current) {
  const fieldErrors = {};
  addPrinterErrors(fieldErrors, current && current.draft);
  const blocked = hasErrors(fieldErrors);
  return {
    proceed: !blocked,
    save: !blocked && printerDirty(current),
    fieldErrors,
    command: printerCommand(current && current.draft)
  };
}

/**
 * Field errors and a clean form do not start a save.
 * @param {object} current
 */
export function saveStarted(current) {
  const plan = savePlan(current);
  if (!plan.proceed) {
    return refused(current, plan.fieldErrors);
  }
  return {...current, saving: true, fieldErrors: {}, error: null, saveError: null};
}

/**
 * @param {object} current
 * @param {object} [profile]
 * @param {string | null} [theme]
 * @param {object | null} [ticket]
 * @param {object | null} [printer]
 * @param {object | null} [language]
 */
export function saved(current, profile, theme, ticket, printer, language) {
  const fields = shopFields(profile);
  const copy = ticket == null ? ticketFields(current.draft) : ticketFields(ticket);
  const device = printer == null ? printerFields(current.draft) : printerFields(asPrinterDraft(printer));
  const locale = language == null ? languageFields(current.draft) : languageFields(language);
  const issuer = issuerOf(profile);
  const nextTheme = theme == null ? current.draft.theme : theme;
  return {
    ...current,
    saved: {...fields, ...copy, ...device, ...locale, issuer},
    draft: {...fields, ...copy, ...device, ...locale, theme: nextTheme},
    issuer,
    persistedTheme: nextTheme,
    loading: false,
    error: null,
    saveError: null,
    saving: false,
    printing: false,
    printerError: null,
    fieldErrors: {}
  };
}

/**
 * A shop failure leaves the draft. A theme failure puts the previous id back.
 * @param {object} current
 * @param {{message?: string, fieldErrors?: object, theme?: string}} [failure]
 */
export function saveFailed(current, failure) {
  const problem = failure || {};
  const draft = problem.theme == null ? current.draft : {...current.draft, theme: problem.theme};
  return {
    ...current,
    draft,
    saving: false,
    printing: false,
    saveError: problem.message || null,
    fieldErrors: problem.fieldErrors || {}
  };
}

/**
 * @param {object} current
 */
export function testPrintStarted(current) {
  const plan = testPrintPlan(current);
  if (!plan.proceed) {
    const fieldErrors = withPrinterError(current, plan.fieldErrors);
    if (!current.printing && !current.saving && sameErrors(current.fieldErrors, fieldErrors)) {
      return current;
    }
    return {...current, saving: false, printing: false, fieldErrors, error: null};
  }
  return {
    ...current,
    printing: true,
    printerError: null,
    fieldErrors: withPrinterError(current, {}),
    error: null
  };
}

/**
 * @param {object} current
 * @param {object | null} [printer]
 */
export function testPrinted(current, printer) {
  const device = printer == null ? null : printerFields(asPrinterDraft(printer));
  return {
    ...current,
    saved: device == null ? current.saved : {...current.saved, ...device},
    draft: device == null ? current.draft : {...current.draft, ...device},
    printing: false,
    printerError: null,
    saving: false
  };
}

/**
 * @param {object} current
 * @param {{message?: string, printer?: object}} [failure]
 */
export function testPrintFailed(current, failure) {
  const problem = failure || {};
  const next = testPrinted(current, problem.printer);
  return {...next, printerError: problem.message || PRINT_ERROR};
}

/**
 * @param {object} draft
 * @returns {object}
 */
export function incompleteErrors(draft) {
  const source = draft || {};
  const errors = {};
  if (trimmed(source.nif) === '') {
    errors.nif = REQUIRED;
  }
  if (trimmed(source.legalName) === '') {
    errors.legalName = REQUIRED;
  }
  return errors;
}

/**
 * Header and footer length failures land on that field.
 * @param {{code?: string, context?: {field?: string}}} [error]
 * @returns {object | null}
 */
export function copyFieldErrors(error) {
  const field = error && error.context && error.context.field;
  if (field !== 'headerText' && field !== 'footerText') {
    return null;
  }
  return {[field]: COPY_TOO_LONG};
}

/**
 * An empty interface is "Obligatorio". A longer one is the length message.
 * @param {{context?: {field?: string, value?: string}}} [error]
 * @returns {object | null}
 */
export function printerFieldErrors(error) {
  const field = error && error.context && error.context.field;
  if (field !== 'interface') {
    return null;
  }
  const value = error.context.value == null ? '' : String(error.context.value).trim();
  if (value === '') {
    return {printerInterface: REQUIRED};
  }
  return {printerInterface: INTERFACE_TOO_LONG};
}

/**
 * @param {{theme?: string}} [options]
 * @param {object} current
 * @returns {string}
 */
function storedTheme(options, current) {
  if (options && options.theme) {
    return options.theme;
  }
  return current.persistedTheme || 'mercado';
}

/** @returns {object} */
function blankShop() {
  return {
    nif: '',
    legalName: '',
    tradeName: '',
    street: '',
    postalCode: '',
    city: '',
    province: '',
    country: 'ES',
    phone: '',
    email: '',
    invoicingEnabled: false
  };
}

/** @returns {object} */
function blankTicket() {
  return ticketFields();
}

/** @returns {object} */
function blankPrinter() {
  return printerFields({});
}

/** @returns {object} */
function blankLanguage() {
  return languageFields({});
}

/**
 * @param {object} [profile]
 * @returns {object}
 */
function shopFields(profile) {
  const source = profile || {};
  return {
    nif: source.nif == null ? '' : String(source.nif),
    legalName: textOrEmpty(source.legalName),
    tradeName: textOrEmpty(source.tradeName),
    street: textOrEmpty(source.street),
    postalCode: textOrEmpty(source.postalCode),
    city: textOrEmpty(source.city),
    province: textOrEmpty(source.province),
    country: source.country == null || source.country === '' ? 'ES' : String(source.country),
    phone: textOrEmpty(source.phone),
    email: textOrEmpty(source.email),
    invoicingEnabled: source.invoicingEnabled === true
  };
}

/**
 * @param {object} [source]
 * @returns {{printMode: string, headerText: string, footerText: string, paperWidthMm: number}}
 */
function ticketFields(source) {
  const value = source || {};
  return {
    printMode: modeOf(value.printMode),
    headerText: textOrEmpty(value.headerText),
    footerText: textOrEmpty(value.footerText),
    paperWidthMm: Number(value.paperWidthMm) === 58 ? 58 : 80
  };
}

/**
 * @param {string} [printMode]
 * @returns {'always' | 'ask' | 'never'}
 */
function modeOf(printMode) {
  if (printMode === 'always' || printMode === 'never') {
    return printMode;
  }
  return 'ask';
}

/**
 * @param {object} [profile]
 */
function issuerOf(profile) {
  if (!profile || !profile.issuer) {
    return null;
  }
  return profile.issuer;
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function textOrEmpty(value) {
  if (value == null) {
    return '';
  }
  return String(value);
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function trimmed(value) {
  return textOrEmpty(value).trim();
}

/**
 * @param {object} draft
 * @returns {object}
 */
function fieldErrorsFor(draft) {
  const source = draft || {};
  const errors = {};
  putLimit(errors, 'phone', source.phone, PHONE_MAX, PHONE_TOO_LONG);
  putLimit(errors, 'email', source.email, EMAIL_MAX, EMAIL_TOO_LONG);
  putLimit(errors, 'headerText', source.headerText, COPY_MAX, COPY_TOO_LONG);
  putLimit(errors, 'footerText', source.footerText, COPY_MAX, COPY_TOO_LONG);
  if (source.invoicingEnabled === true) {
    Object.assign(errors, incompleteErrors(source));
  }
  addPrinterErrors(errors, source);
  return errors;
}

/**
 * @param {object} errors
 * @param {object} [draft]
 */
function addPrinterErrors(errors, draft) {
  const source = draft || {};
  if (!Object.prototype.hasOwnProperty.call(source, 'printerInterface')) {
    return;
  }
  const device = trimmed(source.printerInterface);
  if (device === '') {
    errors.printerInterface = REQUIRED;
    return;
  }
  if (device.length > INTERFACE_MAX) {
    errors.printerInterface = INTERFACE_TOO_LONG;
  }
}

/**
 * @param {object} current
 * @param {object} printerErrors
 * @returns {object}
 */
function withPrinterError(current, printerErrors) {
  const fieldErrors = {...(current.fieldErrors || {})};
  delete fieldErrors.printerInterface;
  return {...fieldErrors, ...printerErrors};
}

/**
 * @param {object} errors
 * @param {string} key
 * @param {string} value
 * @param {number} max
 * @param {string} message
 */
function putLimit(errors, key, value, max, message) {
  if (trimmed(value).length > max) {
    errors[key] = message;
  }
}

/**
 * @param {object} errors
 * @returns {boolean}
 */
function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * @param {object} current
 * @param {object} fieldErrors
 */
function refused(current, fieldErrors) {
  if (!current.saving && sameErrors(current.fieldErrors, fieldErrors)) {
    return current;
  }
  return {...current, saving: false, fieldErrors, error: null};
}

/**
 * @param {object} left
 * @param {object} right
 * @returns {boolean}
 */
function sameErrors(left, right) {
  const a = left || {};
  const b = right || {};
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  return keys.every(key => a[key] === b[key]);
}

/**
 * @param {object} current
 * @returns {boolean}
 */
function shopDirty(current) {
  const next = shopCommand(current.draft);
  const saved = current.saved || {};
  const changed = SHOP_KEYS.some(key => next[key] !== savedText(saved, key));
  return changed || next.invoicingEnabled !== (saved.invoicingEnabled === true);
}

/**
 * @param {object} current
 * @returns {boolean}
 */
function ticketDirty(current) {
  const next = ticketCommand(current.draft);
  const saved = ticketCommand(current.saved);
  return TICKET_KEYS.some(key => next[key] !== saved[key]);
}

/**
 * @param {object} current
 * @returns {boolean}
 */
function printerDirty(current) {
  const next = printerCommand(current.draft);
  const saved = printerCommand(current.saved);
  return next.type !== saved.type || next.interface !== saved.interface || next.characterSet !== saved.characterSet;
}

/**
 * @param {object} current
 * @returns {boolean}
 */
function languageDirty(current) {
  const next = languageCommand(current.draft);
  const saved = languageCommand(current.saved);
  return next.locale !== saved.locale;
}

/**
 * @param {object} saved
 * @param {string} key
 * @returns {string}
 */
function savedText(saved, key) {
  if (key === 'country') {
    return saved.country == null || saved.country === '' ? 'ES' : String(saved.country);
  }
  if (key === 'nif' || key === 'phone' || key === 'email' || key === 'legalName') {
    return trimmed(saved[key]);
  }
  return textOrEmpty(saved[key]);
}

/**
 * @param {object} current
 * @returns {boolean}
 */
function themeDirty(current) {
  return String(current.draft.theme || '') !== String(current.persistedTheme || '');
}

/**
 * @param {object} draft
 * @returns {object}
 */
function shopCommand(draft) {
  const source = draft || {};
  return {
    nif: trimmed(source.nif),
    legalName: trimmed(source.legalName),
    tradeName: textOrEmpty(source.tradeName),
    street: textOrEmpty(source.street),
    postalCode: textOrEmpty(source.postalCode),
    city: textOrEmpty(source.city),
    province: textOrEmpty(source.province),
    country: trimmed(source.country) || 'ES',
    phone: trimmed(source.phone),
    email: trimmed(source.email),
    invoicingEnabled: source.invoicingEnabled === true
  };
}

/**
 * @param {object} draft
 * @returns {{printMode: string, headerText: string, footerText: string, paperWidthMm: number}}
 */
function ticketCommand(draft) {
  const fields = ticketFields(draft);
  return {
    printMode: fields.printMode,
    headerText: trimmed(fields.headerText),
    footerText: trimmed(fields.footerText),
    paperWidthMm: fields.paperWidthMm
  };
}

/**
 * @param {object} [source]
 * @returns {{printerType: string, printerInterface: string, printerCharacterSet: string}}
 */
function printerFields(source) {
  const value = source || {};
  return {
    printerType: value.printerType == null || value.printerType === '' ? 'epson' : String(value.printerType),
    printerInterface: value.printerInterface == null ? '/dev/usb/lp' : String(value.printerInterface),
    printerCharacterSet: value.printerCharacterSet == null || value.printerCharacterSet === ''
      ? 'SPAIN1'
      : String(value.printerCharacterSet)
  };
}

/**
 * A stored view uses `type` / `interface` / `characterSet`. The draft uses `printer*`.
 * @param {object | null | undefined} printer
 * @returns {object}
 */
function asPrinterDraft(printer) {
  if (!printer) {
    return {};
  }
  if (Object.prototype.hasOwnProperty.call(printer, 'printerInterface')
    || Object.prototype.hasOwnProperty.call(printer, 'printerType')
    || Object.prototype.hasOwnProperty.call(printer, 'printerCharacterSet')) {
    return printer;
  }
  return {
    printerType: printer.type,
    printerInterface: printer.interface,
    printerCharacterSet: printer.characterSet
  };
}

/**
 * @param {object} draft
 * @returns {{type: string, interface: string, characterSet: string}}
 */
function printerCommand(draft) {
  const fields = printerFields(draft);
  return {
    type: fields.printerType,
    interface: trimmed(fields.printerInterface),
    characterSet: fields.printerCharacterSet
  };
}

/**
 * @param {object} [source]
 * @returns {{locale: string}}
 */
function languageFields(source) {
  const value = source || {};
  const locale = value.locale == null || value.locale === '' ? 'es' : String(value.locale);
  return {locale};
}

/**
 * @param {object} draft
 * @returns {{locale: string}}
 */
function languageCommand(draft) {
  return {locale: languageFields(draft).locale};
}
