/**
 * Subscribes to a use case or repository observable and returns its last value.
 * The SQLite adapters are synchronous, so the observable has finished when subscribe
 * returns. An error is thrown, so a surrounding transaction rolls back.
 * @param {{subscribe: Function}} observable
 * @returns {*}
 */
export default function runNow(observable) {
  const outcome = {done: false, failure: null, value: undefined};
  observable.subscribe(
    value => {
      outcome.value = value;
    },
    error => {
      outcome.failure = error;
    },
    () => {
      outcome.done = true;
    }
  );
  if (outcome.failure) {
    throw outcome.failure;
  }
  if (!outcome.done) {
    throw new Error('The step did not finish synchronously');
  }
  return outcome.value;
}
