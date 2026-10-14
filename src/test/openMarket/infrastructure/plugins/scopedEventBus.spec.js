import {expect} from 'chai';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import PluginSubscriberNameError from '../../../../openMarket/domain/plugin/PluginSubscriberNameError';
import scopedEventBus from '../../../../openMarket/infrastructure/plugins/scopedEventBus';

describe('scopedEventBus', () => {
  function fakeBus() {
    const names = [];
    return {
      names,
      subscribeSync() {
        return () => {};
      },
      subscribeDurable(name) {
        names.push(name);
        return () => names.splice(names.indexOf(name), 1);
      },
      ofType() {
        return {};
      }
    };
  }

  it('prefixes a durable name and keeps one that already has the plugin prefix', () => {
    const eventBus = fakeBus();
    const scoped = scopedEventBus({eventBus, pluginId: 'sample'});

    scoped.subscribeDurable('note', OrderCreated, () => {});
    scoped.subscribeDurable('sample:send', OrderCreated, () => {});

    expect(eventBus.names).to.deep.equal(['sample:note', 'sample:send']);
  });

  it('rejects a durable name that uses another prefix', () => {
    const scoped = scopedEventBus({eventBus: fakeBus(), pluginId: 'sample'});

    expect(() => scoped.subscribeDurable('other:send', OrderCreated, () => {}))
      .to.throw(PluginSubscriberNameError, 'Durable subscriber "other:send" must start with "sample:"');
  });
});
