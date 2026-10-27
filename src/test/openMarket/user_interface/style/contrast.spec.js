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
  return ratioOf(blended, bg);
}

/**
 * @param {{r: number, g: number, b: number}} front
 * @param {{r: number, g: number, b: number}} back
 * @returns {number}
 */
function ratioOf(front, back) {
  const lighter = Math.max(luminance(front), luminance(back));
  const darker = Math.min(luminance(front), luminance(back));
  return (lighter + 0.05) / (darker + 0.05);
}

const TEXT_ROLES = ['text', 'textMuted', 'primary', 'primaryHover', 'accent', 'success', 'warning', 'danger'];
const SURFACES = ['background', 'surface', 'surfaceAlt'];
const FILL_PAIRS = [
  ['primaryContrast', 'primary'],
  ['primaryContrast', 'primaryHover'],
  ['accentContrast', 'accent']
];
const SOFT_PAIRS = [
  ['primary', 'primarySoft'],
  ['success', 'successSoft'],
  ['danger', 'dangerSoft'],
  ['text', 'primarySoft'],
  ['text', 'successSoft'],
  ['text', 'dangerSoft']
];
const UI_ROLES = ['borderStrong', 'focus'];
const APP_THEMES = path.join(
  __dirname,
  '../../../../openMarket/user_interface/style/settings/themes.scss'
);

/**
 * @param {string} front
 * @param {string} back
 * @returns {{r: number, g: number, b: number, a: number}}
 */
function composite(front, back) {
  const fg = parseColor(front);
  const bg = parseColor(back);
  if (fg.a >= 1) {
    return fg;
  }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1
  };
}

/**
 * @param {string} token
 * @returns {string}
 */
