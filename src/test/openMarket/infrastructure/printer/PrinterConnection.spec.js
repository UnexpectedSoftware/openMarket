import {expect} from 'chai';
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
});
