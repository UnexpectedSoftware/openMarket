import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import newOrderContainer from './Container';
import * as newOrderActions from './action';
import {shopProfileRequested} from '../../settings/action';
import {showWeightedDialog} from '../weighted_dialog/action';

function mapStateToProps(state) {
  return {
    order: state.newOrder.order,
    readonly: state.newOrder.readonly,
    issuer: state.settings.issuer,
    tiles: state.newOrder.tiles,
    tilesStatus: state.newOrder.tilesStatus,
    lowStockBarcodes: state.newOrder.lowStockBarcodes,
    lastOrder: state.newOrder.lastOrder,
    saving: state.newOrder.saving,
    previewHtml: state.newOrder.previewHtml,
    reprintHtml: state.newOrder.reprintHtml
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({...newOrderActions, shopProfileRequested, showWeightedDialog}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(newOrderContainer);
