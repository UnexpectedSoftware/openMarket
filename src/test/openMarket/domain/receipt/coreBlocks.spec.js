import {expect} from 'chai';
import {coreBlocks} from '../../../../openMarket/domain/receipt/coreBlocks';
import {formatEuroCents} from '../../../../openMarket/domain/money/formatEs';

function texts(payload) {
  return coreBlocks(payload).map(block => block.text);
}

describe('coreBlocks', () => {
  const payload = {
    issuer: {
      tradeName: 'Ultramarinos Pérez',
      legalName: 'Ultramarinos Pérez SL',
      nif: 'B12345674'
    },
    invoiceNumber: '2026/000042',
    issueDate: '2026-11-01',
    issuedAt: '2026-11-01T23:17:00+01:00',
    lines: [{
      name: 'Jamón ibérico de bellota',
      quantityMilli: 350,
      unitPriceCents: 1850,
      amountCents: 648
    }],
    totalCents: 648,
    vatBreakdown: [
      {kind: 'S1', percent: 10, cause: null, baseCents: 589, quotaCents: 59},
      {kind: 'E', percent: 0, cause: 'E1', baseCents: 0, quotaCents: 0},
      {kind: 'N', percent: 0, cause: 'N1', baseCents: 0, quotaCents: 0}
    ]
  };

  it('prints a Spanish simplified invoice', () => {
    const lines = texts(payload);
    expect(lines[0]).to.equal('Ultramarinos Pérez');
    expect(lines).to.include('NIF B12345674');
    expect(lines).to.include('FACTURA SIMPLIFICADA');
    expect(lines).to.include('2026/000042');
    expect(lines).to.include('01/11/2026 23:17');
    expect(lines.join('\n')).to.not.include('Date ');
    expect(lines.join('\n')).to.not.include('Total:');
    expect(lines.join('\n')).to.include('Jamón ibérico de be  0,35 x ' + formatEuroCents(1850));
    expect(lines.join('\n')).to.not.include('Jamón ibérico de bel');
    expect(lines).to.include('TOTAL ' + formatEuroCents(648));
    expect(lines).to.include('10 %  base ' + formatEuroCents(589) + '  cuota ' + formatEuroCents(59));
    expect(lines).to.include('Exento E1  base ' + formatEuroCents(0) + '  cuota ' + formatEuroCents(0));
    expect(lines).to.include('No sujeto N1  base ' + formatEuroCents(0) + '  cuota ' + formatEuroCents(0));
    const total = coreBlocks(payload).find(block => block.text && block.text.indexOf('TOTAL') === 0);
    expect(total.align).to.equal('right');
    expect(total.bold).to.equal(true);
  });

  it('uses the legal name and skips a blank date and a missing number', () => {
    const lines = texts({
      issuer: {legalName: 'Sol SL'},
      lines: [],
      totalCents: 0,
      vatBreakdown: []
    });
    expect(lines[0]).to.equal('Sol SL');
    expect(lines).to.include('FACTURA SIMPLIFICADA');
    expect(lines.join('\n')).to.not.include('NIF');
    expect(lines.join('\n')).to.not.match(/\d{2}\/\d{2}\/\d{4}/);
    expect(lines).to.include('TOTAL ' + formatEuroCents(0));
  });

  it('returns nothing for an empty payload', () => {
    expect(coreBlocks(null)).to.deep.equal([]);
    expect(coreBlocks(undefined)).to.deep.equal([]);
  });
});
