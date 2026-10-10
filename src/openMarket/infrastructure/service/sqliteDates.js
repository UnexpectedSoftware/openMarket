import moment from 'moment';
import UnrecognisedDateError from '../../domain/error/UnrecognisedDateError';
import {raise} from '../logging/ErrorLog';

const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const STORED_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function toStoredBound(value) {
  if (value && typeof value.format === 'function') {
    return value.format(STORED_FORMAT);
  }
  const parsed = moment(value, [DISPLAY_FORMAT, STORED_FORMAT], true);
  if (!parsed.isValid()) {
    raise(new UnrecognisedDateError({value}));
  }
  return parsed.format(STORED_FORMAT);
}
