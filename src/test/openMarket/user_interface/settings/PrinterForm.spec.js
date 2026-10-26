import {mount} from '../components/mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import PrinterForm from '../../../../openMarket/user_interface/settings/PrinterForm';

describe('PrinterForm', () => {
  it('ties each label to its control and prints a sample', () => {
    const changes = [];
    let printed = 0;
    const view = mount(
      <PrinterForm
        values={{printerType: 'star', printerInterface: 'tcp://127.0.0.1:9100', printerCharacterSet: 'PC850'}}
        fieldErrors={{printerInterface: 'Obligatorio'}}
        printerError="No se ha podido imprimir"
        onChange={(name, value) => changes.push([name, value])}
        onTestPrint={() => {
          printed += 1;
        }}
      />
    );
    const type = view.node.querySelector('#printer-type');
    const set = view.node.querySelector('#printer-character-set');
    const device = view.node.querySelector('#printer-interface');
    expect(view.node.querySelector('label[for="printer-type"]').textContent).to.equal('Tipo');
    expect(view.node.querySelector('label[for="printer-character-set"]').textContent).to.equal('Juego de caracteres');
    expect(view.node.querySelector('label[for="printer-interface"]').textContent).to.equal('Interfaz');
    expect(view.node.textContent).to.contain('Epson');
    expect(view.node.textContent).to.contain('Star');
    expect(view.node.textContent).to.contain('SPAIN1');
    expect(view.node.textContent).to.contain('PC858');
    expect(view.node.textContent).to.contain('PC850');
    expect(view.node.textContent).to.contain('WPC1252');
    expect(view.node.textContent).to.contain('Ruta USB, tcp://ip:9100, o el nombre de la impresora');
    expect(view.node.textContent).to.contain('No se ha podido imprimir');
    expect(type.value).to.equal('star');
    expect(set.value).to.equal('PC850');
    expect(device.value).to.equal('tcp://127.0.0.1:9100');
    expect(device.getAttribute('aria-describedby')).to.contain('printer-interface-error');
    type.value = 'epson';
    ReactTestUtils.Simulate.change(type);
    set.value = 'WPC1252';
    ReactTestUtils.Simulate.change(set);
    device.value = '/dev/usb/lp1';
    ReactTestUtils.Simulate.change(device);
    ReactTestUtils.Simulate.click(view.node.querySelector('button'));
    expect(changes).to.deep.equal([
      ['printerType', 'epson'],
      ['printerCharacterSet', 'WPC1252'],
      ['printerInterface', '/dev/usb/lp1']
    ]);
    expect(printed).to.equal(1);
    view.unmount();
  });
});
