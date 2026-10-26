import React, {Component} from 'react';
import TextField from '../../components/TextField';
import {parseDecimal} from '../../components/NumberField';
import Quantity from '../../../domain/money/Quantity';
import VatRate from '../../../domain/tax/VatRate';
import {lineIsValid} from './model';
import {isScannerBurst, applyShortcut} from './input';
import SellScreen from './SellScreen';
import {sellView} from './sellView';

const TILE_LIMIT = 24;

class Container extends Component {

  constructor(props) {
    super(props);
    this.state = {
      search: '',
      selected: -1,
      freeOpen: false,
      helpOpen: false,
      paymentOpen: false,
      payMethod: 'cash',
      tendered: '',
      previewOpen: true,
      reprintOpen: false,
      freeDescription: 'Venta libre',
      freeAmount: '',
      freeVat: VatRate.standard().code()
    };
    this.searchRef = {current: null};
    this.freeAmountRef = {current: null};
    this._burst = emptyBurst();
    this._dialogWasOpen = false;
    this.onWindowKey = this.onWindowKey.bind(this);
    this.onWindowFocus = this.onWindowFocus.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.focusSearch = this.focusSearch.bind(this);
    this.charge = this.charge.bind(this);
    this.closePayment = this.closePayment.bind(this);
    this.confirmPayment = this.confirmPayment.bind(this);
    this.onPayMethod = this.onPayMethod.bind(this);
    this.onTendered = this.onTendered.bind(this);
    this.togglePreview = this.togglePreview.bind(this);
    this.openReprint = this.openReprint.bind(this);
    this.closeReprint = this.closeReprint.bind(this);
    this.printLast = this.printLast.bind(this);
    this.openFree = this.openFree.bind(this);
    this.closeFree = this.closeFree.bind(this);
    this.confirmFree = this.confirmFree.bind(this);
    this.openHelp = this.openHelp.bind(this);
    this.closeHelp = this.closeHelp.bind(this);
    this.setSearchNode = this.setSearchNode.bind(this);
    this.setFreeAmountNode = this.setFreeAmountNode.bind(this);
    this.onFreeDescription = this.onFreeDescription.bind(this);
    this.onFreeAmount = this.onFreeAmount.bind(this);
    this.onFreeVat = this.onFreeVat.bind(this);
    this.selectCategory = this.selectCategory.bind(this);
    this.clearTicket = this.clearTicket.bind(this);
    this.selectLine = this.selectLine.bind(this);
    this.editWeighted = this.editWeighted.bind(this);
    this.lookup = this.lookup.bind(this);
  }

  componentWillMount() {
    if (this.props.shopProfileRequested) {
      this.props.shopProfileRequested();
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onWindowKey, true);
    window.addEventListener('focus', this.onWindowFocus);
    if (this.props.saleTilesRequested) {
      this.props.saleTilesRequested({text: '', limit: TILE_LIMIT});
    }
    if (this.props.saleCategoriesRequested) {
      this.props.saleCategoriesRequested();
    }
    this.focusSearch();
  }

  componentDidUpdate(previous) {
    const before = previous.order && previous.order.lines ? previous.order.lines.length : 0;
    const after = this.props.order && this.props.order.lines ? this.props.order.lines.length : 0;
    if (before > 0 && after === 0 && this.props.saleTilesRequested) {
      this.props.saleTilesRequested({text: this.state.search || '', limit: TILE_LIMIT});
    }
    if (before > 0 && after === 0 && this.state.paymentOpen) {
      this.setState({paymentOpen: false, tendered: ''});
    }
    if (after !== before) {
      const selected = after === 0 ? -1 : after - 1;
      if (after > before && this.state.selected !== selected) {
        this.setState({selected});
      } else if (this.state.selected >= after && this.state.selected !== selected) {
        this.setState({selected});
      }
      this.focusSearch();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onWindowKey, true);
    window.removeEventListener('focus', this.onWindowFocus);
    if (this.props.newOrderClosed) {
      this.props.newOrderClosed();
    }
  }

  setSearchNode(node) {
    this.searchRef.current = node;
  }

  setFreeAmountNode(node) {
    this.freeAmountRef.current = node;
  }

  selectCategory(categoryId) {
    const next = categoryId || null;
    if (this.props.saleCategorySelected) {
      this.props.saleCategorySelected(next);
    }
    if (this.props.saleTilesRequested) {
      this.props.saleTilesRequested({
        text: this.state.search || '',
        categoryId: next,
        limit: TILE_LIMIT
      });
    }
  }

  selectLine(index) {
    this.setState({selected: index});
  }

  clearTicket() {
    if (this.props.newOrderCleared) {
      this.props.newOrderCleared();
    }
    this.focusSearch();
  }

  focusSearch() {
    if (document.querySelector('[role="dialog"]')) {
      return;
    }
    const node = this.searchRef.current;
    if (node && node.focus && document.activeElement !== node) {
      node.focus();
    }
  }

  onWindowFocus() {
    this.focusSearch();
  }

