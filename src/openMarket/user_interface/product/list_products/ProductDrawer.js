import React from 'react';
import VatRate from '../../../domain/tax/VatRate';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import ImageField from '../../components/ImageField';
import NumberField from '../../components/NumberField';
import Select from '../../components/Select';
import TextField from '../../components/TextField';
import {formatMargin} from './format';

/**
 * @param {{open: boolean, mode: string, draft: object, errors: object, formError: string, saving: boolean, loadingDraft: boolean, imageLookupBusy: boolean, categories: Array<{id: string, name: string}>, nameRef: {current: HTMLElement | null}, imageRef: Function, onField: Function, onClose: Function, onSave: Function, onArchive: Function, onFindImage: Function}} props
 */
export default function ProductDrawer(props) {
  const draft = props.draft || {};
  const editing = props.mode === 'edit';
  return (
    <Dialog
      open={props.open}
      placement="drawer"
      title={drawerTitle(editing)}
      onClose={props.onClose}
      initialFocusRef={props.nameRef}
      actions={drawerActions(props, editing)}
    >
      {formAlert(props.formError)}
      {props.loadingDraft ? null : drawerBody(props, draft, editing)}
    </Dialog>
  );
}

/** @param {boolean} editing */
function drawerTitle(editing) {
  return editing ? 'Editar producto' : 'Nuevo producto';
}

