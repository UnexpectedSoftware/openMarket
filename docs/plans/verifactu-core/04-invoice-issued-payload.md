# 04 — Versioned InvoiceIssued / InvoiceCancelled payload (public plugin API)

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/04-invoice-issued-payload.md` in OpenMarket (after plans 01–03). Define a versioned payload contract (`schemaVersion: 1`) for `InvoiceIssued` and `InvoiceCancelled` carrying everything a fiscal plugin needs, build it in one place from the `Invoice` aggregate, document it as public API in `docs/domain-event-bus.md` and `docs/plugins.md`, and add contract tests. One PR, `Version: minor`.

## Goal
Plugins (VeriFactu first) get every fiscal fact from the event payload, never from core tables. The payload is a documented, versioned, tested contract.

## Context
- `domain/event/InvoiceIssued.js` / `InvoiceCancelled.js`: today `{id, series, number, invoiceNumber, issuedAt, orderId, lines[{barcode,name,price,quantity,amount}], total}` (+ `cancelledAt`), euros as floats.
- Built by `facts(invoice)` in `application/service/order/CreateOrder.js` and inline in `application/service/invoice/CancelInvoice.js`.
- Registry: `domain/event/registry.js` (`hydrate`, `typeName`); plugins receive `events` from `PluginHost` (`infrastructure/plugins/PluginHost.js`). Durable events are stored as JSON in `domain_event.payload`, so old rows keep the old shape.

## Contract v1
~~~json
{
  "schemaVersion": 1,
  "invoiceId": "6f1c…",
  "type": "F2",
  "series": "2026",
  "number": 42,
  "invoiceNumber": "2026/000042",
  "issueDate": "2026-10-15",
  "issuedAt": "2026-10-15T22:41:07+02:00",
  "orderId": "a9e0…",
  "currency": "EUR",
  "issuer": {
    "nif": "B12345674",
    "legalName": "Ultramarinos Pérez SL",
    "tradeName": "Ultramarinos Pérez",
    "address": {"street": "Calle Mayor 1", "postalCode": "28013", "city": "Madrid", "province": "Madrid", "country": "ES"}
  },
  "lines": [
    {"position": 0, "barcode": "8410000000001", "name": "Leche", "unitPriceCents": 95, "quantityMilli": 2000,
     "amountCents": 190, "vat": {"kind": "S1", "percent": 4, "cause": null}},
    {"position": 1, "barcode": "2000000000002", "name": "Jamón (kg)", "unitPriceCents": 1850, "quantityMilli": 350,
     "amountCents": 648, "vat": {"kind": "S1", "percent": 10, "cause": null}}
  ],
  "vatBreakdown": [
    {"kind": "S1", "percent": 4, "cause": null, "baseCents": 183, "quotaCents": 7, "grossCents": 190},
    {"kind": "S1", "percent": 10, "cause": null, "baseCents": 589, "quotaCents": 59, "grossCents": 648}
  ],
  "totalCents": 838,
  "vatTotalCents": 66,
  "corrects": null
}
~~~
`InvoiceCancelled` v1 = the same identifying fields (`schemaVersion`, `invoiceId`, `type`, `series`, `number`, `invoiceNumber`, `issueDate`, `issuedAt`, `issuer`, `totalCents`) plus `cancelledAt` (offset ISO) and `reason` (nullable). Rules: amounts are integer cents; only additive changes within a version; removing/renaming a field means `schemaVersion: 2` and both versions documented; fields are never `undefined` (use `null`).

## Steps
1. `domain/invoice/invoicePayload.js` — `issuedPayload(invoice)` / `cancelledPayload(invoice, {reason})`: the only builders. `CreateOrder` and `CancelInvoice` use them (delete `facts`).
2. Events: constructors accept the payload and freeze nested objects; `static get schemaVersion() { return 1; }`.
3. Old stored rows: `hydrate` of an `InvoiceIssued` row without `schemaVersion` maps to v0 → document that durable subscribers registered after this release never see v0 (registration-time skip), and add an upcaster only if needed.
4. Docs: a "Public event payloads" section in `docs/domain-event-bus.md` and a table in `docs/plugins.md` (field, type, meaning, since version), linking the JSON example.
5. Contract test fixture `src/test/openMarket/contracts/fixtures/InvoiceIssued.v1.json` (+ Cancelled) used by tests and quoted by the plugin repo.

## Tests
- `src/test/openMarket/contracts/invoicePayload.spec.js`: payload from a sample invoice deep-equals the fixture; every documented key present; no floats in `*Cents`/`*Milli`; `vatBreakdown` sums to `totalCents`; JSON round-trip through `hydrate` keeps it equal.
- `CreateOrder.spec.js`/`CancelInvoice.spec.js`: the saved events use the builders.
- A doc test that every key in the fixture appears in `docs/plugins.md` (keeps docs honest).

## Acceptance criteria
- One builder per event; payload matches the documented v1 contract and fixture; docs updated; contract tests green.
- The VeriFactu plugin can build RegistroAlta/RegistroAnulacion from the payload alone.

## Out of scope
R5 events (designed in plan 03; when implemented they reuse this contract with `type: 'R5'` and `corrects`), plugin-side code.

**Version: minor**
