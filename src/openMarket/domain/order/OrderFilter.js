const defaultLimit = 10;
const defaultOffset = 0;
const defaultSorting = { createdAt: 'DESC' };

/**
 * @class OrderFilter
 */
export default class OrderFilter {

  constructor({ limit = defaultLimit, offset = defaultOffset, sort = defaultSorting } = {}) {

    this._limit = limit;
    this._offset = offset;
    this._sorting = sort;
    this._sort = sort;

  }


  get limit() {
    return this._limit;
  }

  get offset() {
    return this._offset;
  }

  get sort() {
    return this._sort;
  }
}
