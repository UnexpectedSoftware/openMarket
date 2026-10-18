import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import Select from '../../../../openMarket/user_interface/components/Select';

describe('Select', () => {
  it('gives every option a text label', () => {
    const view = mount(
      <Select
        id="status"
        name="status"
        label="Status"
        value="ENABLED"
        options={[
          {value: 'ENABLED', label: 'Activo'},
          {value: 'DISABLED', label: 'Desactivado'}
        ]}
      />
    );
    const select = view.node.querySelector('select');
    expect(view.node.querySelector('label').getAttribute('for')).to.equal('status');
    expect(Array.prototype.map.call(select.options, option => option.text)).to.deep.equal(['Activo', 'Desactivado']);
    view.unmount();
  });
});
