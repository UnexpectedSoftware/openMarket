import {mount} from '../components/mount';
import React, {Component} from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import ThemePicker from '../../../../openMarket/user_interface/settings/ThemePicker';

const ORDER = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

class Host extends Component {
  constructor(props) {
    super(props);
    this.state = {applied: props.applied};
    this.previews = [];
    this.discards = [];
  }

  render() {
    return (
      <ThemePicker
        theme={this.props.theme}
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

function mountHost(applied, theme) {
  const ref = {};
  const view = mount(
    <div>
      <Host ref={node => { ref.current = node; }} theme={theme || 'mercado'} applied={applied} />
    </div>
  );
  return {view, host: ref.current};
}

function radio(view, id) {
  return view.node.querySelector('[data-theme="' + id + '"]');
}

function press(node, key) {
  ReactTestUtils.Simulate.keyDown(node, {key});
}

describe('ThemePicker', () => {
  it('marks the applied theme aria-checked and has no save button', () => {
    const view = mount(
      <ThemePicker theme="mercado" applied="mostrador-noche" onPreview={() => {}} onDiscard={() => {}} />
    );
    const radios = view.node.querySelectorAll('[role="radio"]');
    expect(radios.length).to.equal(4);
    expect(view.node.querySelector('[role="radiogroup"]').getAttribute('aria-label')).to.equal('Apariencia');
    const selected = view.node.querySelector('[aria-checked="true"]');
    expect(selected.textContent).to.contain('Mostrador Noche');
    expect(view.node.querySelectorAll('[aria-checked="false"]').length).to.equal(3);
    expect(view.node.querySelector('button')).to.equal(null);
    view.unmount();
  });

  it('previews the card on click, Enter, and Space', () => {
    const {view, host} = mountHost('mercado');
    ReactTestUtils.Simulate.click(radio(view, 'ultramarinos'));
    press(radio(view, 'unexpected-neon'), 'Enter');
    press(radio(view, 'mostrador-noche'), ' ');
    expect(host.previews).to.deep.equal(['ultramarinos', 'unexpected-neon', 'mostrador-noche']);
    expect(radio(view, 'mostrador-noche').getAttribute('aria-checked')).to.equal('true');
    view.unmount();
  });

  it('moves with the arrow keys, wraps, and ignores other keys', () => {
    const {view, host} = mountHost('mercado');
    press(radio(view, 'mercado'), 'ArrowRight');
    press(radio(view, 'mostrador-noche'), 'ArrowDown');
    press(radio(view, 'ultramarinos'), 'Tab');
    press(radio(view, 'ultramarinos'), 'ArrowLeft');
    press(radio(view, 'mostrador-noche'), 'ArrowUp');
    press(radio(view, 'mercado'), 'ArrowLeft');
    press(radio(view, 'unexpected-neon'), 'ArrowRight');
    expect(host.previews).to.deep.equal([
      'mostrador-noche',
      'ultramarinos',
      'mostrador-noche',
      'mercado',
      'unexpected-neon',
      'mercado'
    ]);
    ORDER.forEach(id => expect(radio(view, id)).to.not.equal(null));
    expect(document.activeElement).to.equal(radio(view, 'mercado'));
    view.unmount();
    expect(host.discards).to.deep.equal([]);
  });

  it('discards an unsaved preview when it unmounts', () => {
    const {view, host} = mountHost('ultramarinos');
    view.unmount();
    expect(host.discards).to.deep.equal(['mercado']);
  });
});
