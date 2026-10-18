import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import TextField from '../../../../openMarket/user_interface/components/TextField';

describe('TextField', () => {
  it('ties the label to the input and describes an error', () => {
    const view = mount(
      <TextField id="barcode" name="barcode" label="Barcode" value="" error="Required" hint="13 digits" onChange={() => {}} />
    );
    const input = view.node.querySelector('input');
    const label = view.node.querySelector('label');
    expect(label.getAttribute('for')).to.equal('barcode');
    expect(input.id).to.equal('barcode');
    expect(input.getAttribute('name')).to.equal('barcode');
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('barcode-hint barcode-error');
    expect(view.node.querySelector('#barcode-error').getAttribute('role')).to.equal('alert');
    view.unmount();
  });

  it('requires an id and a label outside production', () => {
    expect(() => mount(<TextField label="Name" />)).to.throw(/TextField requires id/);
  });
});
