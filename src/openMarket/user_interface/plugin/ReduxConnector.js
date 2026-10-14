import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import PluginsPage from './PluginsPage';
import * as pluginActions from './action';

function mapStateToProps(state) {
  return {pluginsPage: state.pluginsPage};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(pluginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PluginsPage);
