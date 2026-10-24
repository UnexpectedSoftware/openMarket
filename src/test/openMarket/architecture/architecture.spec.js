import {expect} from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * Architecture guardrails. Pure Node: reads source files, resolves relative
 * imports, and checks the layer rules from AGENTS.md.
 *
 * KNOWN_VIOLATIONS is a ratchet: existing debt is listed so the suite is green
 * today. A NEW violation fails. Fixing a listed one also fails until you delete
 * its line, so the list only shrinks.
 */

const ROOT = path.resolve(__dirname, '../../../openMarket');
const LAYERS = ['domain', 'application', 'infrastructure', 'user_interface'];

/** Imports each layer may make into other layers (by path prefix under src/openMarket). */
const ALLOWED = {
  domain: [],
  application: [
    'domain/',
    'infrastructure/logging/',            // record/raise/observableError (error convention)
    'infrastructure/dic/Container'        // only application/index.js, the facade (checked below)
  ],
  infrastructure: ['domain/', 'application/', 'infrastructure/'],
  user_interface: [
    'application/',
    'domain/',                            // value objects (Money, VatRate, VatBreakdown), events, constants
    'infrastructure/logging/'
  ]
};

/** Packages the domain must never touch (I/O, frameworks). */
const DOMAIN_FORBIDDEN_PACKAGES = [
  /^(node:)?(fs|path|os|child_process|http|https|net)$/,
  /^node:sqlite$/, /^electron/, /^react/, /^redux/, /^electron-log/
];

/** Suffixes that hide what a class is. Persistence of an aggregate is a <Name>Repository. */
const BANNED_SUFFIXES = /(Store|Dao|DAO|Manager|Helper)\.js$/;
const BANNED_SUFFIX_ALLOWED = [
  'infrastructure/service/ImageStore.js',  // file storage for photos, not aggregate persistence
  'domain/plugin/SecretStore.js',          // encrypted setting capability, not an aggregate
  'infrastructure/plugins/SafeStorageSecretStore.js'
];

/** Existing debt, as "from -> to". Delete a line when you fix it. Never add one without Victor's OK. */
const KNOWN_VIOLATIONS = [
  'user_interface/category/epic.js -> infrastructure/service/ImageStore',
  'user_interface/home/epic.js -> infrastructure/service/ImageStore',
  'user_interface/home/epicFactory.js -> infrastructure/dic/Container',
  'user_interface/order/new_product_dialog/epic.js -> infrastructure/dic/Container',
  'user_interface/product/new_product/epic.js -> infrastructure/service/ImageStore'
];

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'configuration' ? [] : walk(full);
    }
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function importsOf(file) {
  const source = fs.readFileSync(file, 'utf8');
  const specs = [];
  const pattern = /(?:^|\n)\s*(?:import\s[^'"]*?from\s*|import\s*|export\s[^'"]*?from\s*)['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    specs.push(match[1] || match[2]);
  }
  return specs;
}

function resolveTarget(file, spec) {
  if (!spec.startsWith('.')) {
    return null;
  }
  const target = rel(path.resolve(path.dirname(file), spec)).replace(/\.js$/, '');
  return target.startsWith('..') ? null : target;
}

const layerOf = relative => LAYERS.find(layer => relative.startsWith(layer + '/'));
const files = LAYERS.flatMap(layer => walk(path.join(ROOT, layer)));

function crossLayerViolations() {
  const found = [];
  files.forEach(file => {
    const from = rel(file);
    const fromLayer = layerOf(from);
    importsOf(file).forEach(spec => {
      const to = resolveTarget(file, spec);
      if (!to) {
        return;
      }
      const toLayer = layerOf(to + '/') || layerOf(to);
      if (!toLayer || toLayer === fromLayer) {
        return;
      }
      const allowed = ALLOWED[fromLayer].some(prefix => to.startsWith(prefix));
      const containerOutsideFacade = to === 'infrastructure/dic/Container' && fromLayer === 'application'
        && from !== 'application/index.js';
      if (!allowed || containerOutsideFacade) {
        found.push(`${from} -> ${to}`);
      }
    });
  });
  return found;
}

describe('architecture', () => {
  it('has no new cross-layer imports (dependency rule)', () => {
    const fresh = crossLayerViolations().filter(v => !KNOWN_VIOLATIONS.includes(v));
    expect(fresh, 'Move the code to the right layer or depend on a domain port').to.deep.equal([]);
  });

  it('keeps KNOWN_VIOLATIONS honest (delete lines that are fixed)', () => {
    const current = crossLayerViolations();
    const stale = KNOWN_VIOLATIONS.filter(v => !current.includes(v));
    expect(stale, 'These are fixed; remove them from KNOWN_VIOLATIONS').to.deep.equal([]);
  });

  it('keeps the domain free of I/O and framework packages', () => {
    const bad = [];
    files.filter(file => rel(file).startsWith('domain/')).forEach(file => {
      importsOf(file).filter(spec => !spec.startsWith('.'))
        .filter(spec => DOMAIN_FORBIDDEN_PACKAGES.some(re => re.test(spec)))
        .forEach(spec => bad.push(`${rel(file)} -> ${spec}`));
    });
    expect(bad).to.deep.equal([]);
  });

  it('names persistence <Name>Repository, never *Store/*Dao/*Manager/*Helper', () => {
    const bad = files.map(rel)
      .filter(file => !file.startsWith('user_interface/'))
      .filter(file => BANNED_SUFFIXES.test(file))
      .filter(file => !BANNED_SUFFIX_ALLOWED.includes(file));
    expect(bad, 'Use <Name>Repository (port in domain, Sqlite<Name>Repository in infrastructure)').to.deep.equal([]);
  });

  it('loads plugin implementations only through the plugin shell', () => {
    const bad = [];
    files.forEach(file => {
      const from = rel(file);
      if (from.startsWith('infrastructure/plugins/')) {
        return;
      }
      importsOf(file).forEach(spec => {
        const to = resolveTarget(file, spec);
        if (!to || !to.startsWith('infrastructure/plugins/')) {
          return;
        }
        if (from !== 'infrastructure/dic/Container.js') {
          bad.push(`${from} -> ${to}`);
        }
      });
    });
    expect(bad, 'Plugin folders are loaded from disk. Only Container wires the shell').to.deep.equal([]);
  });

  it('gives every Sqlite<Name>Repository a domain port <Name>Repository', () => {
    const ports = new Set(files.map(rel).filter(f => f.startsWith('domain/'))
      .map(f => path.basename(f, '.js')).filter(n => n.endsWith('Repository')));
    const orphans = files.map(rel)
      .filter(f => /^infrastructure\/.*\/Sqlite\w+Repository\.js$/.test(f))
      .filter(f => !ports.has(path.basename(f, '.js').replace(/^Sqlite/, '')));
    expect(orphans, 'Add the port in domain/<context>/<Name>Repository.js').to.deep.equal([]);
  });

  it('keeps Sqlite*QueryService private to infrastructure', () => {
    const bad = [];
    files.filter(file => !rel(file).startsWith('infrastructure/')).forEach(file => {
      importsOf(file).filter(spec => /QueryService$/.test(spec))
        .forEach(spec => bad.push(`${rel(file)} -> ${spec}`));
    });
    expect(bad, 'Query services are SQL helpers injected into one Sqlite repository').to.deep.equal([]);
  });
});
