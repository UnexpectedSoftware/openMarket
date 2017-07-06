import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ListOrderContainer from './Container';
import * as ListOrderActions from './action';

function mapStateToProps(state) {
  return {
    orders: state.listOrder.orders
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ListOrderActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ListOrderContainer);
