import os from 'os';
import path from 'path';
import {userDataDirectory} from '../service/sqliteDatabasePath';
import FixturesContainer from './FixturesContainer';

/**
 * Where Electron keeps the dev app's data once it calls app.setName('OpenMarket').
 * @param {{platform: string, env: Record<string, string | undefined>, home: string}} system
 * @returns {string}
 */
export function electronUserDataDirectory({platform, env, home}) {
  if (platform === 'win32') {
    return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'OpenMarket');
  }
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'OpenMarket');
  }
  return path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'OpenMarket');
}

/**
 * The database `npm run dev` opens. `--openmarket-user-data=<dir>` or
 * OPENMARKET_USER_DATA point it elsewhere, as they do for the app.
 * @returns {string}
 */
export function fixturesDatabasePath() {
  const directory = userDataDirectory() || electronUserDataDirectory({
    platform: process.platform,
    env: process.env,
    home: os.homedir()
  });
  return path.join(directory, 'openmarket.sqlite');
}

/**
 * Replaces the shop in `filename` with the demo shop and closes the database.
 * `prepare` runs after the container exists and before the seed, so a test can
 * subscribe on that bus. Progress is written to `out`.
 * @param {{filename: string, now?: Date, out?: {write: Function, isTTY?: boolean}, prepare?: (container: FixturesContainer) => void}} options
 * @returns {import('./FixturesService').SeedSummary & {filename: string, ms: number}}
 */
export function runFixtures({filename, now = new Date(), out = process.stdout, prepare}) {
  const started = process.hrtime.bigint();
  const container = new FixturesContainer({filename, out});
  try {
    if (typeof prepare === 'function') {
      prepare(container);
    }
    const summary = container.getInstance({key: 'fixturesService'}).reset({now});
    return {...summary, filename, ms: Number((process.hrtime.bigint() - started) / 1000000n)};
  } finally {
    container.close();
  }
}

/**
 * @param {{filename: string, out: {write: Function}, err: {write: Function}, now?: Date}} io
 * @returns {number} the exit code
 */
export function main({filename, out, err, now}) {
  try {
    const result = runFixtures({filename, now, out});
    out.write(`Demo shop written to ${result.filename}\n` +
      `  ${result.categories} categories, ${result.products} products, ${result.orders} tickets and invoices\n` +
      `  sales from ${result.from.slice(0, 10)} to ${result.to.slice(0, 10)}, in ${result.ms} ms\n`);
    return 0;
  } catch (error) {
    err.write(`Demo shop not written to ${filename}: ${error && error.stack ? error.stack : error}\n`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main({filename: fixturesDatabasePath(), out: process.stdout, err: process.stderr});
}
