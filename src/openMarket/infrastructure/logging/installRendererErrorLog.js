import electronLog from 'electron-log/renderer';
import {bindLogger} from './ErrorLog';

const log = electronLog && typeof electronLog.error === 'function'
  ? electronLog
  : electronLog.default;

bindLogger(log, {processType: 'renderer'});
