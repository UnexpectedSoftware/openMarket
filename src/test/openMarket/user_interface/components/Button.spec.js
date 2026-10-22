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

  it('exposes pressed, expanded, and a large icon button', () => {
    const view = mount(
      <Button size="lg" className="extra" icon="plus" expanded pressed={false} title="Add">
        Add
      </Button>
    );
    const button = view.node.querySelector('button');
    expect(button.className).to.include('om-button--lg');
    expect(button.className).to.include('extra');
    expect(button.querySelector('.fa-plus')).to.not.equal(null);
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(button.getAttribute('aria-pressed')).to.equal('false');
    expect(button.getAttribute('title')).to.equal('Add');
    expect(button.getAttribute('aria-busy')).to.equal(null);
    view.unmount();
  });

  it('marks a pressed choice', () => {
    const view = mount(<Button variant="secondary" pressed>Hoy</Button>);
    const button = view.node.querySelector('button');
    expect(button.getAttribute('aria-pressed')).to.equal('true');
    expect(button.className).to.include('om-button--secondary');
    view.unmount();
  });

  it('marks a busy button and keeps the chosen type', () => {
    const view = mount(<Button type="submit" variant="danger" busy>Save</Button>);
    const button = view.node.querySelector('button');
    expect(button.getAttribute('type')).to.equal('submit');
    expect(button.getAttribute('aria-busy')).to.equal('true');
    expect(button.disabled).to.equal(true);
    expect(button.className).to.include('om-button--danger');
    expect(button.getAttribute('aria-pressed')).to.equal(null);
    expect(button.querySelector('.fa')).to.equal(null);
    view.unmount();
  });

  it('disables an explicit disabled button', () => {
    const view = mount(<Button disabled icon="plus" busy>Save</Button>);
    const button = view.node.querySelector('button');
    expect(button.disabled).to.equal(true);
    expect(button.querySelector('.fa-plus')).to.equal(null);
    view.unmount();
  });
});
