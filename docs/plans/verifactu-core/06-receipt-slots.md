# 06 — Receipt blocks for plugins

> **Grok Build prompt:** Implement `docs/plans/verifactu-core/06-receipt-slots.md` in OpenMarket (after plan 04). Add a minimal receipt block model and a `receipt.header.fiscal` / `receipt.footer` slot so a plugin can add a QR image and a legend to the printed ticket, render it in `OrderPrinterService`, and expose `context.receipt.register(...)` to plugins. One PR, `Version: minor`. Can land any time before plugin phase 5.

## Goal
Smallest API that lets the VeriFactu plugin print "QR tributario:", the QR (30–40 mm, error correction M) and "VERI*FACTU" at the very top of the ticket (AEAT QR spec, Orden HAC/1177/2024), without core knowing VeriFactu. First step of #106 (printer-agnostic blocks) and #105 (named slots); OM-31 #94.

## Context
- `infrastructure/printer/OrderPrinterService.js` hard-codes the ticket layout via `node-thermal-printer` calls (`println`, `tableCustom`, `drawLine`); `PrinterConnection.print(cb)` wraps the device.
- Printing is triggered from the UI: `user_interface/order/new_order/epic.js` gets `orderPrinterService` straight from the container (architecture KNOWN_VIOLATION style) and `epicFactory.js` (`makePrinterDialogEpic`, `makePrintButtonClickedEpic`) calls `print({order})` with a UI-shaped order.

## Design
- **Block model** (`domain/receipt/ReceiptBlock.js`, plain data, validated): `{type: 'text', text, align?, bold?, size?}`, `{type: 'qr', data, sizeMm (30–40), correction: 'M'}`, `{type: 'line'}`, `{type: 'feed', lines}`. Image/barcode blocks later (#106).
- **Slots:** `receipt.header.fiscal` (rendered before anything else) and `receipt.footer`. Registry `infrastructure/receipt/ReceiptSlots.js`: `register({pluginId, slot, render})` where `render(invoicePayload) → ReceiptBlock[]` (sync, pure, fast; given the v1 payload from plan 04). Errors in a plugin renderer are logged and that slot renders nothing (the ticket still prints).
- **Use case** `application/service/receipt/BuildReceipt.js`: loads the invoice for the order (`InvoiceRepository.findByOrderId` — add to port + adapter), builds the payload (plan 04 builder), returns `ReceiptDocument {blocks}` = fiscal slot blocks + core blocks (issuer, number, date, lines, VAT breakdown, total) + footer slot blocks. Facade key `receipts_build_use_case`; the UI epic calls it and then the printer — removing the direct container access from `new_order/epic.js`.
- **Renderer:** `infrastructure/printer/EscPosReceiptRenderer.js` maps blocks to `node-thermal-printer` (`printQR(data, {cellSize, correction: 'M', model: 2})`, size computed from paper width setting; default 80 mm). `OrderPrinterService.print({receipt})` renders blocks only.
- **Plugin context:** `receipt: {register(slot, render)}` scoped to the plugin id (additive to apiVersion 1; document in `docs/plugins.md`). Requires the plugin's local registration to exist when printing — the plugin's renderer reads its own table (`verifactu_registration`) by `invoiceId` from the payload.

## Steps
1. Block model + validation; slots registry; container factories.
2. `InvoiceRepository.findByOrderId`; `BuildReceipt` use case; facade key.
3. ESC/POS renderer; `OrderPrinterService` prints a `ReceiptDocument`.
4. UI epics call `receipts_build_use_case` then print; drop the container import from `new_order/epic.js` (and its KNOWN_VIOLATIONS entry if listed).
5. `PluginHost` exposes `receipt.register`; docs.

## Tests
- Unit: slot order (fiscal first, footer last); a throwing plugin renderer yields an empty slot and the ticket still builds; QR block rejects size outside 30–40 mm and correction ≠ M.
- Unit: `EscPosReceiptRenderer` with a fake printer — `printQR` called with correction M before the shop header.
- Snapshot test of the core blocks for a sample invoice (issuer, number, breakdown, total).
- e2e: fixture plugin registers a fiscal block; printing with a fake device records the QR call first.

## Acceptance criteria
- A plugin can add text + QR to the top or bottom of the ticket via `context.receipt.register`; nothing VeriFactu-specific in core.
- Ticket shows issuer, invoice number/date and VAT breakdown from the invoice.
- Tests + typecheck + e2e green.

## Out of scope
HTML receipt preview (#106 follow-up), image/barcode blocks, receipt templates editor, UI slots outside the receipt (#105 rest).

**Version: minor**
