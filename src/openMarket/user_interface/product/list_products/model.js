export const catalogLimit = 20;

export const state = () => {
  return {
    query: '',
    lowStock: false,
    status: null,
    categoryId: null,
    categories: [],
    products: [],
    nextCursor: null,
    hasMore: true,
    loading: false
  };
};
