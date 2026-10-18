import fs from 'fs';
import path from 'path';
import {expect} from 'chai';

const root = path.join(__dirname, '../../../../openMarket/user_interface');

/**
 * Colour values live in themes.scss (copied from docs/design/themes).
 * `#main` is the skip-link target, not a colour.
 */
const EXEMPT = new Set([
  path.normalize('style/settings/themes.scss')
]);
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\$c-/g;
const NOT_A_COLOUR = new Set(['#main']);

/**
 * @param {string} directory
 * @param {string[]} found
 */
function walk(directory, found) {
  fs.readdirSync(directory).forEach(name => {
    const full = path.join(directory, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full, found);
      return;
    }
    if (name.endsWith('.scss') || name.endsWith('.js')) {
      found.push(full);
    }
  });
}

describe('UI colours', () => {
  it('uses --om-* tokens instead of colour literals', () => {
    const files = [];
    walk(root, files);
    const failures = [];
    files.forEach(file => {
      const relative = path.relative(root, file);
      if (EXEMPT.has(path.normalize(relative))) {
        return;
      }
      const text = fs.readFileSync(file, 'utf8');
      const matches = text.match(COLOUR) || [];
      matches.forEach(match => {
        if (!NOT_A_COLOUR.has(match)) {
          failures.push(`${relative}: ${match}`);
        }
      });
    });
    expect(
      failures,
      'Hard-coded colours belong in docs/design/themes. See docs/design/DESIGN.md.\n' + failures.join('\n')
    ).to.deep.equal([]);
  });

  it('keeps colour out of component inline styles', () => {
    const directory = path.join(root, 'components');
    const failures = [];
    fs.readdirSync(directory).filter(name => name.endsWith('.js')).forEach(name => {
      const text = fs.readFileSync(path.join(directory, name), 'utf8');
      if (/style=\{\{[^}]*\bcolor\b/i.test(text)) {
        failures.push(name);
      }
    });
    expect(failures).to.deep.equal([]);
  });
});
