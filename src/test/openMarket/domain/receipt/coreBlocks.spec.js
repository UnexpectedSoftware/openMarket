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
      nif: 'B12345674',
      phone: '600111222',
      address: {
        street: 'Mayor 1',
        postalCode: '28013',
        city: 'Madrid',
        province: 'Madrid',
        country: 'ES'
      }
    },
    invoiceNumber: '2026/000042',
    issueDate: '2026-11-01',
    issuedAt: '2026-11-01T23:17:00+01:00',
    lines: [{
      name: 'Jamón ibérico de bellota',
      quantityMilli: 350,
      unitPriceCents: 1850,
      amountCents: 648,
      weighted: true
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
    expect(lines).to.include('Mayor 1');
    expect(lines).to.include('28013 Madrid');
    expect(lines.filter(line => line === 'Madrid')).to.deep.equal([]);
    expect(lines).to.not.include('ES');
    expect(lines).to.include('Tel. 600111222');
    expect(lines).to.include('NIF B12345674');
    expect(lines).to.include('FACTURA SIMPLIFICADA');
    expect(lines).to.include('2026/000042');
    expect(lines).to.include('01/11/2026 23:17');
    expect(lines.join('\n')).to.not.include('Date ');
    expect(lines.join('\n')).to.not.include('Total:');
    expect(lines.join('\n')).to.include(
      'Jamón ibérico de be  0,35 kg x ' + formatEuroCents(1850) + '/kg'
    );
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

  it('prints a foreign country and skips a blank street', () => {
    const lines = texts({
      issuer: {
        tradeName: 'Sol',
        phone: '1',
        address: {street: '', postalCode: '75001', city: 'Paris', province: 'Paris', country: 'FR'}
      },
      totalCents: 0
    });
    expect(lines).to.include('75001 Paris');
    expect(lines).to.include('FR');
    expect(lines).to.include('Tel. 1');
    expect(lines.filter(line => line === 'Paris')).to.deep.equal([]);
  });

  it('prints cash notes and the card method alone', () => {
    const cash = texts({
      totalCents: 1000,
      payment: {method: 'cash', tenderedCents: 2000, changeCents: 1000}
    });
    expect(cash).to.include('Efectivo');
    expect(cash.join('\n')).to.include('Entregado ' + formatEuroCents(2000));
    expect(cash.join('\n')).to.include('Cambio ' + formatEuroCents(1000));
    const card = texts({
      totalCents: 1000,
      payment: {method: 'card', tenderedCents: 1000, changeCents: 0}
    });
    expect(card).to.include('Tarjeta');
    expect(card.join('\n')).to.not.include('Entregado');
    expect(card.join('\n')).to.not.include('Cambio');
    const split = texts({
      totalCents: 1313,
      payment: {
        method: 'mixed',
        parts: [{method: 'cash', amountCents: 1000}, {method: 'bizum', amountCents: 313}]
      }
    });
    expect(split).to.include('Mixto');
    expect(split.join('\n')).to.include('Bizum ' + formatEuroCents(313));
    expect(texts({totalCents: 100, payment: {method: 'bizum'}})).to.include('Bizum');
  });

  it('returns nothing for an empty payload', () => {
    expect(coreBlocks(null)).to.deep.equal([]);
    expect(coreBlocks(undefined)).to.deep.equal([]);
  });
});
