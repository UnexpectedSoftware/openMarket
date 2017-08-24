import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import weightedDialogContainer from './Container';
import * as dialogActions from './action';

function mapStateToProps(state) {
  return {
    weightedDialog: state.weightedDialog
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(dialogActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(weightedDialogContainer);
