import {error, success, warning} from 'react-notification-system-redux';

export const TOAST_POSITION = 'bc';
export const SUCCESS_DISMISS_SECONDS = 2.5;
export const ERROR_DISMISS_SECONDS = 0;
export const MAX_VISIBLE_TOASTS = 3;

/**
 * @param {'success'|'warning'|'error'} level
 * @param {string} title
 * @param {string} message
 * @param {{uid?: string}} [extra]
 * @returns {{title: string, message: string, position: string, autoDismiss: number, uid: string}}
 */
export function toastOptions(level, title, message, extra) {
  const provided = extra && extra.uid;
  const options = {
    title: title,
    message: message,
    position: TOAST_POSITION,
    autoDismiss: level === 'error' ? ERROR_DISMISS_SECONDS : SUCCESS_DISMISS_SECONDS,
    uid: provided || (level + ':' + title + ':' + message)
  };
  if (extra && extra.autoDismiss != null) {
    options.autoDismiss = extra.autoDismiss;
  }
  if (extra && extra.action) {
    options.action = extra.action;
  }
  return options;
}

/**
 * @param {'success'|'warning'|'error'} level
 * @param {string} title
 * @param {string} message
 * @param {{uid?: string}} [extra]
 */
function show(level, title, message, extra) {
  const options = toastOptions(level, title, message, extra);
  if (level === 'error') {
    return error(options);
  }
  if (level === 'warning') {
    return warning(options);
  }
  return success(options);
}

/**
 * Fixed bottom-centre toasts. Success and warning dismiss after 2.5s.
 * Errors stay until the cashier dismisses them. The uid dedupes the same notice.
 */
export const toast = {
  /**
   * @param {string} title
   * @param {string} message
   * @param {{uid?: string}} [extra]
   */
  success(title, message, extra) {
    return show('success', title, message, extra);
  },
  /**
   * @param {string} title
   * @param {string} message
   * @param {{uid?: string}} [extra]
   */
  warning(title, message, extra) {
    return show('warning', title, message, extra);
  },
  /**
   * @param {string} title
   * @param {string} message
   * @param {{uid?: string}} [extra]
   */
  error(title, message, extra) {
    return show('error', title, message, extra);
  }
};

/**
 * Token colours for react-notification-system. `var(--om-*)` follows the theme.
 */
export const notificationStyle = {
  NotificationItem: {
    DefaultStyle: {
      backgroundColor: 'var(--om-color-surface)',
      color: 'var(--om-color-text)',
      borderRadius: 'var(--om-radius-md)',
      boxShadow: 'var(--om-shadow-md)',
      borderTop: '2px solid var(--om-color-border-strong)',
      fontFamily: 'var(--om-font-sans)',
      fontSize: 'var(--om-font-size-sm)'
    },
    success: {
      borderTop: '2px solid var(--om-color-success)',
      backgroundColor: 'var(--om-color-surface)',
      color: 'var(--om-color-text)'
    },
    error: {
      borderTop: '2px solid var(--om-color-danger)',
      backgroundColor: 'var(--om-color-surface)',
      color: 'var(--om-color-text)'
    },
    warning: {
      borderTop: '2px solid var(--om-color-warning)',
      backgroundColor: 'var(--om-color-surface)',
      color: 'var(--om-color-text)'
    }
  },
  Title: {
    DefaultStyle: {
      color: 'var(--om-color-text)',
      fontFamily: 'var(--om-font-sans)',
      fontWeight: 'var(--om-font-weight-bold)'
    },
    warning: {
      color: 'var(--om-color-warning)'
    },
    success: {
      color: 'var(--om-color-success)'
    },
    error: {
      color: 'var(--om-color-danger)'
    }
  },
  MessageWrapper: {
    DefaultStyle: {
      color: 'var(--om-color-text)'
    }
  },
  Dismiss: {
    DefaultStyle: {
      backgroundColor: 'transparent',
      color: 'var(--om-color-text-muted)',
      fontFamily: 'var(--om-font-sans)'
    }
  }
};
