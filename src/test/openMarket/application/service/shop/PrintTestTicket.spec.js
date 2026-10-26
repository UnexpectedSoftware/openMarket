import {expect} from 'chai';
import * as Rx from 'rxjs';
import PrintTestTicket from '../../../../../openMarket/application/service/shop/PrintTestTicket';
import SellPreferencesView from '../../../../../openMarket/domain/shop/SellPreferencesView';
import ShopProfileView from '../../../../../openMarket/domain/shop/ShopProfileView';

function useCase(shop, sell, printed) {
  return new PrintTestTicket({
    shopProfileRepository: {find: () => Rx.Observable.of(shop)},
    sellPreferencesRepository: {find: () => Rx.Observable.of(sell)},
    orderPrinterService: {
      print({receipt}) {
        printed.push(receipt);
        return Rx.Observable.of(true);
      }
    }
  });
}

function texts(receipt) {
  return receipt.blocks.map(block => block.text);
}

describe('PrintTestTicket', () => {
  it('includes the trade name and the NIF from the shop view', done => {
    const printed = [];
    useCase(
      new ShopProfileView({
        nif: 'B12345674',
        legalName: 'Ultramarinos Pérez SL',
        tradeName: 'Ultramarinos Pérez'
      }),
      new SellPreferencesView({headerText: 'Hola', footerText: 'Adios'}),
      printed
    ).print().subscribe(() => {
      expect(printed).to.have.length(1);
      expect(texts(printed[0])).to.deep.equal([
        'Hola',
        'Ultramarinos Pérez',
        'NIF B12345674',
        'Prueba de impresión',
        'Adios'
      ]);
      expect(printed[0].blocks.every(block => block.type === 'text')).to.equal(true);
      done();
    }, done);
  });

  it('uses the legal name when the trade name is blank and skips empty copy', done => {
    const printed = [];
    useCase(
      new ShopProfileView({nif: null, legalName: '  Pérez SL  ', tradeName: '   '}),
      new SellPreferencesView({headerText: '  ', footerText: ''}),
      printed
    ).print().subscribe(() => {
      expect(texts(printed[0])).to.deep.equal(['Pérez SL', 'Prueba de impresión']);
      done();
    }, done);
  });

  it('uses OpenMarket when the shop has no name and omits a blank NIF', done => {
    const printed = [];
    useCase(
      new ShopProfileView({nif: '   ', legalName: ' ', tradeName: ''}),
      new SellPreferencesView(),
      printed
    ).print().subscribe(() => {
      expect(texts(printed[0])).to.deep.equal(['OpenMarket', 'Prueba de impresión']);
      done();
    }, done);
  });
});
