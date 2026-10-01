export const HOME_PAGE_LOADED = 'HOME_PAGE_LOADED';
export const HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED = 'HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED';
export const MOST_SOLD_REQUESTED = 'MOST_SOLD_REQUESTED';
export const MOST_SOLD_LOADED = 'MOST_SOLD_LOADED';

export const homePageLoaded = () => ({ type: HOME_PAGE_LOADED });
export const homePageStatisticsTotalAmountByDayLoaded = payload => ({ type: HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED, payload });
export const mostSoldRequested = window => ({ type: MOST_SOLD_REQUESTED, window });
export const mostSoldLoaded = payload => ({ type: MOST_SOLD_LOADED, payload });

