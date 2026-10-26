/**
 * Criteria for the till's locale. A value passed to `LanguagePreferencesRepository.find`.
 * It describes what to read. It is not a port, and it does not check a range.
 * The screen does not filter, so the value has no fields.
 */
export default class LanguagePreferencesQuery {

  constructor() {
    Object.freeze(this);
  }

}
