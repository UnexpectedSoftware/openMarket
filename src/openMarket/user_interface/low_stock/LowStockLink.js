import React from 'react';
import {Link} from 'react-router';
import Badge from '../components/Badge';

/**
 * Informes chip. Hidden when nothing is low. Opens the product list filtered to low stock.
 * @param {{count?: number | null}} props
 */
export default function LowStockLink(props) {
  const count = Number(props.count);
  if (!Number.isFinite(count) || count < 1) {
    return null;
  }
  return (
    <Link
      to={{pathname: '/list_products', query: {lowStock: '1'}}}
      className="dashboard-low-stock"
    >
      <Badge tone="warning">{'Stock bajo ' + Math.floor(count)}</Badge>
    </Link>
  );
}
