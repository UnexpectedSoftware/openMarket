import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ListProductsContainer from './Container';
import * as ListProductsActions from './action';

function mapStateToProps(state) {
  return {
    products: state.listProducts
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ListProductsActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ListProductsContainer);
