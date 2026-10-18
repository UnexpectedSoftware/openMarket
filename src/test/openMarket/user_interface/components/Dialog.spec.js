import {installDom} from './domSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import Dialog from '../../../../openMarket/user_interface/components/Dialog';

describe('Dialog', () => {
  let host;

  beforeEach(() => {
    installDom();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(host);
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  });

  function key(name, shiftKey) {
    const event = new window.KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
      shiftKey: !!shiftKey
    });
    document.dispatchEvent(event);
    return event;
  }

  it('labels the dialog, traps Tab, closes on Escape, and returns focus', () => {
    const opener = document.createElement('button');
    opener.textContent = 'Open';
    document.body.appendChild(opener);
    opener.focus();
    let open = true;
    const close = () => {
      open = false;
      render();
    };
    function render() {
      ReactDOM.render(
        <Dialog open={open} title="Example dialog" onClose={close}>
          <button type="button">Inside</button>
        </Dialog>,
        host
      );
    }
    render();
    const dialog = host.querySelector('[role="dialog"]');
    const title = host.querySelector('h2');
    expect(dialog.getAttribute('aria-modal')).to.equal('true');
    expect(dialog.getAttribute('aria-labelledby')).to.equal(title.id);
    expect(title.textContent).to.equal('Example dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(document.activeElement).to.equal(buttons[0]);
    buttons[buttons.length - 1].focus();
    const tab = key('Tab');
    expect(tab.defaultPrevented).to.equal(true);
    expect(document.activeElement).to.equal(buttons[0]);
    key('Escape');
    expect(open).to.equal(false);
    expect(host.querySelector('[role="dialog"]')).to.equal(null);
    expect(document.activeElement).to.equal(opener);
    opener.parentNode.removeChild(opener);
  });
});
