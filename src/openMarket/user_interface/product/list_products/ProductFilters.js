import React from 'react';
import Button from '../../components/Button';
import Select from '../../components/Select';
import TextField from '../../components/TextField';
import {Toolbar} from '../../components/PageHeader';
import ProductStatus from '../../../domain/product/ProductStatus';
import {NAME_ASC, NAME_DESC, STOCK_ASC, STOCK_DESC} from './model';

const STATUSES = [
  {value: null, label: 'Todos'},
  {value: ProductStatus.ENABLED, label: 'Activos'},
  {value: ProductStatus.DISABLED, label: 'Inactivos'}
];

const SORTS = [
  {value: NAME_ASC, label: 'nombre A–Z'},
  {value: NAME_DESC, label: 'nombre Z–A'},
  {value: STOCK_ASC, label: 'stock bajo–alto'},
  {value: STOCK_DESC, label: 'stock alto–bajo'}
];

/**
 * @param {{query: string, categoryId: string | null, categories: Array<{id: string, name: string}>, status: string | null, weighted: boolean | null, lowStock: boolean, sort: string, onQuery: Function, onCategory: Function, onStatus: Function, onWeighted: Function, onLowStock: Function, onSort: Function}} props
 */
export default function ProductFilters(props) {
  const categories = props.categories || [];
  return (
    <Toolbar>
      <div className="products-search">
        <TextField
          id="products-search"
          label="Buscar por nombre o código"
          placeholder="Buscar por nombre o código"
          value={props.query}
          onChange={props.onQuery}
        />
      </div>
      <div className="products-category-field">
        <Select
          id="products-category"
          label="Categoría"
          value={props.categoryId || ''}
          onChange={props.onCategory}
          options={[{value: '', label: 'Todas'}].concat(categories.map(categoryOption))}
        />
      </div>
      <div className="products-chips" role="group" aria-label="Estado">
        {STATUSES.map(status =>
          <Chip
            key={status.label}
            pressed={statusPressed(props.status, status.value)}
            onClick={() => props.onStatus(status.value)}
          >
            {status.label}
          </Chip>
        )}
        <Chip pressed={!!props.weighted} onClick={props.onWeighted}>A peso</Chip>
        <Chip pressed={!!props.lowStock} onClick={props.onLowStock}>Stock bajo</Chip>
      </div>
      <div className="products-sort">
        <Select
          id="products-sort"
          label="Ordenar por nombre"
          value={props.sort || NAME_ASC}
          onChange={props.onSort}
          options={SORTS}
        />
      </div>
    </Toolbar>
  );
}

/**
 * @param {{pressed: boolean, onClick: Function, children: *}} props
 */
function Chip(props) {
  return (
    <Button variant="secondary" pressed={props.pressed} onClick={props.onClick}>
      {props.children}
    </Button>
  );
}

/**
 * @param {string | null} current
 * @param {string | null} value
 * @returns {boolean}
 */
function statusPressed(current, value) {
  if (value == null) {
    return !current;
  }
  return current === value;
}

/**
 * @param {{id: string, name: string}} category
 */
function categoryOption(category) {
  return {value: category.id, label: category.name};
}
