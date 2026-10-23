import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ListOrderContainer from './Container';
import {OrderDetailRoute} from './OrderDetail';
import * as ListOrderActions from './action';

function mapStateToProps(state) {
  return {
    orders: state.listOrder
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ListOrderActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ListOrderContainer);

export const OrderDetailRouteConnected = connect(mapStateToProps, mapDispatchToProps)(OrderDetailRoute);
