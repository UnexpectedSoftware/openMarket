export const REQUIRED = 'Obligatorio';
export const NIF_INVALID = 'NIF no válido';
export const PHONE_TOO_LONG = 'Máximo 40 caracteres';
export const EMAIL_TOO_LONG = 'Máximo 80 caracteres';
export const LOAD_ERROR = 'No se han podido cargar los ajustes';
export const SAVE_ERROR = 'No se han podido guardar los ajustes';
export const THEME_SAVE_ERROR = 'El tema no se ha guardado';

const PHONE_MAX = 40;
const EMAIL_MAX = 80;
const SHOP_KEYS = [
  'nif', 'legalName', 'tradeName', 'street', 'postalCode', 'city',
  'province', 'country', 'phone', 'email'
];
const DRAFT_KEYS = SHOP_KEYS.concat(['invoicingEnabled', 'theme']);

/** @returns {object} */
export function state() {
  const shop = blankShop();
  return {
    saved: {...shop, issuer: null},
    draft: {...shop, theme: 'mercado'},
    issuer: null,
    persistedTheme: 'mercado',
    loading: true,
    error: null,
    saveError: null,
    saving: false,
    fieldErrors: {}
  };
}

/** @param {object} current */
export function pageOpened(current) {
  return {...current, loading: true, error: null};
}

/**
 * A page open copies the view and the stored theme into the draft.
 * A sell-screen refresh (`keepDraft`) updates `saved` and `issuer` only.
 * @param {object} current
 * @param {object} [profile]
 * @param {{theme?: string, keepDraft?: boolean}} [options]
 */
export function shopLoaded(current, profile, options) {
  const fields = shopFields(profile);
  const issuer = issuerOf(profile);
  const saved = {...fields, issuer};
  if (options && options.keepDraft) {
    return {...current, saved, issuer};
  }
  const theme = storedTheme(options, current);
  return {
    ...current,
    saved,
    issuer,
    draft: {...fields, theme},
    persistedTheme: theme,
    loading: false,
    error: null,
    saveError: null,
    saving: false,
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
  return {...current, draft, fieldErrors, saveError: null};
}

/**
 * Decides whether Guardar writes the shop, the theme, both, or nothing.
 * @param {object} current
 */
export function savePlan(current) {
  const fieldErrors = fieldErrorsFor(current.draft);
  const blocked = hasErrors(fieldErrors);
  const shop = !blocked && shopDirty(current);
  const theme = !blocked && themeDirty(current);
  return {
    proceed: shop || theme,
    shop,
    theme,
    fieldErrors,
    command: shopCommand(current.draft),
    themeId: current.draft.theme,
    previousTheme: current.persistedTheme
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
 */
export function saved(current, profile, theme) {
  const fields = shopFields(profile);
  const issuer = issuerOf(profile);
  const nextTheme = theme == null ? current.draft.theme : theme;
  return {
    ...current,
    saved: {...fields, issuer},
    draft: {...fields, theme: nextTheme},
    issuer,
    persistedTheme: nextTheme,
    loading: false,
    error: null,
    saveError: null,
    saving: false,
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
    saveError: problem.message || null,
    fieldErrors: problem.fieldErrors || {}
  };
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
  if (source.invoicingEnabled === true) {
    Object.assign(errors, incompleteErrors(source));
  }
  return errors;
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
