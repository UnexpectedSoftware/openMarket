/**
 * Criteria for the shop profile screen. A value passed to `ShopProfileRepository.find`.
 * It describes what to read. It is not a port, and it does not check a range.
 * The screen does not filter, so the value has no fields.
 */
export default class ShopProfileQuery {

  constructor() {
    Object.freeze(this);
  }

}
