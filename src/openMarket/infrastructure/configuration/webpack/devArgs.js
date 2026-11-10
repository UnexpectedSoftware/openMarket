/**
 * Flags the dev server forwards from `npm run dev -- …` to the Electron process.
 * @param {string[]} argv
 * @returns {string[]}
 */
export function electronArgs(argv) {
  return (argv || []).filter(arg => arg === '--reset-fixtures');
}
