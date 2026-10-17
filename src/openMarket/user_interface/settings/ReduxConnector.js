import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Container from './Container';
import * as settingsActions from './action';
import * as appearanceActions from '../appearance/action';

function mapStateToProps(state) {
  return {
    settings: state.settings,
    appearance: state.appearance
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({...settingsActions, ...appearanceActions}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Container);
