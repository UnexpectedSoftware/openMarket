import {expect} from 'chai';
import * as Rx from 'rxjs';
import CatalogPrinterService from '../../../../openMarket/infrastructure/printer/CatalogPrinterService';

function recordingConnection() {
  const jobs = [];
  return {
    jobs,
    print(fill) {
      const lines = [];
      fill({
        alignCenter() { lines.push('center'); },
        alignLeft() { lines.push('left'); },
        println(text) { lines.push(String(text)); },
        drawLine() { lines.push('---'); },
        tableCustom(cells) { lines.push(cells.map(cell => cell.text).join('|')); },
        cut() { lines.push('cut'); }
      });
      jobs.push(lines);
      return Rx.Observable.of(true);
    }
  };
}

describe('CatalogPrinterService', () => {
  it('prints a name and stock table, with the header once and the cut on the last page', () => {
    const connection = recordingConnection();
    const printer = new CatalogPrinterService({printerConnection: connection});
    const filters = {
      query: 'milk',
      lowStock: true,
      status: 'ENABLED',
      categoryName: 'Dairy'
    };
    printer.printBatch({
      printedAt: '08/10/2026',
      filters,
      products: [{name: 'Whole milk', stock: 12}],
      header: true,
      cut: false
    }).subscribe(() => {}, () => { throw new Error('print failed'); });
    printer.printBatch({
      printedAt: '08/10/2026',
      filters,
      products: [{name: 'Bread', stock: 0}],
      header: false,
      cut: true
    }).subscribe(() => {}, () => { throw new Error('print failed'); });

    expect(connection.jobs[0]).to.deep.equal([
      'center',
      'SUPER COMPRIN',
      'Product list',
      '08/10/2026',
      'left',
      'Search: milk',
      'Low stock',
      'Enabled',
      'Category: Dairy',
      '---',
      'Name|Stock',
      'Whole milk|12'
    ]);
    expect(connection.jobs[1]).to.deep.equal(['Bread|0', 'cut']);
  });

  it('skips inactive filters and labels a disabled list', () => {
    const connection = recordingConnection();
    const printer = new CatalogPrinterService({printerConnection: connection});
    printer.printBatch({
      printedAt: 'today',
      filters: {query: '', lowStock: false, status: 'DISABLED', categoryName: ''},
      products: [{name: 'Old soda', stock: 1}],
      header: true,
      cut: true
    }).subscribe(() => {}, () => { throw new Error('print failed'); });
    expect(connection.jobs[0]).to.deep.equal([
      'center',
      'SUPER COMPRIN',
      'Product list',
      'today',
      'left',
      'Disabled',
      '---',
      'Name|Stock',
      'Old soda|1',
      'cut'
    ]);
  });
});
