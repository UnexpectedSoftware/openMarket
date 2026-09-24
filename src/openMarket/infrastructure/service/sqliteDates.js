import moment from 'moment';

const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const STORED_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export function toStoredBound(value) {
  if (value && typeof value.format === 'function') {
    return value.format(STORED_FORMAT);
  }
  const parsed = moment(value, [DISPLAY_FORMAT, STORED_FORMAT], true);
  if (!parsed.isValid()) {
    throw new Error('Unrecognised date ' + value);
  }
  return parsed.format(STORED_FORMAT);
}