/** @param {string} formError */
function formAlert(formError) {
  if (!formError) {
    return null;
  }
  return <p className="products-drawer-error" role="alert">{formError}</p>;
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {boolean} editing
 */
function drawerBody(props, draft, editing) {
  const errors = props.errors || {};
  return (
    <div className="products-drawer-fields">
      {imageBlock(props, draft, editing)}
      {nameField(props, draft, errors)}
      {barcodeField(props, draft, errors, editing)}
      {descriptionField(props, draft)}
      {categoryField(props, draft, errors)}
      {moneyFields(props, draft, errors)}
      {marginLine(draft)}
      {vatField(props, draft, errors)}
      {stockFields(props, draft, errors)}
      {switches(props, draft)}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {boolean} editing
 */
function imageBlock(props, draft, editing) {
  return (
    <div className="products-drawer-image">
      <ImageField
        inputId="product-image"
        currentSrc={currentImage(draft)}
        remoteSrc={remoteImage(draft)}
        remotePath={draft.imagePath}
        ref={props.imageRef}
      />
      {lookupControl(props, editing)}
    </div>
  );
}

/** @param {object} draft */
function currentImage(draft) {
  if (draft.imagePath) {
    return null;
  }
  return draft.imageUrl;
}

/** @param {object} draft */
function remoteImage(draft) {
  if (!draft.imagePath) {
    return null;
  }
  return draft.imageUrl;
}

/**
 * @param {object} props
 * @param {boolean} editing
 */
function lookupControl(props, editing) {
  if (editing) {
    return null;
  }
  return (
    <Button
      type="button"
      variant="secondary"
      busy={props.imageLookupBusy}
      icon="search"
      onClick={props.onFindImage}
    >
      {lookupLabel(props.imageLookupBusy)}
    </Button>
  );
}

/** @param {boolean} busy */
function lookupLabel(busy) {
  return busy ? 'Buscando…' : 'Buscar imagen';
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 */
function nameField(props, draft, errors) {
  return (
    <TextField
      id="product-name"
      name="name"
      label="Nombre"
      value={draft.name}
      error={errors.name}
      autoFocus
      inputRef={node => rememberName(props, node)}
      onChange={event => props.onField('name', event.target.value)}
    />
  );
}

/**
 * @param {{nameRef: {current: HTMLElement | null}}} props
 * @param {HTMLElement | null} node
 */
function rememberName(props, node) {
  props.nameRef.current = node;
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 * @param {boolean} editing
 */
function barcodeField(props, draft, errors, editing) {
  return (
    <TextField
      id="product-barcode"
      name="barcode"
      label="Código de barras"
      value={draft.barcode}
      error={errors.barcode}
      readOnly={editing}
      onChange={event => props.onField('barcode', event.target.value)}
    />
  );
}

/**
 * @param {object} props
 * @param {object} draft
 */
function descriptionField(props, draft) {
  return (
    <TextField
      id="product-description"
      name="description"
      label="Descripción"
      value={draft.description}
      multiline
      onChange={event => props.onField('description', event.target.value)}
    />
  );
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 */
function categoryField(props, draft, errors) {
  return (
    <Select
      id="product-category"
      name="categoryId"
      label="Categoría"
      value={draft.categoryId || ''}
      error={errors.categoryId}
      options={categoryOptions(props.categories)}
      onChange={event => props.onField('categoryId', event.target.value)}
    />
  );
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 */
function moneyFields(props, draft, errors) {
  return (
    <div className="products-drawer-pair">
      <NumberField
        id="product-price"
        name="price"
        label="PVP"
        unit="€"
        value={draft.price}
        error={errors.price}
        onChange={value => props.onField('price', value)}
      />
      <NumberField
        id="product-base-price"
        name="basePrice"
        label="Coste"
        unit="€"
        value={draft.basePrice}
        error={errors.basePrice}
        onChange={value => props.onField('basePrice', value)}
      />
    </div>
  );
}

/** @param {object} draft */
function marginLine(draft) {
  return (
    <p className="products-margin-line">
      <span>Margen</span>
      <strong>{formatMargin(draft.marginPercent)}</strong>
      <span>margen sobre PVP</span>
    </p>
  );
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 */
function vatField(props, draft, errors) {
  return (
    <Select
      id="product-vat"
      name="vatRate"
      label="IVA"
      value={draft.vatRate || ''}
      error={errors.vatRate}
      options={vatOptions()}
      onChange={event => props.onField('vatRate', event.target.value)}
    />
  );
}

/**
 * @param {object} props
 * @param {object} draft
 * @param {object} errors
 */
function stockFields(props, draft, errors) {
  return (
    <div className="products-drawer-pair">
      <NumberField
        id="product-stock"
        name="stock"
        label="Stock"
        value={draft.stock}
        error={errors.stock}
        onChange={value => props.onField('stock', value)}
      />
      <NumberField
        id="product-stock-min"
        name="stockMin"
        label="Stock mínimo"
        value={draft.stockMin}
        error={errors.stockMin}
        onChange={value => props.onField('stockMin', value)}
      />
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} draft
 */
function switches(props, draft) {
  return (
    <div className="products-drawer-switches">
      <Switch
        checked={!!draft.weighted}
        label="Se vende a peso"
        onChange={value => props.onField('weighted', value)}
      />
      <Switch
        checked={!!draft.active}
        label="Activo"
        onChange={value => props.onField('active', value)}
      />
    </div>
  );
}

/**
 * @param {{saving: boolean, loadingDraft: boolean, onClose: Function, onSave: Function, onArchive: Function}} props
 * @param {boolean} editing
 */
function drawerActions(props, editing) {
  return (
    <div className="products-drawer-actions">
      {deleteAction(props, editing)}
      <Button variant="secondary" disabled={props.saving} onClick={props.onClose}>Cancelar</Button>
      <Button variant="primary" busy={props.saving} disabled={props.loadingDraft} onClick={props.onSave}>Guardar</Button>
    </div>
  );
}

/**
 * @param {{saving: boolean, onArchive: Function}} props
 * @param {boolean} editing
 */
function deleteAction(props, editing) {
  if (!editing) {
    return null;
  }
  return (
    <Button variant="danger" className="products-drawer-delete" disabled={props.saving} onClick={props.onArchive}>
      Eliminar
    </Button>
  );
}

/**
 * @param {{checked: boolean, label: string, onChange: Function}} props
 */
function Switch(props) {
  return (
    <button
      type="button"
      className="products-switch"
      role="switch"
      aria-checked={props.checked ? 'true' : 'false'}
      onClick={() => props.onChange(!props.checked)}
    >
      {props.label}
    </button>
  );
}

/**
 * @param {Array<{id: string, name: string}>} categories
 */
function categoryOptions(categories) {
  return [{value: '', label: 'Elige una categoría'}].concat(
    (categories || []).map(category => ({value: category.id, label: category.name}))
  );
}

function vatOptions() {
  return VatRate.options().map(option => ({value: option.code, label: option.label}));
}
