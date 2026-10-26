import {mount} from '../components/mount';
import React, {Component} from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import LayoutPicker from '../../../../openMarket/user_interface/settings/LayoutPicker';

const ORDER = ['mostrador', 'escaner', 'tactil'];

class Host extends Component {
  constructor(props) {
    super(props);
    this.state = {applied: props.applied};
    this.previews = [];
    this.discards = [];
  }

  render() {
    return (
      <LayoutPicker
        layout={this.props.layout}
        applied={this.state.applied}
        onPreview={id => {
          this.previews.push(id);
          this.setState({applied: id});
        }}
        onDiscard={id => this.discards.push(id)}
      />
    );
  }
}

function mountHost(applied, layout) {
  const ref = {};
  const view = mount(
    <div>
      <Host ref={node => { ref.current = node; }} layout={layout || 'mostrador'} applied={applied} />
    </div>
  );
  return {view, host: ref.current};
}

function radio(view, id) {
  return view.node.querySelector('[data-layout="' + id + '"]');
}

function press(node, key) {
  ReactTestUtils.Simulate.keyDown(node, {key});
}

describe('LayoutPicker', () => {
  it('marks the applied preset aria-checked', () => {
    const view = mount(
      <LayoutPicker layout="mostrador" applied="escaner" onPreview={() => {}} onDiscard={() => {}} />
    );
    const radios = view.node.querySelectorAll('[role="radio"]');
    expect(radios.length).to.equal(3);
    expect(view.node.querySelector('[role="radiogroup"]').getAttribute('aria-labelledby')).to.equal('sell-layout-label');
    const selected = view.node.querySelector('[aria-checked="true"]');
    expect(selected.textContent).to.contain('Escáner');
    expect(view.node.querySelectorAll('[aria-checked="false"]').length).to.equal(2);
    view.unmount();
  });

  it('previews with a click and moves with the arrow keys', () => {
    const {view, host} = mountHost('mostrador');
    ReactTestUtils.Simulate.click(radio(view, 'tactil'));
    press(radio(view, 'tactil'), 'ArrowLeft');
    press(radio(view, 'escaner'), 'ArrowUp');
    press(radio(view, 'mostrador'), 'Tab');
    expect(host.previews).to.deep.equal(['tactil', 'escaner', 'mostrador']);
    expect(radio(view, 'mostrador').getAttribute('aria-checked')).to.equal('true');
    ORDER.forEach(id => expect(radio(view, id).textContent).to.not.equal(''));
    view.unmount();
    expect(host.discards).to.deep.equal([]);
  });

  it('discards an unsaved preview when it unmounts', () => {
    const {view, host} = mountHost('escaner');
    view.unmount();
    expect(host.discards).to.deep.equal(['mostrador']);
  });
});
