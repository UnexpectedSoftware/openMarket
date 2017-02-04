import UUID from 'node-uuid';
import IdGenerator from '../domain/order/IdGenerator';

export default class UUIDGenerator extends IdGenerator {

  constructor() {
    super();
  }

  generate() {
    return UUID.v4();
  }

}
