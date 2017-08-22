import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import dialogContainer from './Container';
import * as dialogActions from './action';

function mapStateToProps(state) {
  return {
    dialog: state.dialog
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(dialogActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(dialogContainer);
