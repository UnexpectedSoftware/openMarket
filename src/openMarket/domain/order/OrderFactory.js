/**
 * @interface
 * */
export default class OrderFactory {

  createWith({lines}) {
    throw new Error('OrderFactory#order must be implemented');
  }

}
