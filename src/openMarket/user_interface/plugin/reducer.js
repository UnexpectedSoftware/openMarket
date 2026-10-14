import {PLUGINS_LISTED, PLUGINS_SAVED, PLUGIN_SAVE_FAILED} from './action';

const INITIAL = {
  directory: '',
  plugins: [],
  loaded: false,
  restartRequired: false,
  error: null
};

export default function reducer(state = INITIAL, action) {
  switch (action.type) {
    case PLUGINS_LISTED:
      return {
        ...state,
        directory: action.page.directory,
        plugins: action.page.plugins,
        loaded: true,
        error: null
      };
    case PLUGINS_SAVED:
      return {
        ...state,
        directory: action.page.directory,
        plugins: action.page.plugins,
        loaded: true,
        restartRequired: true,
        error: null
      };
    case PLUGIN_SAVE_FAILED:
      return {
        ...state,
        error: action.message
      };
    default:
      return state;
  }
}
