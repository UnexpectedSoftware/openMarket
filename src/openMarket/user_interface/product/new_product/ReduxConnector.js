import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewProductContainer from './Container';
import * as NewProductActions from './action';
import {formValueSelector} from "redux-form";

const selector = formValueSelector('new_product')

function mapStateToProps(state, ownProps) {
  return {
    ...state.newProduct,
    barcode: selector(state, 'barcode'),
    status: selector(state, 'status')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NewProductActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NewProductContainer);
