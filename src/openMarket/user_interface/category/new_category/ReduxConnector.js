import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import NewCategoryContainer from './Container';
import * as NewCategoryActions from './action';

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NewCategoryActions, dispatch);
}

export default connect(null, mapDispatchToProps)(NewCategoryContainer);
