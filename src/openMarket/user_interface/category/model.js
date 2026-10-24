export const NAME_REQUIRED = 'Obligatorio';
export const LOAD_ERROR = 'No se han podido cargar las categorías';
export const SAVE_ERROR = 'No se ha podido guardar la categoría';
export const NOT_FOUND = 'No se encuentra la categoría';

export function state() {
  return {
    text: '',
    items: [],
    total: 0,
    loading: true,
    error: '',
    dialog: null
  };
}

/**
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function trimmedName(name) {
  return String(name == null ? '' : name).trim();
}

/** @param {object} current */
export function pageOpened(current) {
  return {...current, loading: true, error: ''};
}

/**
 * @param {object} current
 * @param {string | null | undefined} text
 */
export function queryChanged(current, text) {
  return {
    ...current,
    text: text == null ? '' : String(text),
    loading: true,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {{items?: object[], total?: number}} action
 */
export function categoriesLoaded(current, action) {
  const payload = action || {};
  return {
    ...current,
    items: payload.items || [],
    total: payload.total || 0,
    loading: false,
    error: ''
  };
}

/**
 * @param {object} current
 * @param {string} [message]
 */
export function categoriesFailed(current, message) {
  return {
    ...current,
    loading: false,
    error: message || LOAD_ERROR
  };
}

/**
 * @param {object} current
 * @param {{mode?: string, id?: string}} action
 */
export function dialogOpened(current, action) {
  const request = action || {};
  if (request.mode === 'edit') {
    return editDialog(current, request.id);
  }
  return {...current, dialog: blankDialog()};
}

/**
 * @param {object} current
 * @param {string} id
 */
function editDialog(current, id) {
  const item = (current.items || []).filter(row => row.id === id)[0];
  if (!item) {
    return current;
  }
  return {
    ...current,
    dialog: {
      mode: 'edit',
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl || null,
      imagePath: null,
      clearImage: false,
      nameError: null,
      fileError: null,
      error: null,
      saving: false
    }
  };
}

function blankDialog() {
  return {
    mode: 'create',
    id: null,
    name: '',
    imageUrl: null,
    imagePath: null,
    clearImage: false,
    nameError: null,
    fileError: null,
    error: null,
    saving: false
  };
}

/** @param {object} current */
export function dialogClosed(current) {
  return {...current, dialog: null};
}

/**
 * A patch cannot retarget the open category. Clearing the photo drops the path.
 * @param {object} current
 * @param {object} [patch]
 */
export function draftChanged(current, patch) {
  if (!current.dialog) {
    return current;
  }
  const change = patch || {};
  const next = {
    ...current.dialog,
    ...change,
    id: current.dialog.id,
    mode: current.dialog.mode,
    nameError: null,
    error: null
  };
  if (change.clearImage) {
    next.clearImage = true;
    next.imagePath = null;
    next.imageUrl = null;
    next.fileError = null;
  } else if (change.imagePath) {
    next.clearImage = false;
    next.fileError = null;
  }
  return {...current, dialog: next};
}

/**
 * A blank name or a rejected file stays on the dialog and does not save.
 * @param {object} current
 */
export function saveStarted(current) {
  const dialog = current.dialog;
  if (!dialog || dialog.saving) {
    return current;
  }
  const name = trimmedName(dialog.name);
  if (!name || dialog.fileError) {
    return {
      ...current,
      dialog: {
        ...dialog,
        name,
        nameError: name ? null : NAME_REQUIRED,
        saving: false
      }
    };
  }
  return {
    ...current,
    dialog: {...dialog, name, nameError: null, error: null, saving: true}
  };
}

/** @param {object} current */
export function saved(current) {
  return {...current, dialog: null};
}

/**
 * @param {object} current
 * @param {string} [message]
 */
export function saveFailed(current, message) {
  if (!current.dialog) {
    return current;
  }
  return {
    ...current,
    dialog: {
      ...current.dialog,
      saving: false,
      error: message || SAVE_ERROR
    }
  };
}
