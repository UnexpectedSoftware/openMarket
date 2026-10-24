import ProductStatus from '../../../domain/product/ProductStatus';

/**
 * @param {string | null | undefined} status
 * @returns {string}
 */
export function statusLabel(status) {
  if (status === ProductStatus.ENABLED) {
    return 'Activo';
  }
  if (status === ProductStatus.DISABLED) {
    return 'Inactivo';
  }
  return '';
}

/**
 * @param {string | null | undefined} status
 * @returns {'success' | 'neutral'}
 */
export function statusTone(status) {
  if (status === ProductStatus.ENABLED) {
    return 'success';
  }
  return 'neutral';
}
