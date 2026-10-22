import React, {Component} from 'react';
import {PageHeader} from '../../components/PageHeader';
import {PAGE_SIZE} from './model';
import {customRange, customRangeMessage, rangeFor} from './ranges';
import {orderListKey} from './keys';
import OrderList from './OrderList';
import OrderSummary from './OrderSummary';
import {OrdersRanges, RangeDialog} from './OrdersRanges';

class Container extends Component {

  constructor(props) {
    super(props);
    this.fromRef = {current: null};
    this.onKeyDown = this.onKeyDown.bind(this);
    this.selectChip = this.selectChip.bind(this);
    this.openCustom = this.openCustom.bind(this);
    this.closeCustom = this.closeCustom.bind(this);
    this.onCustomFrom = this.onCustomFrom.bind(this);
    this.onCustomTo = this.onCustomTo.bind(this);
    this.applyCustom = this.applyCustom.bind(this);
    this.openOrder = this.openOrder.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.retry = this.retry.bind(this);
    this.setFromNode = this.setFromNode.bind(this);
  }

  componentWillMount() {
    const range = rangeFor('today');
    this.props.ordersRangeSelected({
      key: 'today',
      from: range.from,
      to: range.to,
      offset: 0,
      limit: PAGE_SIZE,
      append: false
    });
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  setFromNode(node) {
    this.fromRef.current = node;
  }

  selectChip(key) {
    const range = rangeFor(key);
    this.props.ordersRangeSelected({
      key,
      from: range.from,
      to: range.to,
      offset: 0,
      limit: this.props.orders.limit,
      append: false
    });
  }

  openCustom() {
    this.props.ordersCustomOpened();
  }

  closeCustom() {
    this.props.ordersCustomClosed();
  }

  onCustomFrom(event) {
    this.props.ordersCustomDraftChanged({field: 'from', value: event.target.value});
  }

  onCustomTo(event) {
    this.props.ordersCustomDraftChanged({field: 'to', value: event.target.value});
  }

  applyCustom() {
    const orders = this.props.orders;
    const message = customRangeMessage(orders.customFrom, orders.customTo);
    if (message) {
      this.props.ordersCustomRejected(message);
      return;
    }
    const range = customRange(orders.customFrom, orders.customTo);
    this.props.ordersRangeSelected({
      key: 'custom',
      from: range.from,
      to: range.to,
      offset: 0,
      limit: orders.limit,
      append: false
    });
  }

  openOrder(orderId) {
    this.props.ordersRowSelected(orderId);
    this.props.listOrderDetail(orderId);
  }

  loadMore() {
    const orders = this.props.orders;
    this.props.ordersRangeSelected({
      key: orders.rangeKey,
      from: orders.from,
      to: orders.to,
      offset: orders.items.length,
      limit: orders.limit,
      append: true
    });
  }

  retry() {
    const orders = this.props.orders;
    this.props.ordersRangeSelected({
      key: orders.rangeKey,
      from: orders.from,
      to: orders.to,
      offset: 0,
      limit: orders.limit,
      append: false
    });
  }

  onKeyDown(event) {
    const orders = this.props.orders;
    const command = orderListKey(event, orders);
    if (!command) {
      return;
    }
    event.preventDefault();
    if (command.type === 'move') {
      this.props.ordersSelectionMoved(command.delta);
    }
    if (command.type === 'open') {
      this.props.listOrderDetail(command.orderId);
    }
  }

  render() {
    const orders = this.props.orders;
    return (
      <div className="orders">
        <PageHeader title="Pedidos" />
        <OrdersRanges
          rangeKey={orders.rangeKey}
          onSelect={this.selectChip}
          onCustom={this.openCustom}
        />
        <OrderSummary summary={orders.summary} />
        <OrderList
          items={orders.items}
          total={orders.total}
          loading={orders.loading}
          loadingMore={orders.loadingMore}
          error={orders.error}
          selectedOrderId={orders.selectedOrderId}
          onOpen={this.openOrder}
          onLoadMore={this.loadMore}
          onRetry={this.retry}
        />
        <RangeDialog
          open={orders.customOpen}
          from={orders.customFrom}
          to={orders.customTo}
          error={orders.customError}
          onFrom={this.onCustomFrom}
          onTo={this.onCustomTo}
          onClose={this.closeCustom}
          onApply={this.applyCustom}
          fromRef={this.fromRef}
          onFromRef={this.setFromNode}
        />
      </div>
    );
  }
}

export default Container;
