import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import newOrderContainer from './Container';
import * as newOrderActions from './action';
import {shopProfileRequested} from '../../settings/action';

function mapStateToProps(state) {
  return {
    order: state.newOrder.order,
    readonly: state.newOrder.readonly,
    issuer: state.settings.issuer
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({...newOrderActions, shopProfileRequested}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(newOrderContainer);
