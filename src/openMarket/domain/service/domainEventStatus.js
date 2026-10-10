/**
 * Rows in domain_event_processing. Durable delivery moves a row through these.
 */
export const PENDING = 'PENDING';
export const PROCESSING = 'PROCESSING';
export const DONE = 'DONE';
export const FAILED = 'FAILED';
export const DEAD = 'DEAD';
