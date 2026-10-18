import {JSDOM} from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url: 'http://localhost/'});

/**
 * Installs a DOM before React 15 is imported. Later tests may delete
 * `document`; call this again from `beforeEach`.
 */
export function installDom() {
  const {window} = dom;
  global.window = window;
  global.document = window.document;
  global.HTMLElement = window.HTMLElement;
  global.Element = window.Element;
  global.Node = window.Node;
  global.DocumentFragment = window.DocumentFragment;
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = callback => setTimeout(callback, 0);
    global.cancelAnimationFrame = id => clearTimeout(id);
  }
}

installDom();
