import React, {Component} from 'react';
import Skeleton from './Skeleton';

/**
 * @typedef {Object} DataTableColumn
 * @property {string} key
 * @property {string} header
 * @property {Function} [render] `(row) => node`
 * @property {'start'|'end'} [align] `end` is for numbers.
 * @property {boolean} [sortable]
 */

/**
 * @typedef {Object} DataTableProps
 * @property {DataTableColumn[]} columns
 * @property {Object[]} rows
 * @property {string} rowKey Property used as the React key.
 * @property {{key: string, dir: 'asc'|'desc'}} [sort]
 * @property {Function} [onSort] Called with `{key, dir}`.
 * @property {boolean} [loading]
 * @property {*} [empty] Shown when there are no rows.
 * @property {Function} [onRowClick]
 */

/**
 * Read-only table. Sortable headers are buttons. Does not pad with empty rows.
 */
export default class DataTable extends Component {

  constructor(props) {
    super(props);
    this.onHeader = this.onHeader.bind(this);
  }

  onHeader(key) {
    if (!this.props.onSort) {
      return;
    }
    const sort = this.props.sort || {};
    const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
    this.props.onSort({key, dir});
  }

  ariaSort(column) {
    if (!column.sortable) {
      return undefined;
    }
    const sort = this.props.sort || {};
    if (sort.key !== column.key) {
      return 'none';
    }
    return sort.dir === 'desc' ? 'descending' : 'ascending';
  }

  cell(column, row) {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key];
    return value == null ? '' : value;
  }

  render() {
    const columns = this.props.columns || [];
    const rows = this.props.rows || [];
    const loading = !!this.props.loading;
    const rowKey = this.props.rowKey;
    return (
      <div className="om-table-wrap">
        <table className="om-table">
          <thead>
            <tr>
              {columns.map(column => {
                const align = column.align === 'end' ? ' om-table-numeric' : '';
                return (
                  <th key={column.key} className={'om-table-head' + align} aria-sort={this.ariaSort(column)} scope="col">
                    {column.sortable ? (
                      <button type="button" className="om-table-sort" onClick={() => this.onHeader(column.key)}>
                        {column.header}
                      </button>
                    ) : column.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? this.skeletonRows(columns) : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td className="om-table-empty" colSpan={columns.length || 1}>{this.props.empty}</td>
              </tr>
            ) : null}
            {!loading && rows.map(row => this.renderRow(row, columns, rowKey))}
          </tbody>
        </table>
      </div>
    );
  }

  skeletonRows(columns) {
    const rows = [];
    for (let index = 0; index < 3; index += 1) {
      rows.push(
        <tr key={'loading-' + index}>
          {columns.map(column =>
            <td key={column.key}><Skeleton width="70%" /></td>
          )}
        </tr>
      );
    }
    return rows;
  }

  renderRow(row, columns, rowKey) {
    const clickable = !!this.props.onRowClick;
    const onClick = clickable ? () => this.props.onRowClick(row) : undefined;
    const onKeyDown = clickable ? (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.props.onRowClick(row);
      }
    } : undefined;
    return (
      <tr
        key={row[rowKey]}
        className={clickable ? 'is-clickable' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {columns.map(column => {
          const align = column.align === 'end' ? ' om-table-numeric' : '';
          return <td key={column.key} className={align.trim() || undefined}>{this.cell(column, row)}</td>;
        })}
      </tr>
    );
  }
}
