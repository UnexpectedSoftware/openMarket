import DomainEventBus from '../../../openMarket/domain/service/DomainEventBus';

/**
 * In-memory event store for unit tests.
 * @returns {DomainEventRepository}
 */
export function memoryDomainEventRepository() {
  const events = [];
  const processing = [];
  const processingWrites = [];
  const subscribers = new Map();
  return {
    events,
    processing,
    processingWrites,
    save(event) {
      events.push({...event, dispatchedAt: null});
    },
    findUndispatched() {
      return events.filter(event => event.dispatchedAt == null).map(event => ({...event}));
    },
    markDispatched({id, dispatchedAt}) {
      const event = events.find(item => item.id === id);
      if (event) {
        event.dispatchedAt = dispatchedAt;
      }
    },
    findSubscriber({subscriberName}) {
      const registeredAt = subscribers.get(subscriberName);
      if (!registeredAt) {
        return null;
      }
      return {subscriberName, registeredAt};
    },
    saveSubscriber({subscriberName, registeredAt}) {
      if (!subscribers.has(subscriberName)) {
        subscribers.set(subscriberName, registeredAt);
      }
    },
    insertProcessing(row) {
      const stored = {...row};
      processingWrites.push(stored);
      const index = processing.findIndex(item =>
        item.eventId === stored.eventId && item.subscriberName === stored.subscriberName);
      if (index === -1) {
        processing.push({...stored});
      }
    },
    saveProcessing(row) {
      const stored = {...row};
      processingWrites.push(stored);
      const index = processing.findIndex(item =>
        item.eventId === stored.eventId && item.subscriberName === stored.subscriberName);
      if (index === -1) {
        processing.push({...stored});
        return;
      }
      processing[index] = {...stored};
    },
    findProcessingByStatus({status}) {
      return processing.filter(row => row.status === status).map(row => ({...row}));
    },
    findFirstProcessing({subscriberName, statuses}) {
      const row = processing.find(item =>
        item.subscriberName === subscriberName && statuses.includes(item.status));
      if (!row) {
        return null;
      }
      const event = events.find(item => item.id === row.eventId);
      return {
        eventId: row.eventId,
        subscriberName: row.subscriberName,
        type: event.type,
        payload: event.payload,
        status: row.status,
        attempts: row.attempts,
        lastError: row.lastError
      };
    }
  };
}

/**
 * Bus with a closed transaction and an in-memory event store.
 * save stores the event. raise notifies in-memory listeners.
 * @returns {DomainEventBus}
 */
export function deliveringDomainEventBus() {
  let sequence = 0;
  return new DomainEventBus({
    repository: memoryDomainEventRepository(),
    identity: {
      generate() {
        sequence += 1;
        return 'event-' + sequence;
      }
    },
    clock: {
      now() {
        return '2026-10-11T12:00:00.000Z';
      }
    }
  });
}
