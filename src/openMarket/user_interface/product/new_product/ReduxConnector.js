import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewProductContainer from './Container';
import * as NewProductActions from './action';

function mapStateToProps(state) {
  return {
    categories: state.newProduct.categories
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NewProductActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NewProductContainer);
