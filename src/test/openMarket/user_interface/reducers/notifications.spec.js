import {expect} from 'chai';
import notifications from '../../../../openMarket/user_interface/reducers/notifications';
import {toast} from '../../../../openMarket/user_interface/components/toast';

describe('Notification cap', () => {
  it('keeps the newest three and moves a repeated uid to the end', () => {
    let state = notifications(undefined, {type: '@@INIT'});
    state = notifications(state, toast.success('A', '1', {uid: 'a'}));
    state = notifications(state, toast.warning('B', '2', {uid: 'b'}));
    state = notifications(state, toast.error('C', '3', {uid: 'c'}));
    state = notifications(state, toast.success('D', '4', {uid: 'd'}));
    expect(state.map(item => item.uid)).to.deep.equal(['b', 'c', 'd']);
    expect(state[0].position).to.equal('bc');
    expect(state[0].autoDismiss).to.equal(2.5);
    expect(state[1].autoDismiss).to.equal(0);
    state = notifications(state, toast.warning('B again', '2', {uid: 'b'}));
    expect(state.map(item => item.uid)).to.deep.equal(['c', 'd', 'b']);
    expect(state[2].title).to.equal('B again');
  });
});
