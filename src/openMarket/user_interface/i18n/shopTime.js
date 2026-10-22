import moment from 'moment';

const SHOP_TIME_ZONE = 'Europe/Madrid';

/**
 * A local moment whose calendar numbers are the shop wall clock.
 * Order timestamps are stored from that clock, so filters must use the same day
 * even when the computer is set to UTC.
 * @param {Date} [instant]
 * @param {string} [timeZone]
 * @returns {moment.Moment}
 */
export function shopMoment(instant = new Date(), timeZone = SHOP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(instant);
  const value = type => parts.find(part => part.type === type).value;
  return moment(
    `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`,
    'YYYY-MM-DD HH:mm:ss'
  );
}
