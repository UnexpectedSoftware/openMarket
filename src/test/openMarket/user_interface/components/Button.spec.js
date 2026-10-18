import {mount} from './mount';
import React from 'react';
import {expect} from 'chai';
import Button from '../../../../openMarket/user_interface/components/Button';

describe('Button', () => {
  it('renders a button whose default type is button', () => {
    const view = mount(<Button>Save</Button>);
    const button = view.node.querySelector('button');
    expect(button.getAttribute('type')).to.equal('button');
    expect(button.className).to.include('om-button--primary');
    expect(button.textContent).to.include('Save');
    view.unmount();
  });

  it('marks a busy button and keeps the chosen type', () => {
    const view = mount(<Button type="submit" variant="danger" busy>Save</Button>);
    const button = view.node.querySelector('button');
    expect(button.getAttribute('type')).to.equal('submit');
    expect(button.getAttribute('aria-busy')).to.equal('true');
    expect(button.disabled).to.equal(true);
    expect(button.className).to.include('om-button--danger');
    view.unmount();
  });
});
