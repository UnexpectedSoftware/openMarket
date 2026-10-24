/**
 * Criteria for the till's sell preferences. A value passed to `SellPreferencesRepository.find`.
 * It describes what to read. It is not a port, and it does not check a range.
 * The screen does not filter, so the value has no fields.
 */
export default class SellPreferencesQuery {

  constructor() {
    Object.freeze(this);
  }

}
