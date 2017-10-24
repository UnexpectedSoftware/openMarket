export const defaultLimit = 20;
export const defaultOffset = 0;

export const state = () => {
  return {
    products: [],
    filters: {
      offset: defaultOffset,
      limit: defaultLimit,
    },
    total_pages: 0,
    current_page: 0
  }
};
