import {expect} from 'chai';
import * as Rx from 'rxjs';
import PrinterConnection from '../../../../openMarket/infrastructure/printer/PrinterConnection';

function device() {
  const calls = [];
  let callback = null;
  return {
    calls,
    clear() {
      calls.push('clear');
    },
    execute(done) {
      calls.push('execute');
      callback = done;
    },
    release(error) {
      callback(error);
    }
  };
}

describe('PrinterConnection', () => {
  it('clears the buffer, writes one job, and rejects a second job until the device accepts it', () => {
    const hardware = device();
    const connection = new PrinterConnection({device: hardware});
    const finished = [];
    connection.print((printer) => {
      printer.mark = true;
      hardware.calls.push('fill');
    }).subscribe(
      () => finished.push('ok'),
      error => finished.push(error.message)
    );
    expect(hardware.calls).to.deep.equal(['clear', 'fill', 'execute']);
    expect(hardware.mark).to.equal(true);

    let busy = null;
    connection.print(() => {}).subscribe(
      () => { throw new Error('second job should wait'); },
      error => { busy = error.message; }
    );
    expect(busy).to.equal('Printer is busy');
    expect(finished).to.deep.equal([]);

    hardware.release(null);
    expect(finished).to.deep.equal(['ok']);

    let again = null;
    connection.print(() => {}).subscribe(
      () => { again = 'ok'; },
      error => { again = error.message; }
    );
    hardware.release('Print failed: offline');
    expect(again).to.equal('Print failed: offline');

    let third = null;
    connection.print(() => { third = 'filled'; }).subscribe(
      () => {},
      error => { third = error.message; }
    );
    expect(third).to.equal('filled');
  });

  it('releases the lock when filling the buffer throws', () => {
    const hardware = device();
    const connection = new PrinterConnection({device: hardware});
    let message = null;
    connection.print(() => {
      throw new Error('bad line');
    }).subscribe(
      () => { throw new Error('should fail'); },
      error => { message = error.message; }
    );
    expect(message).to.equal('bad line');
    let opened = false;
    connection.print(() => { opened = true; }).subscribe(() => {}, () => {});
    expect(opened).to.equal(true);
  });

  it('inits with the stored interface and skips init when a device is injected', () => {
    const events = [];
    let current = {type: 'star', interface: 'tcp://127.0.0.1:9100', characterSet: 'PC850'};
    const thermal = {
      init(options) {
        events.push({name: 'init', options});
      },
      clear() {
        events.push({name: 'clear'});
      },
      execute(callback) {
        events.push({name: 'execute'});
        callback(null);
      }
    };
    const repository = {
      find() {
        return Rx.Observable.of({...current});
      }
    };
    const connection = new PrinterConnection({
      printerSettingsRepository: repository,
      thermalPrinter: thermal
    });
    let first = false;
    connection.print(() => {}).subscribe(() => {
      first = true;
    });
    expect(first).to.equal(true);
    let second = false;
    connection.print(() => {}).subscribe(() => {
      second = true;
    });
    expect(second).to.equal(true);
    expect(events.map(event => event.name)).to.deep.equal(['init', 'clear', 'execute', 'clear', 'execute']);
    expect(events[0].options).to.deep.equal({
      type: 'star',
      interface: 'tcp://127.0.0.1:9100',
      characterSet: 'PC850',
      extraSpecialCharacters: {'€': 128}
    });

    current = {type: 'epson', interface: '/dev/usb/lp0', characterSet: 'WPC1252'};
    connection.print(() => {}).subscribe(() => {});
    expect(events[events.length - 3].options.interface).to.equal('/dev/usb/lp0');
    expect(events[events.length - 3].options.type).to.equal('epson');
    expect(events[events.length - 3].options.characterSet).to.equal('WPC1252');

    const before = events.filter(event => event.name === 'init').length;
    const hardware = device();
    let finds = 0;
    const injected = new PrinterConnection({
      device: hardware,
      printerSettingsRepository: {
        find() {
          finds += 1;
          return Rx.Observable.of(current);
        }
      },
      thermalPrinter: thermal
    });
    let filled = false;
    injected.print(() => {
      filled = true;
    }).subscribe(() => {});
    expect(filled).to.equal(true);
    expect(finds).to.equal(0);
    expect(events.filter(event => event.name === 'init')).to.have.length(before);
    hardware.release(null);
  });

  it('does not init when the fake printer is on', () => {
    const previous = process.env.OPENMARKET_FAKE_PRINTER;
    process.env.OPENMARKET_FAKE_PRINTER = '1';
    const inits = [];
    try {
      const connection = new PrinterConnection({
        printerSettingsRepository: {
          find() {
            return Rx.Observable.of({type: 'star', interface: 'tcp://127.0.0.1:9100', characterSet: 'PC858'});
          }
        },
        thermalPrinter: {
          init() {
            inits.push('init');
          }
        }
      });
      let printed = false;
      connection.print(() => {}).subscribe(() => {
        printed = true;
      });
      expect(printed).to.equal(true);
      expect(inits).to.deep.equal([]);
    } finally {
      if (previous == null) {
        delete process.env.OPENMARKET_FAKE_PRINTER;
      } else {
        process.env.OPENMARKET_FAKE_PRINTER = previous;
      }
    }
  });
});
