/**
 * Throws in development and tests when a required prop is missing.
 * The production bundle inlines NODE_ENV, so the check is skipped there.
 * @param {string} component
 * @param {Object} props
 * @param {string[]} names
 */
export function assertProps(component, props, names) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  names.forEach(name => {
    if (props[name] == null || props[name] === '') {
      throw new Error(component + ' requires ' + name);
    }
  });
}
