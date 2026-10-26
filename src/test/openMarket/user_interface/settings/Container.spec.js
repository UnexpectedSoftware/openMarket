import {mount} from '../components/mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import Container from '../../../../openMarket/user_interface/settings/Container';

function page(overrides) {
  return {
    loading: false,
    saving: false,
    error: null,
    saveError: null,
    draft: {
      nif: 'B12345674',
      legalName: 'Perez',
      tradeName: '',
      street: '',
      postalCode: '',
      city: '',
      province: '',
      country: '',
      phone: '',
      email: '',
      invoicingEnabled: false,
      theme: 'mercado'
    },
    fieldErrors: {},
    ...overrides
  };
}

function render(props) {
  const calls = {opened: 0, save: 0, print: 0, draft: [], preview: [], discard: []};
  const view = mount(
    <Container
      settings={props.settings}
      appearance={props.appearance || {theme: 'mercado', applied: 'mercado'}}
      settingsPageOpened={() => {
        calls.opened += 1;
      }}
      settingsSaveRequested={() => {
        calls.save += 1;
      }}
      settingsTestPrintRequested={() => {
        calls.print += 1;
      }}
      settingsDraftChanged={patch => calls.draft.push(patch)}
      themePreviewRequested={id => calls.preview.push(id)}
      themePreviewDiscardRequested={id => calls.discard.push(id)}
    />
  );
  return {view, calls};
}

describe('settings Container', () => {
  it('shows skeletons while loading and does not save', () => {
    const {view, calls} = render({settings: page({loading: true})});
    expect(view.node.querySelectorAll('.settings-skeleton').length).to.equal(5);
    expect(view.node.querySelector('button').disabled).to.equal(true);
    ReactTestUtils.Simulate.submit(view.node.querySelector('form'));
    expect(calls.save).to.equal(0);
    expect(calls.opened).to.equal(1);
    view.unmount();
  });

  it('shows the load error and retries', () => {
    const {view, calls} = render({
      settings: page({error: 'No se han podido cargar los ajustes'})
    });
    expect(view.node.querySelector('[role="alert"]').textContent).to.equal(
      'No se han podido cargar los ajustes'
    );
    expect(view.node.querySelector('button[type="submit"]').disabled).to.equal(true);
    ReactTestUtils.Simulate.click(view.node.querySelector('button.om-button--secondary'));
    expect(calls.opened).to.equal(2);
    view.unmount();
  });

  it('edits the shop, previews a theme, and saves once', () => {
    const {view, calls} = render({
      settings: page({saveError: 'No se han podido guardar los ajustes', saving: false}),
      appearance: {theme: 'mercado', applied: 'ultramarinos'}
    });
    expect(view.node.querySelector('h1').textContent).to.equal('Ajustes');
    expect(view.node.textContent).to.contain('Comercio');
    expect(view.node.textContent).to.contain('Ticket');
    expect(view.node.textContent).to.contain('Al imprimir');
    expect(view.node.textContent).to.contain('Impresora');
    expect(view.node.textContent).to.contain('Imprimir prueba');
    expect(view.node.textContent).to.contain('Idioma');
    expect(view.node.textContent).to.contain('Español');
    expect(view.node.textContent).to.contain('Apariencia');
    const print = Array.prototype.find.call(
      view.node.querySelectorAll('button'),
      button => button.textContent === 'Imprimir prueba'
    );
    ReactTestUtils.Simulate.click(print);
    expect(view.node.querySelector('.settings-save-error').textContent).to.equal(
      'No se han podido guardar los ajustes'
    );
    const nif = view.node.querySelector('#shop-nif');
    nif.value = 'B00000000';
    ReactTestUtils.Simulate.change(nif);
    ReactTestUtils.Simulate.click(view.node.querySelector('[data-theme="ultramarinos"]'));
    ReactTestUtils.Simulate.submit(view.node.querySelector('form'));
    expect(calls.draft[0]).to.deep.equal({nif: 'B00000000'});
    expect(calls.preview).to.deep.equal(['ultramarinos']);
    expect(calls.draft[1]).to.deep.equal({theme: 'ultramarinos'});
    expect(calls.print).to.equal(1);
    expect(calls.save).to.equal(1);
    view.unmount();
    expect(calls.discard).to.deep.equal(['mercado']);
    expect(calls.draft[2]).to.deep.equal({theme: 'mercado'});
  });

  it('keeps Guardar disabled while a save is in flight and when settings are missing', () => {
    const saving = render({settings: page({saving: true})});
    expect(saving.view.node.querySelector('button[type="submit"]').disabled).to.equal(true);
    const print = Array.prototype.find.call(
      saving.view.node.querySelectorAll('button'),
      button => button.textContent === 'Imprimir prueba'
    );
    expect(print.disabled).to.equal(true);
    ReactTestUtils.Simulate.click(print);
    ReactTestUtils.Simulate.submit(saving.view.node.querySelector('form'));
    expect(saving.calls.save).to.equal(0);
    expect(saving.calls.print).to.equal(0);
    saving.view.unmount();

    const printing = render({settings: page({printing: true})});
    expect(printing.view.node.querySelector('button[type="submit"]').disabled).to.equal(true);
    ReactTestUtils.Simulate.submit(printing.view.node.querySelector('form'));
    expect(printing.calls.save).to.equal(0);
    printing.view.unmount();

    const empty = render({settings: undefined, appearance: undefined});
    expect(empty.view.node.querySelector('h1').textContent).to.equal('Ajustes');
    expect(empty.view.node.querySelector('button[type="submit"]').disabled).to.equal(false);
    ReactTestUtils.Simulate.submit(empty.view.node.querySelector('form'));
    expect(empty.calls.save).to.equal(1);
    empty.view.unmount();
  });
});
