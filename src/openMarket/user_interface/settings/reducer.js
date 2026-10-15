import {SHOP_PROFILE_FAILED, SHOP_PROFILE_LOADED, SHOP_PROFILE_SAVED} from './action';

const INITIAL = {
  loaded: false,
  revision: 0,
  nif: '',
  legalName: '',
  tradeName: '',
  street: '',
  postalCode: '',
  city: '',
  province: '',
  country: 'ES',
  invoicingEnabled: false,
  issuer: null,
  error: null,
  saved: false
};

export default function reducer(state = INITIAL, action) {
  switch (action.type) {
    case SHOP_PROFILE_LOADED:
      return applyProfile(state, action.profile, false);
    case SHOP_PROFILE_SAVED:
      return applyProfile(state, action.profile, true);
    case SHOP_PROFILE_FAILED:
      return {...state, error: action.message, saved: false};
    default:
      return state;
  }
}

/**
 * @param {typeof INITIAL} state
 * @param {object} profile
 * @param {boolean} saved
 */
function applyProfile(state, profile, saved) {
  return {
    ...state,
    ...profile,
    loaded: true,
    saved,
    error: null,
    revision: state.revision + 1
  };
}
