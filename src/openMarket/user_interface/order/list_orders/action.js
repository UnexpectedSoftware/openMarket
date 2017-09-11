

export const LIST_ORDER_FETCH_WITH_FILTERS = 'LIST_ORDER_FETCH_WITH_FILTERS';
export const LIST_ORDER_FILTERS_START_DATE_CHANGED = 'LIST_ORDER_FILTERS_START_DATE_CHANGED';
export const LIST_ORDER_FILTERS_END_DATE_CHANGED = 'LIST_ORDER_FILTERS_END_DATE_CHANGED';
export const LIST_ORDER_FETCHED = 'LIST_ORDER_FETCHED';
export const LIST_ORDER_DETAIL = 'LIST_ORDER_DETAIL';
export const LIST_ORDER_DETAIL_LOADED = 'LIST_ORDER_DETAIL_LOADED';



export const listOrderFetchWithFilters = filters => ({ type: LIST_ORDER_FETCH_WITH_FILTERS,filters });
export const listOrderFiltersStartDateChanged = payload => ({ type: LIST_ORDER_FILTERS_START_DATE_CHANGED,payload });
export const listOrderFiltersEndDateChanged = payload => ({ type: LIST_ORDER_FILTERS_END_DATE_CHANGED,payload });
export const listOrderFetched = payload => ({ type: LIST_ORDER_FETCHED,payload});
export const listOrderDetail = payload => ({ type: LIST_ORDER_DETAIL,payload});
export const listOrderDetailLoaded = payload => ({ type: LIST_ORDER_DETAIL_LOADED,payload});
