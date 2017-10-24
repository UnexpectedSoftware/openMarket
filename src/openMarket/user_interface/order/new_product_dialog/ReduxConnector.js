import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import newProductDialogContainer from './Container';
import * as newProductDialogActions from './action';

function mapStateToProps(state) {
  return {
    newProductDialog: state.newProductDialog
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(newProductDialogActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(newProductDialogContainer);
