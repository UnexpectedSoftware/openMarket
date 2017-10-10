import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import homeContainer from './Container';
import * as homeActions from './action';

function mapStateToProps(state) {
  return {
    statistics: state.statistics
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(homeActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(homeContainer);