  onSearch(event) {
    const text = event.target.value;
    this.setState({search: text});
    if (this.props.saleTilesRequested) {
      this.props.saleTilesRequested({text, limit: TILE_LIMIT});
    }
  }

  lookup(barcode) {
    const code = barcode == null ? '' : String(barcode).trim();
    this._burst = emptyBurst();
    this.setState({search: ''});
    if (this.props.saleTilesRequested) {
      this.props.saleTilesRequested({text: '', limit: TILE_LIMIT});
    }
    if (code && this.props.newOrderProductFetch) {
      this.props.newOrderProductFetch(code);
    }
    this.focusSearch();
  }

  canCharge() {
    const lines = this.props.order && this.props.order.lines ? this.props.order.lines : [];
    return lines.length > 0 && lines.every(lineIsValid);
  }

  charge() {
    if (!this.canCharge()) {
      return;
    }
    this.setState({
      paymentOpen: true,
      payMethod: 'cash',
      tendered: '',
      previewOpen: true
    });
    if (this.props.paymentPreviewRequested) {
      this.props.paymentPreviewRequested({
        lines: this.props.order.lines,
        issuer: this.props.issuer
      });
    }
  }

  closePayment() {
    this.setState({paymentOpen: false}, this.focusSearch);
  }

  onPayMethod(payMethod) {
    this.setState({payMethod});
  }

  onTendered(tendered) {
    this.setState({tendered});
  }

  togglePreview() {
    this.setState({previewOpen: !this.state.previewOpen});
  }

  confirmPayment(payment) {
    if (!payment || this.props.saving) {
      return;
    }
    this.props.newOrderSave(this.props.order, {
      method: payment.method,
      tenderedCents: payment.tenderedCents
    });
  }

  openReprint() {
    const order = this.props.lastOrder;
    if (!order || !order.id) {
      return;
    }
    this.setState({reprintOpen: true});
    if (this.props.reprintPreviewRequested) {
      this.props.reprintPreviewRequested({orderId: order.id});
    }
  }

  closeReprint() {
    this.setState({reprintOpen: false}, this.focusSearch);
  }

  printLast() {
    const order = this.props.lastOrder;
    this.setState({reprintOpen: false}, this.focusSearch);
    if (order && this.props.printOrderButtonClicked) {
      this.props.printOrderButtonClicked(order);
    }
  }

  openFree() {
    this.setState({
      freeOpen: true,
      freeDescription: 'Venta libre',
      freeAmount: '',
      freeVat: VatRate.standard().code()
    });
  }

  closeFree() {
    this.setState({freeOpen: false}, this.focusSearch);
  }

  confirmFree() {
    const amount = parseDecimal(this.state.freeAmount);
    const description = String(this.state.freeDescription || '').trim();
    if (!description || amount == null || amount <= 0) {
      return;
    }
    this.props.newOrderFreeLineAdded({
      description,
      amount,
      vatRate: this.state.freeVat
    });
    this.setState({freeOpen: false}, this.focusSearch);
  }

  openHelp() {
    this.setState({helpOpen: true});
  }

  closeHelp() {
    this.setState({helpOpen: false}, this.focusSearch);
  }

  onFreeDescription(event) {
    this.setState({freeDescription: event.target.value});
  }

  onFreeAmount(value) {
    this.setState({freeAmount: value});
  }

  onFreeVat(event) {
    this.setState({freeVat: event.target.value});
  }

  editWeighted(line) {
    if (!this.props.showWeightedDialog) {
      return;
    }
    this.props.showWeightedDialog({
      barcode: line.barcode,
      name: line.name,
      price: line.unitPrice,
      isWeighted: true,
      replaceQuantity: true,
      initialQuantity: line.quantity.units
    });
  }

