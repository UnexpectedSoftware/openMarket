import React from 'react';
import placeholder from '../resources/category-placeholder.svg';
import {formatUnits} from '../sales/formatUnits';

const BAR_COLORS = [
  '#E10600',
  '#1E4B9C',
  '#7A1F2B',
  '#21A366',
  '#C8102E',
  '#0B6B3A',
  '#F47B20',
  '#5E35B1',
  '#00838F',
  '#6D4C41'
];

function percentOf(quantity, max) {
  if (!max) {
    return 0;
  }
  return Math.max(0, Math.min(100, (Number(quantity) / max) * 100));
}

export default function MostSoldChart({products, onOpen}) {
  const max = products.reduce((highest, product) => Math.max(highest, Number(product.quantity) || 0), 0);
  return (
    <div className="most-sold-chart">
      <div className="most-sold-axis" aria-hidden="true">
        <span>{formatUnits(max)}</span>
        <span>{formatUnits(max / 2)}</span>
        <span>0</span>
      </div>
      <div className="most-sold-stage">
        <div className="most-sold-grid" aria-hidden="true" />
        <ul className="most-sold-series">
          {products.map((product, index) => {
            const height = percentOf(product.quantity, max);
            return (
              <li key={product.barcode}>
                <button
                  type="button"
                  className="most-sold-item"
                  onClick={() => onOpen(product.barcode)}
                >
                  <span className="most-sold-plot">
                    <span className="most-sold-value" style={{bottom: `calc(${height}% + 6px)`}}>
                      {formatUnits(product.quantity)}
                    </span>
                    <span
                      className="most-sold-bar"
                      style={{
                        height: height + '%',
                        backgroundColor: BAR_COLORS[index % BAR_COLORS.length]
                      }}
                    />
                  </span>
                  <img src={product.imageSrc || placeholder} alt="" />
                  <span className="most-sold-name" title={product.name}>{product.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
