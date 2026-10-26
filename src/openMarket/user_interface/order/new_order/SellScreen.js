import React from 'react';
import {PageHeader} from '../../components/PageHeader';
import TextField from '../../components/TextField';
import NumberField from '../../components/NumberField';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import Badge from '../../components/Badge';
import Money from '../../../domain/money/Money';
import VatRate from '../../../domain/tax/VatRate';
import {formatMoney} from '../../i18n/money';
import {quedanText} from '../../low_stock/label';
import Cart from './Cart';
import PaymentSheet from './PaymentSheet';
import CategoryChips from './CategoryChips';
import SellClock from './SellClock';
import {placeSearch} from './sellView';
import WeightedDialog from '../weighted_dialog/ReduxConnector';
import PrinterDialog from '../printer_dialog/ReduxConnector';
import NewProductDialog from '../new_product_dialog/ReduxConnector';

/**
 * @param {{view: object, search: *, onOpenFree: Function, onSelectCategory: Function, onPick: Function, onSelectLine: Function, onQuantityChange: Function, onChanged: Function, onDelete: Function, onEditWeighted: Function, onCharge: Function, onCloseFree: Function, onConfirmFree: Function, onFreeDescription: Function, onFreeAmount: Function, onFreeVat: Function, onCloseHelp: Function, onPayMethod: Function, onTendered: Function, onTogglePreview: Function, onConfirmPayment: Function, onClosePayment: Function, onCloseReprint: Function, onPrintLast: Function, freeAmountRef: object, setFreeAmountNode: Function}} props
 */
export default function SellScreen(props) {
  const view = props.view;
  const placed = placeSearch(view.scanner, props.search);
  return (
    <div className={'sell sell-layout-' + view.layout} data-layout={view.layout}>
      <SellTop
        subtitle={view.subtitle}
        shopName={view.shopName}
        search={placed.top}
      />
      <div className="sell-body">
        <SellCatalog
          scanner={view.scanner}
          search={placed.catalog}
          categories={view.categories}
          categoryId={view.categoryId}
          tiles={view.tiles}
          tilesStatus={view.tilesStatus}
          onOpenFree={props.onOpenFree}
          onSelectCategory={props.onSelectCategory}
          onPick={props.onPick}
        />
        <Cart
          order={view.order}
          selected={view.selected}
          lowStockBarcodes={view.lowStockBarcodes}
          keypad={view.keypad}
          onSelect={props.onSelectLine}
          onQuantityChange={props.onQuantityChange}
          onChanged={props.onChanged}
          onDelete={props.onDelete}
          onEditWeighted={props.onEditWeighted}
          onCharge={props.onCharge}
        />
      </div>
      <SellDialogs {...props} />
      <WeightedDialog />
      <PrinterDialog />
      <NewProductDialog />
    </div>
  );
}

/**
 * @param {{subtitle?: string, shopName?: string, search?: *}} props
 */
export function SellTop(props) {
  return (
    <div className="sell-top">
      <PageHeader
        title="Vender"
        subtitle={props.subtitle}
        actions={(
          <div className="sell-top-actions">
            {props.search}
            <SellClock />
            {props.shopName ? <span className="sell-shop">{props.shopName}</span> : null}
          </div>
        )}
      />
    </div>
  );
}

/**
 * @param {{scanner?: boolean, search?: *, categories?: object[], categoryId?: string | null, tiles?: object[], tilesStatus?: string, onOpenFree?: Function, onSelectCategory?: Function, onPick?: Function}} props
 */
export function SellCatalog(props) {
  if (props.scanner) {
    return (
      <div className="sell-catalog">
        {props.search}
        <Button type="button" variant="secondary" className="sell-free" onClick={props.onOpenFree}>
          Venta libre
        </Button>
      </div>
    );
  }
  return (
    <div className="sell-catalog">
      <CategoryChips
        categories={props.categories}
        categoryId={props.categoryId}
        onSelect={props.onSelectCategory}
      />
      <SellGrid
        tiles={props.tiles}
        tilesStatus={props.tilesStatus}
        onOpenFree={props.onOpenFree}
        onPick={props.onPick}
      />
    </div>
  );
}

/**
 * @param {{tiles?: object[], tilesStatus?: string, onOpenFree?: Function, onPick?: Function}} props
 */
