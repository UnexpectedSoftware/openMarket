import DomainEventStore from '../../domain/service/DomainEventStore';
import {DEAD, DONE, FAILED, PENDING, PROCESSING} from '../../domain/service/domainEventStatus';

const INSERT_EVENT_SQL =
  'INSERT INTO domain_event (id, type, payload, aggregate_id, created_at) VALUES (?, ?, ?, ?, ?)';

const INSERT_PENDING_SQL =
  'INSERT INTO domain_event_processing ' +
  '(event_id, subscriber_name, status, attempts, last_error, updated_at) ' +
  'VALUES (?, ?, ?, 0, NULL, ?)';

const LIST_PROCESSING_SQL =
  'SELECT event_id AS eventId, subscriber_name AS subscriberName, attempts ' +
  'FROM domain_event_processing WHERE status = ?';

const FINISH_INTERRUPTED_SQL =
  'UPDATE domain_event_processing SET status = ?, last_error = COALESCE(?, last_error), updated_at = ? ' +
  'WHERE event_id = ? AND subscriber_name = ? AND status = ?';

const NEXT_INCOMPLETE_SQL =
  'SELECT e.id AS eventId, e.type AS type, e.payload AS payload, p.status AS status, p.attempts AS attempts ' +
  'FROM domain_event_processing p INNER JOIN domain_event e ON e.id = p.event_id ' +
  'WHERE p.subscriber_name = ? AND p.status IN (?, ?) ORDER BY e.rowid ASC LIMIT 1';

const NEXT_STATUS_SQL =
  'SELECT e.id AS eventId, e.type AS type, e.payload AS payload, p.status AS status, p.attempts AS attempts ' +
  'FROM domain_event_processing p INNER JOIN domain_event e ON e.id = p.event_id ' +
  'WHERE p.subscriber_name = ? AND p.status = ? ORDER BY e.rowid ASC LIMIT 1';

const MARK_PROCESSING_SQL =
  'UPDATE domain_event_processing SET status = ?, attempts = attempts + 1, updated_at = ? ' +
  'WHERE event_id = ? AND subscriber_name = ? AND status IN (?, ?) RETURNING attempts';

const MARK_DONE_SQL =
  'UPDATE domain_event_processing SET status = ?, last_error = NULL, updated_at = ? ' +
  'WHERE event_id = ? AND subscriber_name = ? AND status = ?';

const MARK_FAILED_SQL =
  'UPDATE domain_event_processing SET status = ?, last_error = ?, updated_at = ? ' +
  'WHERE event_id = ? AND subscriber_name = ? AND status = ?';

/**
 * Writes domain events on the shared SQLite connection.
 * insertEvent and insertPending join a transaction that is already open.
 */
export default class SqliteDomainEventStore extends DomainEventStore {

  /**
   * @param {SqliteConnection} connection
   */
  constructor({connection}) {
    super();
    this._database = connection.database;
    this._insertEvent = this._database.prepare(INSERT_EVENT_SQL);
    this._insertPending = this._database.prepare(INSERT_PENDING_SQL);
    this._listProcessing = this._database.prepare(LIST_PROCESSING_SQL);
    this._finishInterrupted = this._database.prepare(FINISH_INTERRUPTED_SQL);
    this._nextIncomplete = this._database.prepare(NEXT_INCOMPLETE_SQL);
    this._nextStatus = this._database.prepare(NEXT_STATUS_SQL);
    this._markProcessing = this._database.prepare(MARK_PROCESSING_SQL);
    this._markDone = this._database.prepare(MARK_DONE_SQL);
    this._markFailed = this._database.prepare(MARK_FAILED_SQL);
  }

  inTransaction() {
    return this._database.isTransaction;
  }

  begin() {
    this._database.exec('BEGIN');
  }

  commit() {
    this._database.exec('COMMIT');
  }

  rollback() {
    try {
      this._database.exec('ROLLBACK');
    } catch (error) {
      // A failed statement can already have ended the transaction.
    }
  }

  insertEvent({id, type, payload, aggregateId, createdAt}) {
    this._insertEvent.run(id, type, payload, aggregateId, createdAt);
  }

  insertPending({eventId, subscriberNames, updatedAt}) {
    (subscriberNames || []).forEach(name => {
      this._insertPending.run(eventId, name, PENDING, updatedAt);
    });
  }

  listProcessing() {
    return this._listProcessing.all(PROCESSING).map(row => ({
      eventId: row.eventId,
      subscriberName: row.subscriberName,
      attempts: Number(row.attempts)
    }));
  }

  finishInterrupted({eventId, subscriberName, status, lastError, updatedAt}) {
    this._finishInterrupted.run(
      status,
      lastError,
      updatedAt,
      eventId,
      subscriberName,
      PROCESSING
    );
  }

  nextFor({subscriberName, ordered, retry}) {
    if (ordered) {
      const row = this._nextIncomplete.get(subscriberName, PENDING, FAILED);
      if (!row || (row.status === FAILED && !retry)) {
        return null;
      }
      return this._waiting(row);
    }
    const pending = this._nextStatus.get(subscriberName, PENDING);
    if (pending) {
      return this._waiting(pending);
    }
    if (!retry) {
      return null;
    }
    const failed = this._nextStatus.get(subscriberName, FAILED);
    return failed ? this._waiting(failed) : null;
  }

  markProcessing({eventId, subscriberName, updatedAt}) {
    const row = this._markProcessing.get(
      PROCESSING,
      updatedAt,
      eventId,
      subscriberName,
      PENDING,
      FAILED
    );
    if (!row) {
      return null;
    }
    return Number(row.attempts);
  }

  markDone({eventId, subscriberName, updatedAt}) {
    this._markDone.run(DONE, updatedAt, eventId, subscriberName, PROCESSING);
  }

  markFailed({eventId, subscriberName, lastError, dead, updatedAt}) {
    this._markFailed.run(
      dead ? DEAD : FAILED,
      lastError,
      updatedAt,
      eventId,
      subscriberName,
      PROCESSING
    );
  }

  _waiting(row) {
    return {
      eventId: row.eventId,
      type: row.type,
      payload: row.payload,
      status: row.status,
      attempts: Number(row.attempts)
    };
  }

}
