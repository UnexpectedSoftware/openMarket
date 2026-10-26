import fs from 'fs';
import path from 'path';
import {expect} from 'chai';

const themesDir = path.join(__dirname, '../../../../../docs/design/themes');
const IDS = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

const PREFIX = {
  color: 'color',
  gradient: 'gradient',
  font: 'font',
  fontFeature: 'font-feature',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  radius: 'radius',
  space: 'space',
  shadow: 'shadow',
  button: 'button',
  control: 'control',
  tile: 'tile',
  chart: 'chart'
};

const SHELL = {
  railWidth: '--om-rail-width',
  railItemHeight: '--om-rail-item-height',
  headerHeight: '--om-header-height',
  railMarkSize: '--om-rail-mark-size'
};

const SKIP = new Set(['id', 'name', 'colorScheme', 'mood', 'suits']);

/**
 * contrast.json names colours in camelCase. CSS tokens are kebab-case.
 * @param {string} name
 * @returns {string}
 */
function colorToken(name) {
  return '--om-color-' + name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
}

/**
 * @param {string} key
 * @returns {string}
 */
function kebab(key) {
  return String(key).replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
}

/**
 * @param {object} theme
 * @returns {Map<string, string>}
 */
function expectedTokens(theme) {
  const tokens = new Map();
  Object.keys(theme).forEach(section => {
    if (SKIP.has(section) || theme[section] == null || typeof theme[section] !== 'object') {
      return;
    }
    if (section === 'shell') {
      Object.keys(SHELL).forEach(key => tokens.set(SHELL[key], theme.shell[key]));
      return;
    }
    const prefix = PREFIX[section];
    expect(prefix, `unknown token group ${section}`).to.be.a('string');
    Object.keys(theme[section]).forEach(key => {
      tokens.set(`--om-${prefix}-${kebab(key)}`, String(theme[section][key]));
    });
  });
  return tokens;
}

/**
 * @param {string} css
 * @param {string} id
 * @returns {{scheme: string, tokens: Map<string, string>}}
 */
function parseCss(css, id) {
  const pattern = id === 'mercado'
    ? /:root,\s*\[data-theme="mercado"\]\s*\{([\s\S]*?)\n\}/
    : new RegExp(`\\[data-theme="${id}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`);
  const body = css.match(pattern);
  expect(body, `${id} css block`).to.not.equal(null);
  const tokens = new Map();
  let scheme = '';
  body[1].split('\n').forEach(line => {
    const schemeMatch = line.match(/color-scheme:\s*([^;]+);/);
    if (schemeMatch) {
      scheme = schemeMatch[1].trim();
    }
    const token = line.match(/(--om-[\w-]+):\s*([^;]+);/);
    if (token) {
      tokens.set(token[1], token[2].trim());
    }
  });
  return {scheme, tokens};
}

/**
 * @param {string} color
 * @returns {{r: number, g: number, b: number, a: number}}
 */
function parseColor(color) {
  const hex = /^#([0-9a-fA-F]{6})$/.exec(color);
  if (hex) {
    return {
      r: parseInt(hex[1].slice(0, 2), 16),
      g: parseInt(hex[1].slice(2, 4), 16),
      b: parseInt(hex[1].slice(4, 6), 16),
      a: 1
    };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(color);
  expect(rgb, color).to.not.equal(null);
  return {r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] == null ? 1 : Number(rgb[4])};
}

/**
 * @param {number} channel
 * @returns {number}
 */
function linearize(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {number}
 */
function luminance(rgb) {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

/**
 * @param {string} front
 * @param {string} back
 * @returns {number}
 */
function contrastRatio(front, back) {
  const fg = parseColor(front);
  const bg = parseColor(back);
  const blended = {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a)
  };
  const lighter = Math.max(luminance(blended), luminance(bg));
  const darker = Math.min(luminance(blended), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme contrast', () => {
  const contrast = JSON.parse(fs.readFileSync(path.join(themesDir, 'contrast.json'), 'utf8'));

  IDS.forEach(id => {
    const theme = JSON.parse(fs.readFileSync(path.join(themesDir, `${id}.json`), 'utf8'));
    const css = parseCss(fs.readFileSync(path.join(themesDir, `${id}.css`), 'utf8'), id);

    it(`${id} CSS matches the JSON tokens`, () => {
      expect(css.scheme).to.equal(theme.colorScheme);
      const expected = expectedTokens(theme);
      expected.forEach((value, name) => {
        expect(css.tokens.get(name), name).to.equal(value);
      });
      css.tokens.forEach((value, name) => {
        expect(expected.has(name), `extra token ${name}`).to.equal(true);
      });
    });

    it(`${id} meets the WCAG pairs in contrast.json`, () => {
      contrast[id].forEach(pair => {
        const foreground = theme.color[pair.fg];
        const background = theme.color[pair.bg];
        expect(foreground, pair.fg).to.be.a('string');
        expect(background, pair.bg).to.be.a('string');
        expect(css.tokens.get(colorToken(pair.fg)), colorToken(pair.fg)).to.equal(foreground);
        if (pair.required == null) {
          return;
        }
        const ratio = contrastRatio(foreground, background);
        expect(ratio, `${pair.fg} on ${pair.bg}`).to.be.at.least(pair.required);
        expect(Number(ratio.toFixed(2)), `${pair.fg} on ${pair.bg}`).to.equal(pair.ratio);
      });
    });
  });
});