function camel(token) {
  return token.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * @param {object} theme
 * @param {string} value
 * @returns {string}
 */
function resolvePaint(theme, value) {
  const reference = /^var\((--om-[\w-]+)\)$/.exec(value == null ? '' : value);
  if (!reference) {
    return value;
  }
  const name = reference[1];
  if (name.startsWith('--om-color-')) {
    return theme.color[camel(name.slice('--om-color-'.length))];
  }
  if (name.startsWith('--om-gradient-')) {
    return theme.gradient[camel(name.slice('--om-gradient-'.length))];
  }
  return value;
}

/**
 * Replaces var(--om-*) references inside a paint value.
 * @param {object} theme
 * @param {string} value
 * @returns {string}
 */
function expandVars(theme, value) {
  return String(value).replace(/var\((--om-[\w-]+)\)/g, (match, name) => {
    const resolved = resolvePaint(theme, 'var(' + name + ')');
    return resolved == null ? match : String(resolved);
  });
}

/**
 * Solid stops of a fill. A gradient also contributes its midpoint.
 * @param {string} paint
 * @returns {string[]}
 */
function paintStops(paint) {
  const stops = String(paint).match(/#[0-9A-Fa-f]{6}/g) || [];
  if (!String(paint).includes('gradient') || stops.length < 2) {
    return [paint];
  }
  const start = parseColor(stops[0]);
  const end = parseColor(stops[1]);
  const mid = [start.r, start.g, start.b].map((channel, index) => {
    const other = [end.r, end.g, end.b][index];
    return Math.round((channel + other) / 2).toString(16).padStart(2, '0');
  });
  return stops.concat('#' + mid.join(''));
}

/**
 * @param {object} theme
 * @param {string} paint
 * @returns {string[]}
 */
function backdrops(theme, paint) {
  if (paint === 'transparent') {
    return SURFACES.map(name => theme.color[name]);
  }
  return [paint];
}

/**
 * @param {number} ratio
 * @param {number} required
 * @param {string} label
 */
function expectAtLeast(ratio, required, label) {
  expect(ratio, label).to.be.at.least(required);
}

/**
 * @param {object} theme
 */
function expectTextPairs(theme) {
  TEXT_ROLES.forEach(role => {
    SURFACES.forEach(surface => {
      expectAtLeast(
        contrastRatio(theme.color[role], theme.color[surface]),
        4.5,
        `${role} on ${surface}`
      );
    });
  });
  FILL_PAIRS.forEach(pair => {
    expectAtLeast(
      contrastRatio(theme.color[pair[0]], theme.color[pair[1]]),
      4.5,
      `${pair[0]} on ${pair[1]}`
    );
  });
}

/**
 * @param {object} theme
 */
function expectSoftPairs(theme) {
  SOFT_PAIRS.forEach(pair => {
    SURFACES.forEach(surface => {
      const background = composite(theme.color[pair[1]], theme.color[surface]);
      const foreground = parseColor(theme.color[pair[0]]);
      expectAtLeast(
        ratioOf(foreground, background),
        4.5,
        `${pair[0]} on ${pair[1]} over ${surface}`
      );
    });
  });
}

/**
 * @param {object} theme
 */
function expectUiPairs(theme) {
  UI_ROLES.forEach(role => {
    SURFACES.forEach(surface => {
      expectAtLeast(
        contrastRatio(theme.color[role], theme.color[surface]),
        3,
        `${role} on ${surface}`
      );
    });
  });
  expectAtLeast(contrastRatio(theme.chart.barBorder, theme.color.surface), 3, 'chart border on surface');
}

/**
 * @param {object} theme
 */
function expectButtonPairs(theme) {
  const button = theme.button;
  expectAtLeast(
    contrastRatio(resolvePaint(theme, button.dangerFg), theme.color.danger),
    4.5,
    'danger button text'
  );
  const ghost = resolvePaint(theme, button.ghostFg);
  SURFACES.forEach(surface => {
    expectAtLeast(contrastRatio(ghost, theme.color[surface]), 4.5, `ghost text on ${surface}`);
  });
  const secondaryFg = resolvePaint(theme, button.secondaryFg);
  const secondaryBg = resolvePaint(theme, button.secondaryBg);
  backdrops(theme, secondaryBg).forEach(background => {
    expectAtLeast(contrastRatio(secondaryFg, background), 4.5, `secondary text on ${background}`);
  });
  const primaryFg = resolvePaint(theme, button.primaryFg);
  paintStops(expandVars(theme, resolvePaint(theme, button.primaryBg))).forEach(stop => {
    expectAtLeast(contrastRatio(primaryFg, stop), 4.5, `primary text on ${stop}`);
  });
  const border = resolvePaint(theme, button.secondaryBorder);
  backdrops(theme, secondaryBg).forEach(background => {
    expectAtLeast(contrastRatio(border, background), 3, `secondary border on ${background}`);
  });
}

/**
 * @param {{scheme: string, tokens: Map<string, string>}} css
 * @param {object} theme
 * @param {string} label
 */
function expectSameTokens(css, theme, label) {
  expect(css.scheme, label).to.equal(theme.colorScheme);
  const expected = expectedTokens(theme);
  expected.forEach((value, name) => {
    expect(css.tokens.get(name), `${label} ${name}`).to.equal(value);
  });
  css.tokens.forEach((value, name) => {
    expect(expected.has(name), `${label} extra token ${name}`).to.equal(true);
  });
}

/**
 * @param {string} id
 * @returns {{label: string, css: {scheme: string, tokens: Map<string, string>}}[]}
 */
function themeSources(id) {
  return [
    {label: `${id}.css`, file: path.join(themesDir, `${id}.css`)},
    {label: 'all-themes.css', file: path.join(themesDir, 'all-themes.css')},
    {label: 'themes.scss', file: APP_THEMES}
  ].map(source => ({
    label: source.label,
    css: parseCss(fs.readFileSync(source.file, 'utf8'), id)
  }));
}

describe('theme contrast', () => {
  const contrast = JSON.parse(fs.readFileSync(path.join(themesDir, 'contrast.json'), 'utf8'));

  IDS.forEach(id => {
    const theme = JSON.parse(fs.readFileSync(path.join(themesDir, `${id}.json`), 'utf8'));
    const sources = themeSources(id);
    const css = sources[0].css;

    it(`${id} CSS matches the JSON tokens`, () => {
      sources.forEach(source => expectSameTokens(source.css, theme, source.label));
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

    it(`${id} text is at least 4.5:1 and UI boundaries at least 3:1`, () => {
      expectTextPairs(theme);
      expectSoftPairs(theme);
      expectUiPairs(theme);
      expectButtonPairs(theme);
    });
  });
});
