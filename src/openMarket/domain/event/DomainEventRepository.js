/**
 * Collection of stored domain events, subscriber registration times, and processing rows.
 * Saving and finding only. Retries and dead letters stay on the bus.
 * The caller owns the transaction around a claim.
 */
export default class DomainEventRepository {

  /**
   * @param {{id: string, type: string, payload: string, aggregateId: string|null, createdAt: string}} event
   */
  save(event) {
    throw new Error('DomainEventRepository#save must be implemented');
  }

  /**
   * Events whose durable subscribers have not been recorded yet, oldest first.
   * @returns {Array.<{id: string, type: string, payload: string, aggregateId: string|null, createdAt: string}>}
   */
  findUndispatched() {
    throw new Error('DomainEventRepository#findUndispatched must be implemented');
  }

  /**
   * @param {string} id
   * @param {string} dispatchedAt
   */
  markDispatched({id, dispatchedAt}) {
    throw new Error('DomainEventRepository#markDispatched must be implemented');
  }

  /**
   * @param {string} subscriberName
   * @returns {{subscriberName: string, registeredAt: string}|null}
   */
  findSubscriber({subscriberName}) {
    throw new Error('DomainEventRepository#findSubscriber must be implemented');
  }

  /**
   * Keeps the first registration time. A later call for the same name does nothing.
   * @param {string} subscriberName
   * @param {string} registeredAt
   */
  saveSubscriber({subscriberName, registeredAt}) {
    throw new Error('DomainEventRepository#saveSubscriber must be implemented');
  }

  /**
   * Inserts a processing row. An existing row for the same event and subscriber is left as it is.
   * @param {{eventId: string, subscriberName: string, status: string, attempts: number, lastError: string|null, updatedAt: string}} processing
   */
  insertProcessing(processing) {
    throw new Error('DomainEventRepository#insertProcessing must be implemented');
  }

  /**
   * @param {{eventId: string, subscriberName: string, status: string, attempts: number, lastError: string|null, updatedAt: string}} processing
   */
  saveProcessing(processing) {
    throw new Error('DomainEventRepository#saveProcessing must be implemented');
  }

  /**
   * @param {string} status
   * @returns {Array.<{eventId: string, subscriberName: string, status: string, attempts: number, lastError: string|null}>}
   */
  findProcessingByStatus({status}) {
    throw new Error('DomainEventRepository#findProcessingByStatus must be implemented');
  }

  /**
   * Oldest processing row for a subscriber whose status is one of the given values.
   * @param {string} subscriberName
   * @param {string[]} statuses
   * @returns {{eventId: string, subscriberName: string, type: string, payload: string, status: string, attempts: number, lastError: string|null}|null}
   */
  findFirstProcessing({subscriberName, statuses}) {
    throw new Error('DomainEventRepository#findFirstProcessing must be implemented');
  }

}
