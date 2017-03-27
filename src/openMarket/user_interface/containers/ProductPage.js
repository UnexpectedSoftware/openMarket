import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Product from '../components/Product';
import * as ProductActions from '../actions/product';

function mapStateToProps(state) {
  return {
    categories: state.categories
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ProductActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Product);
