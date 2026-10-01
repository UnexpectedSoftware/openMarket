import React from 'react';
import {SALES_WINDOWS} from '../../application/service/product/salesWindows';

export default function SalesWindowSelect({value, onChange}) {
  return (
    <label className="sales-window-label">
      Period
      <select
        className="sales-window"
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        {SALES_WINDOWS.map(item =>
          <option value={item.id} key={item.id}>{item.label}</option>
        )}
      </select>
    </label>
  );
}
