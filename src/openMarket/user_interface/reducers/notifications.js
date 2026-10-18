import {reducer as baseNotifications} from 'react-notification-system-redux';
import {MAX_VISIBLE_TOASTS} from '../components/toast';

/**
 * Keeps at most three toasts and replaces an existing uid instead of stacking it.
 * The oldest toast is dropped when a fourth distinct notice arrives.
 * @param {Array|undefined} state
 * @param {{type?: string, uid?: string}} action
 */
export default function notifications(state, action) {
  const next = baseNotifications(state, action);
  if (!Array.isArray(next) || next.length === 0) {
    return next;
  }
  const byUid = new Map();
  next.forEach(item => {
    if (byUid.has(item.uid)) {
      byUid.delete(item.uid);
    }
    byUid.set(item.uid, item);
  });
  const unique = Array.from(byUid.values());
  if (unique.length <= MAX_VISIBLE_TOASTS) {
    return unique;
  }
  return unique.slice(unique.length - MAX_VISIBLE_TOASTS);
}
