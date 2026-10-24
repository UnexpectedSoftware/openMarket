import React, {Component} from 'react';
import IconButton from './IconButton';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

let nextTitleId = 1;

/**
 * @typedef {Object} DialogProps
 * @property {boolean} open
 * @property {string} title
 * @property {Function} onClose Called by Esc and the close button.
 * @property {*} [children]
 * @property {*} [actions] Footer actions, usually Buttons.
 * @property {{current: HTMLElement}} [initialFocusRef] Object whose `current` is focused on open.
 * @property {'dialog'|'alertdialog'} [role]
 * @property {'drawer'} [placement] Right-hand sheet. Same focus trap, no portal.
 * @property {string} [className]
 */

/**
 * In-place dialog (React 15 has no portals). Traps Tab and restores focus on close.
 */
export default class Dialog extends Component {

  constructor(props) {
    super(props);
    this.titleId = 'om-dialog-title-' + nextTitleId;
    nextTitleId += 1;
    this.active = false;
    this.previouslyFocused = null;
    this.panel = null;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.setPanel = this.setPanel.bind(this);
  }

  componentDidMount() {
    if (this.props.open) {
      this.activate();
    }
  }

  componentDidUpdate(previous) {
    if (!previous.open && this.props.open) {
      this.activate();
    }
    if (previous.open && !this.props.open) {
      this.deactivate();
    }
  }

  componentWillUnmount() {
    this.deactivate();
  }

  setPanel(node) {
    this.panel = node;
  }

  activate() {
    if (this.active) {
      return;
    }
    this.active = true;
    this.previouslyFocused = document.activeElement;
    document.addEventListener('keydown', this.onKeyDown);
    this.focusInitial();
  }

  deactivate() {
    if (!this.active) {
      return;
    }
    this.active = false;
    document.removeEventListener('keydown', this.onKeyDown);
    const previous = this.previouslyFocused;
    this.previouslyFocused = null;
    if (previous && previous.focus) {
      previous.focus();
    }
  }

  focusInitial() {
    const ref = this.props.initialFocusRef;
    const preferred = ref && ref.current;
    if (preferred && preferred.focus) {
      preferred.focus();
      return;
    }
    const focusables = this.focusable();
    if (focusables.length) {
      focusables[0].focus();
    } else if (this.panel && this.panel.focus) {
      this.panel.focus();
    }
  }

  focusable() {
    if (!this.panel) {
      return [];
    }
    return Array.prototype.slice.call(this.panel.querySelectorAll(FOCUSABLE));
  }

  onKeyDown(event) {
    if (!this.props.open) {
      return;
    }
    if (event.key === 'Escape' || event.keyCode === 27) {
      event.preventDefault();
      this.props.onClose();
      return;
    }
    if (event.key !== 'Tab' && event.keyCode !== 9) {
      return;
    }
    const focusables = this.focusable();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = this.panel && this.panel.contains(active);
    if (event.shiftKey) {
      if (!inside || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (!inside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  render() {
    if (!this.props.open) {
      return null;
    }
    const role = this.props.role || 'dialog';
    const drawer = this.props.placement === 'drawer';
    const overlayClass = drawer ? 'om-dialog-overlay om-dialog-overlay--drawer' : 'om-dialog-overlay';
    const panelClass = ['om-dialog'];
    if (drawer) {
      panelClass.push('om-dialog--drawer');
    }
    if (this.props.className) {
      panelClass.push(this.props.className);
    }
    return (
      <div className={overlayClass}>
        <div
          className={panelClass.join(' ')}
          role={role}
          aria-modal="true"
          aria-labelledby={this.titleId}
          ref={this.setPanel}
          tabIndex="-1"
        >
          <div className="om-dialog-header">
            <h2 className="om-dialog-title" id={this.titleId}>{this.props.title}</h2>
            <IconButton icon="times" label="Close" onClick={this.props.onClose} />
          </div>
          <div className="om-dialog-body">{this.props.children}</div>
          {this.props.actions ? <div className="om-dialog-actions">{this.props.actions}</div> : null}
        </div>
      </div>
    );
  }
}