  adjustLast(delta) {
    const lines = this.props.order && this.props.order.lines ? this.props.order.lines : [];
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      if (line.kind === 'FREE') {
        continue;
      }
      if (line.weighted) {
        this.editWeighted(line);
        return;
      }
      const next = line.quantity.plus(Quantity.from(delta));
      const units = next.milli < 0 ? 0 : next.units;
      this.props.newOrderProductQuantityChange({barcode: line.barcode, quantityChanged: units});
      this.focusSearch();
      return;
    }
  }

  moveSelection(delta) {
    const lines = this.props.order && this.props.order.lines ? this.props.order.lines : [];
    if (!lines.length) {
      return;
    }
    const current = this.state.selected < 0 ? (delta > 0 ? -1 : 0) : this.state.selected;
    let next = current + delta;
    if (next < 0) {
      next = 0;
    }
    if (next >= lines.length) {
      next = lines.length - 1;
    }
    this.setState({selected: next});
  }

  removeSelected() {
    const lines = this.props.order && this.props.order.lines ? this.props.order.lines : [];
    if (!lines.length) {
      return;
    }
    const index = this.state.selected >= 0 && this.state.selected < lines.length
      ? this.state.selected
      : lines.length - 1;
    const line = lines[index];
    this.props.newOrderProductDeleted(line.barcode, index);
    this.focusSearch();
  }

  onWindowKey(event) {
    if (document.querySelector('[role="dialog"]')) {
      if (event.key === 'Escape') {
        setTimeout(this.focusSearch, 0);
      }
      this._burst = emptyBurst();
      return;
    }
    if (this.takeScanner(event)) {
      return;
    }
    const action = applyShortcut(event, {searchEmpty: !this.state.search});
    if (!action) {
      return;
    }
    if (action === 'charge') {
      event.preventDefault();
      this.charge();
    } else if (action === 'free') {
      event.preventDefault();
      this.openFree();
    } else if (action === 'reprint') {
      event.preventDefault();
      this.openReprint();
    } else if (action === 'quantity-up') {
      event.preventDefault();
      this.adjustLast(1);
    } else if (action === 'quantity-down') {
      event.preventDefault();
      this.adjustLast(-1);
    } else if (action === 'remove') {
      event.preventDefault();
      this.removeSelected();
    } else if (action === 'select-up') {
      event.preventDefault();
      this.moveSelection(-1);
    } else if (action === 'select-down') {
      event.preventDefault();
      this.moveSelection(1);
    } else if (action === 'clear-search') {
      event.preventDefault();
      this.setState({search: ''});
      if (this.props.saleTilesRequested) {
        this.props.saleTilesRequested({text: '', limit: TILE_LIMIT});
      }
    } else if (action === 'help') {
      event.preventDefault();
      this.openHelp();
    }
  }

  takeScanner(event) {
    const key = event.key;
    if (key === 'Enter') {
      const search = event.target && event.target.name === 'barcode';
      if (isScannerBurst(this._burst.times) && this._burst.buffer) {
        event.preventDefault();
        const code = this._burst.buffer;
        this._burst = emptyBurst();
        this.lookup(code);
        return true;
      }
      if (search) {
        event.preventDefault();
        const value = event.target.value == null ? '' : String(event.target.value).trim();
        this._burst = emptyBurst();
        if (value) {
          this.lookup(value);
        }
        return true;
      }
      this._burst = emptyBurst();
      return false;
    }
    if (!key || key.length !== 1 || event.ctrlKey || event.altKey || event.metaKey) {
      return false;
    }
    const now = typeof event.timeStamp === 'number' ? event.timeStamp : Date.now();
    const previous = this._burst.times.length ? this._burst.times[this._burst.times.length - 1] : null;
    const fast = previous != null && now - previous < 30;
    if (!fast) {
      this._burst = {
        times: [now],
        buffer: key,
        snapshot: event.target && event.target.value != null ? event.target.value : '',
        field: event.target,
        active: false
      };
      return false;
    }
    if (!this._burst.active) {
      this._burst.active = true;
      restoreField(this._burst.field, this._burst.snapshot);
    }
    event.preventDefault();
    this._burst.buffer += key;
    this._burst.times.push(now);
    return true;
  }

  render() {
    const view = sellView(this.props, this.state);
    return (
      <SellScreen
        view={view}
        search={this.renderSearch(view.scanner)}
        onOpenFree={this.openFree}
        onSelectCategory={this.selectCategory}
        onPick={this.lookup}
        onSelectLine={this.selectLine}
        onQuantityChange={this.props.newOrderProductQuantityChange}
        onChanged={this.focusSearch}
        onDelete={this.props.newOrderProductDeleted}
        onClear={this.clearTicket}
        onEditWeighted={this.editWeighted}
        onCharge={this.charge}
        onCloseFree={this.closeFree}
        onConfirmFree={this.confirmFree}
        onFreeDescription={this.onFreeDescription}
        onFreeAmount={this.onFreeAmount}
        onFreeVat={this.onFreeVat}
        onCloseHelp={this.closeHelp}
        onPayMethod={this.onPayMethod}
        onTendered={this.onTendered}
        onTogglePreview={this.togglePreview}
        onConfirmPayment={this.confirmPayment}
        onClosePayment={this.closePayment}
        onCloseReprint={this.closeReprint}
        onPrintLast={this.printLast}
        freeAmountRef={this.freeAmountRef}
        setFreeAmountNode={this.setFreeAmountNode}
      />
    );
  }

  renderSearch(large) {
    const className = large ? 'sell-search sell-search-lg' : 'sell-search';
    return (
      <div className={className}>
        <TextField
          id="sell-search"
          name="barcode"
          label="Buscar o escanear"
          placeholder="Buscar producto o escanear código"
          suffix="F2"
          value={this.state.search}
          onChange={this.onSearch}
          inputRef={this.setSearchNode}
          autoFocus
        />
      </div>
    );
  }

}

function emptyBurst() {
  return {times: [], buffer: '', snapshot: '', field: null, active: false};
}

/**
 * Puts the field back to the value it had before a scanner burst.
 * The first scanned character may already have landed in the control.
 * @param {HTMLInputElement | null} field
 * @param {string} snapshot
 */
function restoreField(field, snapshot) {
  if (!field || field.value == null) {
    return;
  }
  const prototype = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  const next = snapshot == null ? '' : snapshot;
  if (prototype && prototype.set) {
    prototype.set.call(field, next);
  } else {
    field.value = next;
  }
  field.dispatchEvent(new Event('input', {bubbles: true}));
}

export default Container;
