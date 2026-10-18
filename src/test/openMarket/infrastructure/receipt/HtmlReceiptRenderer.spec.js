import {expect} from 'chai';
import HtmlReceiptRenderer from '../../../../openMarket/infrastructure/receipt/HtmlReceiptRenderer';
import EscPosReceiptRenderer from '../../../../openMarket/infrastructure/printer/EscPosReceiptRenderer';
import {coreBlocks} from '../../../../openMarket/domain/receipt/coreBlocks';

describe('HtmlReceiptRenderer', () => {
  const payload = {
    issuer: {tradeName: 'Ultramarinos Pérez', nif: 'B12345674'},
    invoiceNumber: '2026/000001',
    issueDate: '2026-10-18',
    issuedAt: '12:00:00',
    lines: [{
      name: 'Leche',
      quantityMilli: 1000,
      unitPriceCents: 115,
      amountCents: 115
    }],
    totalCents: 115,
    vatBreakdown: [{kind: 'S1', percent: 4, cause: null, baseCents: 111, quotaCents: 4}]
  };

  function blocks() {
    return [
      {type: 'text', text: 'QR tributario:', align: 'center'},
      {type: 'qr', data: 'https://aeat.example/qr', sizeMm: 35, correction: 'M'},
      ...coreBlocks(payload),
      {type: 'text', text: 'VERI*FACTU'},
      {type: 'feed', lines: 1}
    ];
  }

  it('prints the same blocks the thermal renderer accepts', () => {
    const receipt = {blocks: blocks()};
    const calls = [];
    new EscPosReceiptRenderer().render({
      alignCenter() {},
      alignLeft() {},
      alignRight() {},
      bold() {},
      setTextNormal() {},
      println(text) { calls.push(text); },
      printQR(data) { calls.push(data); },
      drawLine() { calls.push('line'); },
      newLine() { calls.push('feed'); },
      cut() {}
    }, receipt);
    const html = new HtmlReceiptRenderer().render(receipt);
    expect(calls).to.include('QR tributario:');
    expect(calls).to.include('https://aeat.example/qr');
    expect(calls).to.include('VERI*FACTU');
    expect(html).to.include('QR tributario:');
    expect(html).to.include('https://aeat.example/qr');
    expect(html).to.include('Ultramarinos Pérez');
    expect(html).to.include('NIF B12345674');
    expect(html).to.include('2026/000001');
    expect(html).to.include('Leche');
    expect(html).to.include('Total: 1.15 €');
    expect(html).to.include('4 %');
    expect(html).to.include('VERI*FACTU');
    expect(html).to.include('om-receipt-feed');
    expect(html).to.include('var(--om-font-mono)');
    expect(html).to.include('var(--om-color-text)');
    expect(html).to.not.include('<script');
  });

  it('escapes text so a block cannot inject markup', () => {
    const html = new HtmlReceiptRenderer().render({
      blocks: [{type: 'text', text: 'A & B <tag>'}]
    });
    expect(html).to.include('A &amp; B &lt;tag&gt;');
    expect(html).to.not.include('<tag>');
  });
});
