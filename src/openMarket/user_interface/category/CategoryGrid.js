import React from 'react';
import Skeleton from '../components/Skeleton';
import CategoryCard from './CategoryCard';

const SKELETON_CARDS = [0, 1, 2, 3];

/**
 * @param {{items: object[], empty: *, onEdit: Function, onDelete: Function, onOpenProduct: Function}} props
 */
export default function CategoryGrid(props) {
  const items = props.items || [];
  if (!items.length) {
    return props.empty || null;
  }
  return (
    <div className="category-grid">
      {items.map(item =>
        <CategoryCard
          key={item.id}
          category={item}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onOpenProduct={props.onOpenProduct}
        />
      )}
    </div>
  );
}

export function CategorySkeletons() {
  return (
    <div className="category-grid" aria-hidden="true">
      {SKELETON_CARDS.map(index =>
        <div key={index} className="category-skeleton">
          <Skeleton lines={3} />
        </div>
      )}
    </div>
  );
}
