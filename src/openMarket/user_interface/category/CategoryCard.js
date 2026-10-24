import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Money from '../../domain/money/Money';
import {formatMoney} from '../i18n/money';
import {formatUnits} from '../sales/formatUnits';
import placeholder from '../resources/category-placeholder.svg';

/**
 * @param {{category: object, onEdit: Function, onDelete: Function, onOpenProduct: Function}} props
 */
export default function CategoryCard(props) {
  const category = props.category;
  return (
    <Card as="article">
      <div className="category-card">
        <div className="category-card-photo">
          <img src={category.imageUrl || placeholder} alt="" />
        </div>
        <p className="category-card-name">{category.name}</p>
        <dl className="category-card-facts">
          <Fact label="Productos">{category.productCount || 0}</Fact>
          <Fact label="Valor" title="Suma de precios de coste">{costLabel(category.basePriceCents)}</Fact>
          <Fact label="Stock">{formatUnits(category.stockTotal || 0)}</Fact>
          <Fact label="Más vendido">
            <MostSold mostSold={category.mostSold} onOpen={props.onOpenProduct} />
          </Fact>
        </dl>
        <div className="category-card-actions">
          <Button variant="ghost" onClick={() => props.onEdit(category)}>Editar</Button>
          {category.productCount === 0 ? (
            <Button variant="danger" label="Eliminar categoría" onClick={() => props.onDelete(category)}>
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/**
 * @param {{label: string, title?: string, children: *}} props
 */
function Fact(props) {
  return (
    <div>
      <dt>{props.label}</dt>
      <dd title={props.title}>{props.children}</dd>
    </div>
  );
}

/**
 * @param {number | null | undefined} cents
 * @returns {string}
 */
function costLabel(cents) {
  return formatMoney(Money.ofCents(cents || 0));
}

/**
 * @param {{mostSold: {barcode: string, name: string} | null, onOpen: Function}} props
 */
function MostSold(props) {
  const mostSold = props.mostSold;
  if (!mostSold) {
    return <span>—</span>;
  }
  return (
    <a
      href="#/create_product?edition=true"
      className="category-card-most-sold"
      title={mostSold.name}
      onClick={event => {
        event.preventDefault();
        props.onOpen(mostSold.barcode);
      }}
    >
      {mostSold.name}
    </a>
  );
}
