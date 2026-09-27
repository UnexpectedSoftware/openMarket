import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/filter';

/**
 * Hot in-process bus. Listeners only receive events published after they subscribe.
 */
export default class DomainEventBus {

  constructor() {
    this._events = new Subject();
  }

  /**
   * @param {*} event
   */
  publish(event) {
    this._events.next(event);
  }

  /**
   * @returns {Observable}
   */
  events() {
    return this._events.asObservable();
  }

  /**
   * @param {Function} EventType
   * @returns {Observable}
   */
  ofType(EventType) {
    return this.events().filter(event => event instanceof EventType);
  }

}
