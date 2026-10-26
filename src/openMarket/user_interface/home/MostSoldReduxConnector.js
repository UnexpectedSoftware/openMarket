import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import MostSoldContainer from './MostSoldContainer';
import {mostSoldRequested} from './action';
import {listProductsDetail} from '../product/list_products/action';

function mapStateToProps(state) {
  return {
    mostSold: state.statistics.mostSold,
    lowStockCount: state.lowStock ? state.lowStock.count : null
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({mostSoldRequested, listProductsDetail}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MostSoldContainer);
