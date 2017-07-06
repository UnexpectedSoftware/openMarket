
export const LIST_ORDER_FETCH = 'LIST_ORDER_FETCH';
export const LIST_ORDER_FETCH_WITH_FILTERS = 'LIST_ORDER_FETCH_WITH_FILTERS';
export const LIST_ORDER_FETCHED = 'LIST_ORDER_FETCHED';


export const listOrderFetch = () => ({ type: LIST_ORDER_FETCH });
export const listOrderFetchWithFilters = filters => ({ type: LIST_ORDER_FETCH_WITH_FILTERS,filters });
export const listOrderFetched = payload => ({ type: LIST_ORDER_FETCHED,payload});