export function SellGrid(props) {
  const list = props.tiles || [];
  return (
    <div className="sell-grid">
      <button type="button" className="sell-tile sell-tile-free" onClick={props.onOpenFree}>
        <span className="sell-tile-name">Venta libre</span>
        <span>F8</span>
      </button>
      {gridNotice(props.tilesStatus, list.length)}
      {list.map(tile => sellTile(tile, props.onPick))}
    </div>
  );
}

/**
 * @param {string | null | undefined} status
 * @param {number} count
 */
export function gridNotice(status, count) {
  if (status === 'loading' && count === 0) {
    return <Skeleton lines={3} />;
  }
  if (status === 'error') {
    return <EmptyState icon="exclamation-triangle" title="No se pudieron cargar los productos" />;
  }
  if (status !== 'loading' && count === 0) {
    return <EmptyState icon="barcode" title="No hay productos" />;
  }
  return null;
}

/**
 * @param {{barcode: string, name: string, priceCents: number, imageUrl?: string | null}} tile
 * @param {Function | undefined} onPick
 */
export function sellTile(tile, onPick) {
  const quedan = quedanText(tile);
  return (
    <button
      type="button"
      className="sell-tile"
      key={tile.barcode}
      onClick={() => pickTile(onPick, tile.barcode)}
    >
      {tile.imageUrl ? <img src={tile.imageUrl} alt="" /> : null}
      <span className="sell-tile-name">{tile.name}</span>
      <span className="sell-tile-price">{formatMoney(Money.ofCents(tile.priceCents || 0))}</span>
      {quedan ? <Badge tone="warning">{quedan}</Badge> : null}
    </button>
  );
}

/**
 * @param {Function | undefined} onPick
 * @param {string} barcode
 */
function pickTile(onPick, barcode) {
  if (onPick) {
    onPick(barcode);
  }
}

/**
 * @param {object} props
 */
export function SellDialogs(props) {
  const view = props.view;
  return (
    <div className="sell-dialogs">
      {freeDialog(props, view)}
      {helpDialog(props, view)}
      {paymentDialog(props, view)}
      {reprintDialog(props, view)}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} view
 */
function freeDialog(props, view) {
  return (
    <Dialog
      open={view.freeOpen}
      title="Venta libre"
      onClose={props.onCloseFree}
      initialFocusRef={props.freeAmountRef}
      actions={(
        <Button type="button" disabled={!view.freeValid} onClick={props.onConfirmFree}>Guardar</Button>
      )}
    >
      <TextField
        id="free-description"
        label="Descripción"
        value={view.freeDescription}
        onChange={props.onFreeDescription}
      />
      <NumberField
        id="free-amount"
        label="Importe"
        unit="€"
        decimals={2}
        value={view.freeAmount}
        onChange={props.onFreeAmount}
        inputRef={props.setFreeAmountNode}
      />
      <Select
        id="free-vat"
        label="IVA"
        value={view.freeVat}
        options={VatRate.options().map(option => ({value: option.code, label: option.label}))}
        onChange={props.onFreeVat}
      />
    </Dialog>
  );
}

/**
 * @param {object} props
 * @param {object} view
 */
function helpDialog(props, view) {
  return (
    <Dialog open={view.helpOpen} title="Atajos" onClose={props.onCloseHelp}>
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
  );
}

/**
 * @param {object} props
 * @param {object} view
 */
function paymentDialog(props, view) {
  return (
    <PaymentSheet
      open={view.paymentOpen}
      total={view.order && view.order.total}
      method={view.payMethod}
      tendered={view.tendered}
      saving={view.saving}
      previewHtml={view.previewHtml}
      previewOpen={view.previewOpen}
      onMethod={props.onPayMethod}
      onTendered={props.onTendered}
      onTogglePreview={props.onTogglePreview}
      onConfirm={props.onConfirmPayment}
      onClose={props.onClosePayment}
    />
  );
}

/**
 * @param {object} props
 * @param {object} view
 */
function reprintDialog(props, view) {
  return (
    <Dialog
      open={view.reprintOpen}
      title="Ticket"
      onClose={props.onCloseReprint}
      actions={(
        <Button type="button" icon="print" onClick={props.onPrintLast}>Imprimir</Button>
      )}
    >
      {reprintBody(view.reprintHtml)}
    </Dialog>
  );
}

/**
 * @param {string | null | undefined} html
 */
export function reprintBody(html) {
  if (html) {
    return <div className="om-receipt-preview" dangerouslySetInnerHTML={{__html: html}} />;
  }
  return <p className="payment-preview-wait">Preparando el ticket…</p>;
}
