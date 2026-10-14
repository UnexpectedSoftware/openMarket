/** @import DomainEventRepository from '../../domain/event/DomainEventRepository' */
/** @import SqliteConnection from '../service/SqliteConnection' */

const SAVE_EVENT_SQL =
  'INSERT INTO domain_event (id, type, payload, aggregate_id, created_at) VALUES (?, ?, ?, ?, ?)';

const FIND_UNDISPATCHED_SQL =
  'SELECT id, type, payload, aggregate_id AS aggregateId, created_at AS createdAt ' +
  'FROM domain_event WHERE dispatched_at IS NULL ORDER BY rowid ASC';

const MARK_DISPATCHED_SQL =
  'UPDATE domain_event SET dispatched_at = ? WHERE id = ?';

const FIND_SUBSCRIBER_SQL =
  'SELECT subscriber_name AS subscriberName, registered_at AS registeredAt ' +
  'FROM domain_event_subscriber WHERE subscriber_name = ?';

const SAVE_SUBSCRIBER_SQL =
  'INSERT INTO domain_event_subscriber (subscriber_name, registered_at) VALUES (?, ?) ' +
  'ON CONFLICT(subscriber_name) DO NOTHING';

const INSERT_PROCESSING_SQL =
  'INSERT INTO domain_event_processing ' +
  '(event_id, subscriber_name, status, attempts, last_error, updated_at) ' +
  'VALUES (?, ?, ?, ?, ?, ?) ' +
  'ON CONFLICT(event_id, subscriber_name) DO NOTHING';

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
 * SQLite collection for domain_event, domain_event_subscriber, and domain_event_processing.
 * Writes join the transaction already open on the connection.
 * @implements {DomainEventRepository}
 */
export default class SqliteDomainEventRepository {

  /**
   * @param {object} deps
   * @param {SqliteConnection} deps.connection
   */
  constructor({connection}) {
    this._database = connection.database;
    this._saveEvent = this._database.prepare(SAVE_EVENT_SQL);
    this._findUndispatched = this._database.prepare(FIND_UNDISPATCHED_SQL);
    this._markDispatched = this._database.prepare(MARK_DISPATCHED_SQL);
    this._findSubscriber = this._database.prepare(FIND_SUBSCRIBER_SQL);
    this._saveSubscriber = this._database.prepare(SAVE_SUBSCRIBER_SQL);
    this._insertProcessing = this._database.prepare(INSERT_PROCESSING_SQL);
    this._saveProcessing = this._database.prepare(SAVE_PROCESSING_SQL);
    this._findProcessingByStatus = this._database.prepare(FIND_PROCESSING_BY_STATUS_SQL);
  }

  save({id, type, payload, aggregateId, createdAt}) {
    this._saveEvent.run(id, type, payload, aggregateId, createdAt);
  }

  /**
   * @returns {{id: string, type: string, payload: string, aggregateId: string | null, createdAt: string}[]}
   */
  findUndispatched() {
    return this._findUndispatched.all().map(/** @param {{id: string, type: string, payload: string, aggregateId: string | null, createdAt: string}} row */ row => ({
      id: row.id,
      type: row.type,
      payload: row.payload,
      aggregateId: row.aggregateId,
      createdAt: row.createdAt
    }));
  }

  markDispatched({id, dispatchedAt}) {
    this._markDispatched.run(dispatchedAt, id);
  }

  /**
   * @param {{subscriberName: string}} query
   * @returns {{subscriberName: string, registeredAt: string} | null}
   */
  findSubscriber({subscriberName}) {
    const row = this._findSubscriber.get(subscriberName);
    if (!row) {
      return null;
    }
    return {
      subscriberName: /** @type {string} */ (row.subscriberName),
      registeredAt: /** @type {string} */ (row.registeredAt)
    };
  }

  saveSubscriber({subscriberName, registeredAt}) {
    this._saveSubscriber.run(subscriberName, registeredAt);
  }

  insertProcessing({eventId, subscriberName, status, attempts, lastError, updatedAt}) {
    this._insertProcessing.run(eventId, subscriberName, status, attempts, lastError, updatedAt);
  }

  saveProcessing({eventId, subscriberName, status, attempts, lastError, updatedAt}) {
    this._saveProcessing.run(eventId, subscriberName, status, attempts, lastError, updatedAt);
  }

  /**
   * @param {{status: string}} query
   * @returns {{eventId: string, subscriberName: string, status: string, attempts: number, lastError: string | null}[]}
   */
  findProcessingByStatus({status}) {
    return this._findProcessingByStatus.all(status).map(/** @param {{eventId: string, subscriberName: string, status: string, attempts: number, lastError: string | null}} row */ row => ({
      eventId: row.eventId,
      subscriberName: row.subscriberName,
      status: row.status,
      attempts: Number(row.attempts),
      lastError: row.lastError
    }));
  }

  /**
   * @param {{subscriberName: string, statuses: string[]}} query
   * @returns {{eventId: string, subscriberName: string, type: string, payload: string, status: string, attempts: number, lastError: string | null} | null}
   */
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
      eventId: /** @type {string} */ (row.eventId),
      subscriberName: /** @type {string} */ (row.subscriberName),
      type: /** @type {string} */ (row.type),
      payload: /** @type {string} */ (row.payload),
      status: /** @type {string} */ (row.status),
      attempts: Number(row.attempts),
      lastError: /** @type {string | null} */ (row.lastError)
    };
  }

}
