import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Container from './Container';
import * as settingsActions from './action';

function mapStateToProps(state) {
  return {settings: state.settings};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(settingsActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Container);
