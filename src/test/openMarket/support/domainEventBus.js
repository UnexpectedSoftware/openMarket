import DomainEventBus from '../../../openMarket/domain/service/DomainEventBus';

/**
 * Bus whose transaction is already closed, so publish notifies live listeners at once.
 * @returns {DomainEventBus}
 */
export function deliveringDomainEventBus() {
  let sequence = 0;
  return new DomainEventBus({
    repository: {
      save() {},
      saveProcessing() {},
      findProcessingByStatus() {
        return [];
      },
      findFirstProcessing() {
        return null;
      }
    },
    transaction: {
      inTransaction() {
        return false;
      },
      execute(work) {
        return work();
      }
    },
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
    },
    intervalMs: 60000
  });
}
