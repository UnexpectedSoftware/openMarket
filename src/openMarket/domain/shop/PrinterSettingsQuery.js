/**
 * Criteria for the till's printer. A value passed to `PrinterSettingsRepository.find`.
 * It describes what to read. It is not a port, and it does not check a range.
 * The screen does not filter, so the value has no fields.
 */
export default class PrinterSettingsQuery {

  constructor() {
    Object.freeze(this);
  }

}
