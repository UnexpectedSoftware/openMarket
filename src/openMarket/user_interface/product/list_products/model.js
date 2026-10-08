export const catalogLimit = 20;

export const NAME_ASC = 'name_asc';
export const NAME_DESC = 'name_desc';
export const STOCK_ASC = 'stock_asc';
export const STOCK_DESC = 'stock_desc';
export const defaultCatalogSort = NAME_ASC;

export const state = () => {
  return {
    query: '',
    lowStock: false,
    status: null,
    categoryId: null,
    sort: defaultCatalogSort,
    categories: [],
    products: [],
    nextCursor: null,
    hasMore: true,
    loading: false
  };
};
