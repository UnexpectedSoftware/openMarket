/**
 * The gallery is a development screen. Production builds keep it off unless
 * OPENMARKET_GALLERY=1, which the UI tests set at launch.
 * @param {{NODE_ENV?: string, OPENMARKET_GALLERY?: string}} env
 * @returns {boolean}
 */
export function isGalleryEnabled(env) {
  const source = env || {};
  if (source.OPENMARKET_GALLERY === '1') {
    return true;
  }
  return source.NODE_ENV !== 'production';
}
