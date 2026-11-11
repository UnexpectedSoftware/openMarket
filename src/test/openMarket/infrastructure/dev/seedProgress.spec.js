import {expect} from 'chai';
import SeedProgress, {progressLine} from '../../../../openMarket/infrastructure/dev/seedProgress';
import ProgressSaleStatistics from '../../../../openMarket/infrastructure/dev/ProgressSaleStatistics';
import CategoryCreated from '../../../../openMarket/domain/event/CategoryCreated';
import ProductCreated from '../../../../openMarket/domain/event/ProductCreated';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';

function capture(tty) {
  const chunks = [];
  return {
    isTTY: tty,
    chunks,
    write(text) {
      chunks.push(String(text));
    },
    text() {
      return chunks.join('');
    }
  };
}

function bus() {
  /** @type {Array<{EventType: Function, handler: Function}>} */
  const subscribers = [];
  return {
    subscribers,
    subscribeSync(EventType, handler) {
      subscribers.push({EventType, handler});
    },
    emit(event) {
      subscribers.forEach(subscriber => {
        if (event instanceof subscriber.EventType) {
          subscriber.handler(event);
        }
      });
    }
  };
}

describe('progressLine', () => {
  it('draws settings as one percent and the other steps as counts', () => {
    expect(progressLine({label: 'ajustes', current: 0, total: 1, percentOnly: true}))
      .to.equal(' ajustes     [--------------------------] 0%');
    expect(progressLine({label: 'ajustes', current: 1, total: 1, percentOnly: true}))
      .to.equal(' ajustes     [##########################] 100%');
    expect(progressLine({label: 'categorías', current: 25, total: 25, percentOnly: false}))
      .to.equal(' categorías  [##########################] 25/25');
    expect(progressLine({label: 'tickets', current: 512, total: 1049, percentOnly: false}))
      .to.equal(' tickets     [#############-------------] 512/1049  48%');
  });
});

describe('SeedProgress', () => {
  const totals = {categories: 2, products: 2, orders: 2};

  it('prints one plain line per finished step, and the open step when the run stops', () => {
    const out = capture(false);
    const events = bus();
    const progress = new SeedProgress({out});
    progress.prepare(totals);
    progress.attach(events);
    progress.settingsDone();
    events.emit(new CategoryCreated({id: '1', name: 'A'}));
    events.emit(new CategoryCreated({id: '2', name: 'B'}));
    events.emit(new ProductCreated({barcode: '1', name: 'Milk'}));
    progress.finish();
    expect(out.text()).to.equal([
      ':: Creando datos para la demo...',
      ' ajustes     [##########################] 100%',
      ' categorías  [##########################] 2/2',
      ' productos   [#############-------------] 1/2  50%',
      ''
    ].join('\n'));
  });

  it('redraws every line on a TTY and fills informes as orders are applied', () => {
    const out = capture(true);
    const events = bus();
    const progress = new SeedProgress({out});
    progress.prepare(totals);
    progress.attach(events);
    const drawnAtStart = out.chunks.length;
    progress.settingsDone();
    events.emit(new CategoryCreated({id: '1', name: 'A'}));
    events.emit(new CategoryCreated({id: '2', name: 'B'}));
    events.emit(new ProductCreated({barcode: '1', name: 'One'}));
    events.emit(new ProductCreated({barcode: '2', name: 'Two'}));
    events.emit(new OrderCreated({id: 'o1', createdAt: '01/01/2026 10:00:00', lines: []}));
    events.emit(new OrderCreated({id: 'o2', createdAt: '01/01/2026 11:00:00', lines: []}));
    progress.reportApplied();
    progress.reportApplied();
    progress.finish();
    const text = out.text();
    expect(drawnAtStart).to.be.above(0);
    expect(text).to.contain('\x1b[');
    expect(text).to.contain(' ajustes     [##########################] 100%');
    expect(text).to.contain(' informes    [##########################] 2/2');
    expect(out.chunks.filter(chunk => chunk.indexOf('\x1b[') === 0 && chunk.endsWith('A')).length).to.be.above(0);
  });

  it('does not subscribe twice', () => {
    const out = capture(false);
    const events = bus();
    const progress = new SeedProgress({out});
    progress.prepare(totals);
    progress.attach(events);
    progress.attach(events);
    expect(events.subscribers).to.have.length(3);
  });
});

describe('ProgressSaleStatistics', () => {
  it('tells the bar after an order is applied and forwards the other reads', () => {
    const applied = [];
    const repository = {
      isEmpty: () => false,
      rebuildFromOrders() {
        applied.push('rebuild');
      },
      applyOrder(order) {
        applied.push(order.orderId);
      },
      series: query => [query.barcode],
      mostSold: () => [],
      quantities: () => []
    };
    let ticks = 0;
    const statistics = new ProgressSaleStatistics({repository, onApply: () => { ticks += 1; }});
    expect(statistics.isEmpty()).to.equal(false);
    statistics.rebuildFromOrders();
    statistics.applyOrder({orderId: 'o1', createdAt: '01/01/2026 10:00:00', lines: []});
    expect(statistics.series({barcode: '0001', startOn: 'a', endOn: 'b', bucket: 'day'})).to.deep.equal(['0001']);
    expect(applied).to.deep.equal(['rebuild', 'o1']);
    expect(ticks).to.equal(1);
  });
});
