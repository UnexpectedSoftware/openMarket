import React from 'react';
import Button from '../../components/Button';

/**
 * Category filter for the sale grid. Todos clears the filter.
 * @param {{categories?: {id: string, name: string}[], categoryId?: string | null, onSelect?: Function}} props
 */
export default function CategoryChips(props) {
  const selected = props.categoryId || null;
  const categories = props.categories || [];
  return (
    <div className="sell-chips" role="group" aria-label="Categorías">
      <Button
        type="button"
        variant="ghost"
        className="sell-chip"
        pressed={!selected}
        onClick={() => selectChip(props.onSelect, null)}
      >
        Todos
      </Button>
      {categories.map(category => (
        <Button
          key={category.id}
          type="button"
          variant="ghost"
          className="sell-chip"
          pressed={selected === category.id}
          onClick={() => selectChip(props.onSelect, category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}

/**
 * @param {Function | undefined} onSelect
 * @param {string | null} categoryId
 */
function selectChip(onSelect, categoryId) {
  if (onSelect) {
    onSelect(categoryId);
  }
}
