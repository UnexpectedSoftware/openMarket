/**
 * Persistence port for the domain event bus.
 * Implementations join the SQLite transaction already open on the connection.
 */
export default class DomainEventStore {

  /**
   * @returns {boolean}
   */
  inTransaction() {
    throw new Error('DomainEventStore#inTransaction must be implemented');
  }

  begin() {
    throw new Error('DomainEventStore#begin must be implemented');
  }

  commit() {
    throw new Error('DomainEventStore#commit must be implemented');
  }

  rollback() {
    throw new Error('DomainEventStore#rollback must be implemented');
  }

  /**
   * @param {{id: string, type: string, payload: string, aggregateId: string|null, createdAt: string}} record
   */
  insertEvent(record) {
    throw new Error('DomainEventStore#insertEvent must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberNames: string[], updatedAt: string}} record
   */
  insertPending(record) {
    throw new Error('DomainEventStore#insertPending must be implemented');
  }

  /**
   * @returns {Array.<{eventId: string, subscriberName: string, attempts: number}>}
   */
  listProcessing() {
    throw new Error('DomainEventStore#listProcessing must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberName: string, status: string, lastError: string|null, updatedAt: string}} record
   */
  finishInterrupted(record) {
    throw new Error('DomainEventStore#finishInterrupted must be implemented');
  }

  /**
   * @param {{subscriberName: string, ordered: boolean, retry: boolean}} query
   * @returns {{eventId: string, type: string, payload: string, status: string, attempts: number}|null}
   */
  nextFor(query) {
    throw new Error('DomainEventStore#nextFor must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberName: string, updatedAt: string}} record
   * @returns {number|null}
   */
  markProcessing(record) {
    throw new Error('DomainEventStore#markProcessing must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberName: string, updatedAt: string}} record
   */
  markDone(record) {
    throw new Error('DomainEventStore#markDone must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberName: string, lastError: string, dead: boolean, updatedAt: string}} record
   */
  markFailed(record) {
    throw new Error('DomainEventStore#markFailed must be implemented');
  }

}
