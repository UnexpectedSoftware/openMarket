import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import IconButton from '../../../../openMarket/user_interface/components/IconButton';

describe('IconButton', () => {
  it('exposes the label as the accessible name', () => {
    const view = mount(<IconButton icon="times" label="Close" />);
    const button = view.node.querySelector('button');
    expect(button.getAttribute('type')).to.equal('button');
    expect(button.getAttribute('aria-label')).to.equal('Close');
    expect(button.getAttribute('title')).to.equal('Close');
    view.unmount();
  });

  it('requires a label outside production', () => {
    expect(() => mount(<IconButton icon="times" />)).to.throw(/IconButton requires label/);
  });
});
