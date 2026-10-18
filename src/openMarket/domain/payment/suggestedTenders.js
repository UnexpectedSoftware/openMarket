import Money from '../money/Money';

/** Next note sizes, in cents: 5, 10, 20 and 50 euros. */
const NOTES = [500, 1000, 2000, 5000];

/**
 * Exact total, then the next 5, 10, 20 and 50 euro amounts that cover it.
 * A note that is the same as the exact total, or as an earlier note, is left out.
 * @param {Money | number | string} total
 * @returns {Money[]}
 */
export default function suggestedTenders(total) {
  const due = Money.from(total);
  /** @type {Record<number, boolean>} */
  const seen = {};
  /** @type {Money[]} */
  const amounts = [];
  push(amounts, seen, due.cents);
  NOTES.forEach(note => {
    const steps = Math.ceil(due.cents / note);
    push(amounts, seen, steps * note);
  });
  return amounts;
}

/**
 * @param {Money[]} amounts
 * @param {Record<number, boolean>} seen
 * @param {number} cents
 */
function push(amounts, seen, cents) {
  if (seen[cents] || !Number.isInteger(cents) || cents < 0) {
    return;
  }
  seen[cents] = true;
  amounts.push(Money.ofCents(cents));
}
