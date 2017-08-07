import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ListProductContainer from './Container';
import * as ListProductActions from './action';

function mapStateToProps(state) {
  return {
    products: state.listProduct
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ListProductActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ListProductContainer);
