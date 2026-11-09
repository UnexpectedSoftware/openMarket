import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Container from './Container';
import * as actions from './action';

/**
 * @param {{report: object}} state
 */
function mapStateToProps(state) {
  return {report: state.report};
}

/**
 * @param {Function} dispatch
 */
function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Container);
