import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import newOrderContainer from './Container';
import * as newOrderActions from './action';

function mapStateToProps(state) {
  return {
    order: state.newOrder.order,
    readonly: state.newOrder.readonly
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(newOrderActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(newOrderContainer);
