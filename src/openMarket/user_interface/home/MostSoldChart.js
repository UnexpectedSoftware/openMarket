import React from 'react';
import placeholder from '../resources/category-placeholder.svg';
import {formatUnits} from '../sales/formatUnits';

const changeFormat = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero'
});

function percentOf(quantity, max) {
  if (!max) {
    return 0;
  }
  return Math.max(0, Math.min(100, (Number(quantity) / max) * 100));
}

function yearChange(quantity, previous) {
  const prior = Number(previous);
  if (!prior) {
    return null;
  }
  const change = ((Number(quantity) - prior) / prior) * 100;
  if (change > 0) {
    return {direction: 'up', text: changeFormat.format(change) + '%'};
  }
  if (change < 0) {
    return {direction: 'down', text: changeFormat.format(change) + '%'};
  }
  return {direction: 'flat', text: changeFormat.format(0) + '%'};
}

export default function MostSoldChart({products, onOpen}) {
  const max = products.reduce((highest, product) => Math.max(highest, Number(product.quantity) || 0), 0);
  return (
    <div className="most-sold-chart">
      <ul className="most-sold-rows">
        {products.map(product => {
          const width = percentOf(product.quantity, max);
          const change = yearChange(product.quantity, product.previousQuantity);
          return (
            <li key={product.barcode}>
              <button
                type="button"
                className="most-sold-item"
                onClick={() => onOpen(product.barcode)}
              >
                <span className="most-sold-card">
                  <img src={product.imageSrc || placeholder} alt="" />
                  <span className="most-sold-name" title={product.name}>{product.name}</span>
                </span>
                <span className="most-sold-plot">
                  <span className="most-sold-grid" aria-hidden="true" />
                  <span
                    className="most-sold-bar"
                    style={{width: width + '%', minWidth: width > 0 ? 2 : 0}}
                  />
                </span>
                <span className="most-sold-value">{formatUnits(product.quantity)}</span>
                <span
                  className={'most-sold-change' + (change ? ' is-' + change.direction : ' is-none')}
                  title={change ? 'Same period last year' : 'No sales in this period last year'}
                >
                  {change ? change.text : '—'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="most-sold-scale" aria-hidden="true">
        <span />
        <span className="most-sold-axis">
          <span>{formatUnits(0)}</span>
          <span>{formatUnits(max / 2)}</span>
          <span>{formatUnits(max)}</span>
        </span>
        <span />
        <span />
      </div>
    </div>
  );
}
