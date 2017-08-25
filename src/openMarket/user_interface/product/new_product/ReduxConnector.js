import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewProductContainer from './Container';
import * as NewProductActions from './action';
import {formValueSelector} from "redux-form";

const selector = formValueSelector('new_product')

function mapStateToProps(state, ownProps) {
  return {
    categories: state.newProduct.categories,
    edit: ownProps.location.pathname.includes("edit_product"),
    initialValues: state.newProduct.initialValues,
    barcode: selector(state, 'barcode'),
    showUpdateFields: state.newProduct.showUpdateFields
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NewProductActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NewProductContainer);
