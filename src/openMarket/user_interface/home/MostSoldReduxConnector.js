import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import MostSoldContainer from './MostSoldContainer';
import {mostSoldRequested} from './action';

function mapStateToProps(state) {
  return {
    mostSold: state.statistics.mostSold
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({mostSoldRequested}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MostSoldContainer);
