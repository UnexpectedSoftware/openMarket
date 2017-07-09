

export const LIST_ORDER_FETCH_WITH_FILTERS = 'LIST_ORDER_FETCH_WITH_FILTERS';
export const LIST_ORDER_FETCHED = 'LIST_ORDER_FETCHED';

export const listOrderFetchWithFilters = filters => ({ type: LIST_ORDER_FETCH_WITH_FILTERS,filters });
export const listOrderFetched = payload => ({ type: LIST_ORDER_FETCHED,payload});
