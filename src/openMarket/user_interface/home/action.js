export const HOME_PAGE_LOADED = 'HOME_PAGE_LOADED';
export const HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED = 'HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED';

export const homePageLoaded = () => ({ type: HOME_PAGE_LOADED });
export const homePageStatisticsTotalAmountByDayLoaded = payload => ({ type: HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED, payload });

