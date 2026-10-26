import React, {Component} from 'react';
import {PageHeader} from '../../components/PageHeader';
import TextField from '../../components/TextField';
import NumberField, {parseDecimal} from '../../components/NumberField';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import VatRate from '../../../domain/tax/VatRate';
import {formatMoney} from '../../i18n/money';
import {lineIsValid} from './model';
import SellLayout from '../../../domain/appearance/SellLayout';
import {quedanText} from '../../low_stock/label';
import {isScannerBurst, applyShortcut} from './input';
import Cart from './Cart';
import PaymentSheet from './PaymentSheet';
import WeightedDialog from '../weighted_dialog/ReduxConnector';
import PrinterDialog from '../printer_dialog/ReduxConnector';
import NewProductDialog from '../new_product_dialog/ReduxConnector';

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
    const {order, issuer, tiles, tilesStatus, lowStockBarcodes} = this.props;
    const layout = SellLayout.orDefault(this.props.layout);
    const scanner = layout === 'escaner';
    const issuerName = issuer && (issuer.tradeName || issuer.legalName);
    const subtitle = issuer && issuer.nif ? issuerName + ' · NIF ' + issuer.nif : undefined;
    const amount = parseDecimal(this.state.freeAmount);
    const freeValid = String(this.state.freeDescription || '').trim() !== '' && amount != null && amount > 0;
    return (
      <div className={'sell sell-layout-' + layout} data-layout={layout}>
        <div className="sell-catalog">
          <PageHeader title="Vender" subtitle={subtitle} />
          <div className={scanner ? 'sell-search sell-search-lg' : 'sell-search'}>
            <TextField
              id="sell-search"
              name="barcode"
              label="Buscar o escanear"
              value={this.state.search}
              onChange={this.onSearch}
              inputRef={this.setSearchNode}
              autoFocus
            />
          </div>
          {scanner ? (
            <Button type="button" variant="secondary" className="sell-free" onClick={this.openFree}>
              Venta libre
            </Button>
          ) : this.renderGrid(tiles, tilesStatus)}
        </div>
        <Cart
          order={order}
          selected={this.state.selected}
          lowStockBarcodes={lowStockBarcodes}
          keypad={layout === 'tactil'}
          onSelect={index => this.setState({selected: index})}
          onQuantityChange={this.props.newOrderProductQuantityChange}
          onChanged={this.focusSearch}
          onDelete={this.props.newOrderProductDeleted}
          onEditWeighted={line => this.editWeighted(line)}
          onCharge={this.charge}
        />
        <Dialog
          open={this.state.freeOpen}
          title="Venta libre"
          onClose={this.closeFree}
          initialFocusRef={this.freeAmountRef}
          actions={(
            <Button type="button" disabled={!freeValid} onClick={this.confirmFree}>Guardar</Button>
          )}
        >
          <TextField
            id="free-description"
            label="Descripción"
            value={this.state.freeDescription}
            onChange={this.onFreeDescription}
          />
          <NumberField
            id="free-amount"
            label="Importe"
            unit="€"
            decimals={2}
            value={this.state.freeAmount}
            onChange={this.onFreeAmount}
            inputRef={this.setFreeAmountNode}
          />
          <Select
            id="free-vat"
            label="IVA"
            value={this.state.freeVat}
            options={VatRate.options().map(option => ({value: option.code, label: option.label}))}
            onChange={this.onFreeVat}
          />
        </Dialog>
        <Dialog open={this.state.helpOpen} title="Atajos" onClose={this.closeHelp}>
          <ul className="sell-help">
            <li>F12 o Ctrl+Enter: Cobrar</li>
            <li>F8: Venta libre</li>
            <li>+ y −: cantidad de la última línea</li>
            <li>Supr: quitar la línea seleccionada</li>
            <li>Flechas: seleccionar una línea</li>
            <li>Esc: limpiar la búsqueda</li>
            <li>F9: vista previa del último ticket</li>
          </ul>
        </Dialog>
        <PaymentSheet
          open={this.state.paymentOpen}
          total={order && order.total}
          method={this.state.payMethod}
          tendered={this.state.tendered}
          saving={this.props.saving}
          previewHtml={this.props.previewHtml}
          previewOpen={this.state.previewOpen}
          onMethod={this.onPayMethod}
          onTendered={this.onTendered}
          onTogglePreview={this.togglePreview}
          onConfirm={this.confirmPayment}
          onClose={this.closePayment}
        />
        <Dialog
          open={this.state.reprintOpen}
          title="Ticket"
          onClose={this.closeReprint}
          actions={(
            <Button type="button" icon="print" onClick={this.printLast}>Imprimir</Button>
          )}
        >
          {this.props.reprintHtml ? (
            <div className="om-receipt-preview" dangerouslySetInnerHTML={{__html: this.props.reprintHtml}} />
          ) : (
            <p className="payment-preview-wait">Preparando el ticket…</p>
          )}
        </Dialog>
        <WeightedDialog />
        <PrinterDialog />
        <NewProductDialog />
      </div>
    );
  }

  renderTile(tile) {
    const quedan = quedanText(tile);
    return (
      <button
        type="button"
        className="sell-tile"
        key={tile.barcode}
        onClick={() => this.lookup(tile.barcode)}
      >
        {tile.imageUrl ? <img src={tile.imageUrl} alt="" /> : null}
        <span className="sell-tile-name">{tile.name}</span>
        <span className="sell-tile-price">{formatMoney(Money.ofCents(tile.priceCents))}</span>
        {quedan ? <Badge tone="warning">{quedan}</Badge> : null}
      </button>
    );
  }

  renderGrid(tiles, tilesStatus) {
    const list = tiles || [];
    return (
      <div className="sell-grid">
        <button type="button" className="sell-tile sell-tile-free" onClick={this.openFree}>
          <span className="sell-tile-name">Venta libre</span>
          <span>F8</span>
        </button>
        {tilesStatus === 'loading' && list.length === 0 ? <Skeleton lines={3} /> : null}
        {tilesStatus === 'error' ? (
          <EmptyState icon="exclamation-triangle" title="No se pudieron cargar los productos" />
        ) : null}
        {tilesStatus !== 'error' && tilesStatus !== 'loading' && list.length === 0 ? (
          <EmptyState icon="barcode" title="No hay productos" />
        ) : null}
        {list.map(tile => this.renderTile(tile))}
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
