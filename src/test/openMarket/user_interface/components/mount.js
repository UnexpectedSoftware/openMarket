import {installDom} from './domSetup';
import ReactDOM from 'react-dom';

/**
 * @param {*} element
 * @returns {{node: HTMLElement, unmount: Function}}
 */
export function mount(element) {
  installDom();
  const host = document.createElement('div');
  document.body.appendChild(host);
  ReactDOM.render(element, host);
  return {
    node: host,
    unmount() {
      ReactDOM.unmountComponentAtNode(host);
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
    }
  };
}
