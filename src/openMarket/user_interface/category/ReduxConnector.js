import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CategoriesContainer from './Container';
import * as categoryActions from './action';

function mapStateToProps(state) {
  return {
    categoriesPage: state.categoriesPage
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(categoryActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CategoriesContainer);
