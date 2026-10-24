import React from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import Money from '../../../domain/money/Money';
import ProductStatus from '../../../domain/product/ProductStatus';
import {formatMoney} from '../../i18n/money';
import {formatMargin, formatStock} from './format';
import {showingLabel} from './model';
import {statusLabel, statusTone} from './statusLabel';

/**
 * @param {{items?: object[], total?: number, offset?: number, limit?: number, loading?: boolean, error?: string, empty?: *, onEdit: Function, onDisable: Function, onPage: Function, onRetry: Function}} props
 */
export default function ProductTable(props) {
  const items = props.items || [];
  const loading = !!props.loading;
  if (props.error && items.length === 0 && !loading) {
    return <ProductsError message={props.error} onRetry={props.onRetry} />;
  }
  return (
    <div className="products-table">
      {props.error && !loading ? <ProductsError message={props.error} onRetry={props.onRetry} /> : null}
      <DataTable
        columns={columns(props)}
        rows={items}
        rowKey="barcode"
        loading={loading}
        empty={props.empty}
      />
      {props.total > 0 ? <ProductPager {...props} /> : null}
    </div>
  );
}

/**
 * @param {{message: string, onRetry: Function}} props
 */
function ProductsError(props) {
  return (
    <div className="products-error" role="alert">
      <p>{props.message}</p>
      <Button variant="secondary" onClick={props.onRetry}>Reintentar</Button>
    </div>
  );
}

/**
 * @param {{offset?: number, limit?: number, total?: number, loading?: boolean, onPage: Function}} props
 */
function ProductPager(props) {
  const offset = props.offset || 0;
  const limit = props.limit || 0;
  const total = props.total || 0;
  return (
    <div className="products-footer">
      <p className="products-range" role="status">{showingLabel(props)}</p>
      <div className="products-pager">
        <Button variant="secondary" disabled={props.loading || offset <= 0} onClick={() => props.onPage(offset - limit)}>
          Anterior
        </Button>
        <Button variant="secondary" disabled={props.loading || offset + limit >= total} onClick={() => props.onPage(offset + limit)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

/**
 * @param {{onEdit: Function, onDisable: Function}} props
 */
function columns(props) {
  return [
    {key: 'product', header: 'Producto', render: productCell},
    {key: 'barcode', header: 'Código de barras', render: barcodeCell},
    {key: 'price', header: 'PVP', align: 'end', render: priceCell},
    {key: 'margin', header: 'Margen', align: 'end', render: marginCell},
    {key: 'stock', header: 'Stock', align: 'end', render: stockCell},
    {key: 'status', header: 'Estado', render: statusCell},
    {key: 'actions', header: 'Acciones', render: row => actionsCell(row, props)}
  ];
}

/** @param {object} row */
function productCell(row) {
  return (
    <div className="products-product">
      <ProductThumb row={row} />
      <div>
        <div className="products-name">{row.name}</div>
        {row.categoryName ? <div className="products-category-name">{row.categoryName}</div> : null}
      </div>
    </div>
  );
}

/** @param {{row: object}} props */
function ProductThumb(props) {
  const src = props.row.imageSrc || props.row.imageUrl;
  if (!src) {
    return <span className="products-thumb" aria-hidden="true" />;
  }
  return <img className="products-thumb" src={src} alt="" />;
}

/** @param {object} row */
function barcodeCell(row) {
  return <span className="products-barcode">{row.barcode}</span>;
}

/** @param {object} row */
function priceCell(row) {
  if (!Number.isInteger(row.priceCents)) {
    return '—';
  }
  return formatMoney(Money.ofCents(row.priceCents));
}

/** @param {object} row */
function marginCell(row) {
  return formatMargin(row.marginPercent);
}

/** @param {object} row */
function stockCell(row) {
  return (
    <span className="products-stock">
      <span className="products-stock-qty">{formatStock(row.stock, row.weighted)}</span>
      {row.lowStock ? <Badge tone="warning">bajo</Badge> : null}
    </span>
  );
}

/** @param {object} row */
function statusCell(row) {
  return <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>;
}

/**
 * @param {object} row
 * @param {{onEdit: Function, onDisable: Function}} props
 */
function actionsCell(row, props) {
  return (
    <div className="products-actions">
      <Button variant="ghost" onClick={() => props.onEdit(row)}>Editar</Button>
      {row.status === ProductStatus.DISABLED ? null : (
        <Button variant="ghost" onClick={() => props.onDisable(row.barcode)}>Desactivar</Button>
      )}
    </div>
  );
}
