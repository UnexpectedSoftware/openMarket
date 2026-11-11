import {dropInvoiceGuards, installInvoiceGuards} from '../service/SqliteConnection';

/**
 * Deletes the shop rows a demo reset replaces. Schema migrations stay.
 * Invoice guards are dropped for the delete and installed again, so the demo sales
 * that follow are guarded like any other. Subscriber registrations go with the events,
 * so subscribers registered by the next bootstrap start from its clock. These DELETEs remove state; they create none.
 * @param {{exec: Function}} database
 */
export function clearShopData(database) {
  dropInvoiceGuards(database);
  database.exec('DELETE FROM domain_event_processing');
  database.exec('DELETE FROM domain_event');
  database.exec('DELETE FROM domain_event_subscriber');
  database.exec('DELETE FROM invoice_vat');
  database.exec('DELETE FROM invoice_line');
  database.exec('DELETE FROM invoice');
  database.exec('DELETE FROM invoice_sequence');
  database.exec('DELETE FROM setting');
  database.exec('DELETE FROM line');
  database.exec('DELETE FROM "order"');
  database.exec('DELETE FROM product_sale_order');
  database.exec('DELETE FROM product_sale_day');
  database.exec('DELETE FROM product');
  database.exec('DELETE FROM category');
  database.exec('DELETE FROM plugin_secret');
  database.exec('DELETE FROM plugin_state');
  installInvoiceGuards(database);
}
