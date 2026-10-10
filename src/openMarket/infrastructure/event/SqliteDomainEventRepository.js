import DomainEventRepository from '../../domain/event/DomainEventRepository';

const SAVE_EVENT_SQL =
  'INSERT INTO domain_event (id, type, payload, aggregate_id, created_at) VALUES (?, ?, ?, ?, ?)';

const SAVE_PROCESSING_SQL =
  'INSERT INTO domain_event_processing ' +
  '(event_id, subscriber_name, status, attempts, last_error, updated_at) ' +
  'VALUES (?, ?, ?, ?, ?, ?) ' +
  'ON CONFLICT(event_id, subscriber_name) DO UPDATE SET ' +
  'status = excluded.status, attempts = excluded.attempts, ' +
  'last_error = excluded.last_error, updated_at = excluded.updated_at';

const FIND_PROCESSING_BY_STATUS_SQL =
  'SELECT event_id AS eventId, subscriber_name AS subscriberName, status, attempts, ' +
  'last_error AS lastError FROM domain_event_processing WHERE status = ?';

const FIND_FIRST_PROCESSING_SQL =
  'SELECT e.id AS eventId, e.type AS type, e.payload AS payload, ' +
  'p.subscriber_name AS subscriberName, p.status AS status, p.attempts AS attempts, ' +
  'p.last_error AS lastError ' +
  'FROM domain_event_processing p INNER JOIN domain_event e ON e.id = p.event_id ' +
  'WHERE p.subscriber_name = ? AND p.status IN (';

const FIND_FIRST_PROCESSING_ORDER_SQL = ') ORDER BY e.rowid ASC LIMIT 1';

/**
 * SQLite collection for domain_event and domain_event_processing.
 * Writes join the transaction already open on the connection.
 */
export default class SqliteDomainEventRepository extends DomainEventRepository {

  /**
   * @param {SqliteConnection} connection
   */
  constructor({connection}) {
    super();
    this._database = connection.database;
    this._saveEvent = this._database.prepare(SAVE_EVENT_SQL);
    this._saveProcessing = this._database.prepare(SAVE_PROCESSING_SQL);
    this._findProcessingByStatus = this._database.prepare(FIND_PROCESSING_BY_STATUS_SQL);
  }

  save({id, type, payload, aggregateId, createdAt}) {
    this._saveEvent.run(id, type, payload, aggregateId, createdAt);
  }

  saveProcessing({eventId, subscriberName, status, attempts, lastError, updatedAt}) {
    this._saveProcessing.run(eventId, subscriberName, status, attempts, lastError, updatedAt);
  }

  findProcessingByStatus({status}) {
    return this._findProcessingByStatus.all(status).map(row => ({
      eventId: row.eventId,
      subscriberName: row.subscriberName,
      status: row.status,
      attempts: Number(row.attempts),
      lastError: row.lastError
    }));
  }

  findFirstProcessing({subscriberName, statuses}) {
    if (!statuses || statuses.length === 0) {
      return null;
    }
    const marks = statuses.map(() => '?').join(', ');
    const row = this._database.prepare(FIND_FIRST_PROCESSING_SQL + marks + FIND_FIRST_PROCESSING_ORDER_SQL)
      .get(subscriberName, ...statuses);
    if (!row) {
      return null;
    }
    return {
      eventId: row.eventId,
      subscriberName: row.subscriberName,
      type: row.type,
      payload: row.payload,
      status: row.status,
      attempts: Number(row.attempts),
      lastError: row.lastError
    };
  }

}
