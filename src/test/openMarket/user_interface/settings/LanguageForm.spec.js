import {mount} from '../components/mount';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import LanguageForm from '../../../../openMarket/user_interface/settings/LanguageForm';

describe('LanguageForm', () => {
  it('offers Español and stores es', () => {
    const changes = [];
    const view = mount(
      <LanguageForm values={{locale: 'es'}} onChange={(name, value) => changes.push([name, value])} />
    );
    const locale = view.node.querySelector('#language-locale');
    expect(view.node.querySelector('label[for="language-locale"]').textContent).to.equal('Idioma');
    expect(locale.value).to.equal('es');
    expect(view.node.textContent).to.contain('Español');
    expect(locale.querySelectorAll('option')).to.have.length(1);
    locale.value = 'es';
    ReactTestUtils.Simulate.change(locale);
    expect(changes).to.deep.equal([['locale', 'es']]);
    view.unmount();
  });
});
