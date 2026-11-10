import FixturesService from './FixturesService';
import * as demoCatalog from './demoCatalog';
import * as demoOrders from './demoOrders';
import * as demoShop from './demoShop';
import * as demoSettings from './demoSettings';
import {imagesDirectory} from '../service/ImageStore';

const RESET_FIXTURES_CONSUME = 'openmarket:reset-fixtures:consume';

export function createFixturesService({database}) {
  return new FixturesService({
    database,
    demoCatalog,
    demoOrders,
    demoShop,
    demoSettings,
    resetOnLoad: consumeResetFixturesFlag(),
    imageDirectory: imagesDirectory('product-images')
  });
}

/**
 * True only in development, and only when the main process still has a reset pending.
 * A throw from the bridge means this process is not the app window.
 * @param {string | undefined} nodeEnv
 * @param {() => boolean} readFlag
 * @returns {boolean}
 */
export function resetOnLoadFrom(nodeEnv, readFlag) {
  if (nodeEnv !== 'development') {
    return false;
  }
  try {
    return readFlag() === true;
  } catch (error) {
    return false;
  }
}

/**
 * The main process answers true once per launch that passed `--reset-fixtures`.
 * A reload asks again and gets false, so the shop is not wiped on every refresh.
 * @returns {boolean}
 */
function consumeResetFixturesFlag() {
  return resetOnLoadFrom(process.env.NODE_ENV, readResetFlag);
}

/**
 * @returns {boolean}
 */
function readResetFlag() {
  try {
    return require('electron').ipcRenderer.sendSync(RESET_FIXTURES_CONSUME) === true;
  } catch (error) {
    return false;
  }
}
