import {ipcRenderer} from 'electron';
import OpenMarket from '../../application/index';
import {RESET_FIXTURES_CHANNEL, RESET_FIXTURES_DONE} from './channel';

if (process.env.NODE_ENV === 'development') {
  ipcRenderer.on(RESET_FIXTURES_CHANNEL, () => {
    try {
      OpenMarket.resetDemoData();
      ipcRenderer.send(RESET_FIXTURES_DONE);
    } catch (error) {
      const message = error && error.message ? error.message : 'reset failed';
      ipcRenderer.send(RESET_FIXTURES_DONE, message);
    }
  });
}
