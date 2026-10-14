import OrderCreated from './OrderCreated';
import ProductEnabledAgain from './ProductEnabledAgain';
import ProductWithLowStock from './ProductWithLowStock';

const TYPES = {
  [OrderCreated.type]: OrderCreated,
  [ProductEnabledAgain.type]: ProductEnabledAgain,
  [ProductWithLowStock.type]: ProductWithLowStock
};

/**
 * @param {*} event
 * @returns {string}
 */
export function typeName(event) {
  const type = event && event.constructor && event.constructor.type;
  if (typeof type !== 'string' || type === '') {
    throw new Error('Domain event type is required');
  }
  return type;
}

/**
 * Order id, otherwise barcode. Empty when the event has neither.
 * @param {*} event
 * @returns {string|null}
 */
export function aggregateId(event) {
  if (event.id != null && String(event.id) !== '') {
    return String(event.id);
  }
  if (event.barcode != null && String(event.barcode) !== '') {
    return String(event.barcode);
  }
  return null;
}

/**
 * Event classes a plugin may subscribe to. The bus uses these same functions.
 * @returns {Record<string, Function>}
 */
export function eventClasses() {
  return {...TYPES};
}

/**
 * Builds the event the subscriber was registered for.
 * @param {string} type
 * @param {Object} payload
 * @returns {*}
 */
export function hydrate(type, payload) {
  const EventType = TYPES[type];
  if (!EventType) {
    throw new Error('Unknown domain event type ' + type);
  }
  return new EventType(payload);
}
