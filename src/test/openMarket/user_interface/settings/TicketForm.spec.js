import {mount} from '../components/mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import TicketForm from '../../../../openMarket/user_interface/settings/TicketForm';

describe('TicketForm', () => {
  it('ties each label to its control', () => {
    const changes = [];
    const view = mount(
      <TicketForm
        values={{printMode: 'ask', headerText: 'Hola', footerText: '', paperWidthMm: 80}}
        fieldErrors={{headerText: 'Máximo 80 caracteres'}}
        onChange={(name, value) => changes.push([name, value])}
      />
    );
    const mode = view.node.querySelector('#ticket-print-mode');
    const width = view.node.querySelector('#ticket-paper-width');
    const header = view.node.querySelector('#ticket-header');
    const footer = view.node.querySelector('#ticket-footer');
    expect(view.node.querySelector('label[for="ticket-print-mode"]').textContent).to.equal('Al imprimir');
    expect(view.node.querySelector('label[for="ticket-paper-width"]').textContent).to.equal('Ancho del papel');
    expect(view.node.querySelector('label[for="ticket-header"]').textContent).to.equal('Cabecera');
    expect(view.node.querySelector('label[for="ticket-footer"]').textContent).to.equal('Pie');
    expect(mode.value).to.equal('ask');
    expect(width.value).to.equal('80');
    expect(header.getAttribute('aria-describedby')).to.equal('ticket-header-error');
    expect(view.node.textContent).to.contain('Siempre');
    expect(view.node.textContent).to.contain('Preguntar');
    expect(view.node.textContent).to.contain('Nunca');
    expect(view.node.textContent).to.contain('58 mm');
    expect(view.node.textContent).to.contain('80 mm');
    mode.value = 'never';
    ReactTestUtils.Simulate.change(mode);
    width.value = '58';
    ReactTestUtils.Simulate.change(width);
    footer.value = 'Pie';
    ReactTestUtils.Simulate.change(footer);
    expect(changes).to.deep.equal([
      ['printMode', 'never'],
      ['paperWidthMm', 58],
      ['footerText', 'Pie']
    ]);
    view.unmount();
  });
});