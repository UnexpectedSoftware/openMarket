import {expect} from 'chai';
import Money from '../../../../../openMarket/domain/money/Money';
import Quantity from '../../../../../openMarket/domain/money/Quantity';
import {
  formatQuantity,
  lineCaption,
  ticketCountLabel,
  vatIncludedLabel,
  weightLabel
} from '../../../../../openMarket/user_interface/order/new_order/caption';

describe('ticket captions', () => {
  const unit = {
    kind: 'PRODUCT',
    name: 'Pan',
    unitPrice: Money.from(1.15),
    quantity: Quantity.from(2),
    weighted: false
  };
  const weighed = {
    kind: 'PRODUCT',
    name: 'Tomate',
    unitPrice: Money.from(2.4),
    quantity: Quantity.from(0.75),
    weighted: true
  };

  it('formats a unit price, a weight, and the ticket counts', () => {
    expect(formatQuantity(Quantity.from(0.75), 3)).to.equal('0,750');
    expect(formatQuantity(null, 3)).to.equal('');
    expect(formatQuantity('nope', 3)).to.equal('');
    expect(lineCaption(unit)).to.contain('/ ud');
    expect(lineCaption(weighed)).to.contain('0,75 kg ×');
    expect(lineCaption(weighed)).to.contain('/kg');
    expect(lineCaption({kind: 'FREE', unitPrice: Money.from(3.5)})).to.not.contain('/ ud');
    expect(lineCaption(null)).to.equal('');
    expect(weightLabel(weighed)).to.equal('0,75 kg');
    expect(weightLabel(unit)).to.equal('');
    expect(weightLabel(null)).to.equal('');
    expect(ticketCountLabel({lineCount: 4, articleCount: 7})).to.equal('4 líneas · 7 artículos');
    expect(ticketCountLabel({lineCount: 1, articleCount: 1})).to.equal('1 línea · 1 artículo');
    expect(ticketCountLabel(null)).to.equal('0 líneas · 0 artículos');
    expect(vatIncludedLabel(['4 %', '10 %', '21 %'])).to.equal('IVA incluido (4 % · 10 % · 21 %)');
    expect(vatIncludedLabel([])).to.equal('IVA incluido');
    expect(vatIncludedLabel(null)).to.equal('IVA incluido');
  });
});
