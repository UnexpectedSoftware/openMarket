/**
 * Collection of stored domain events and the processing row of each subscriber.
 * Saving and finding only. Retries, dead letters, and transactions stay outside.
 */
export default class DomainEventRepository {

  /**
   * @param {{id: string, type: string, payload: string, aggregateId: string|null, createdAt: string}} event
   */
  save(event) {
    throw new Error('DomainEventRepository#save must be implemented');
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
