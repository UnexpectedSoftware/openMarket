import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import printerDialogContainer from './Container';
import * as dialogActions from './action';

function mapStateToProps(state) {
  return {
    printerDialog: state.printerDialog
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(dialogActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(printerDialogContainer);
