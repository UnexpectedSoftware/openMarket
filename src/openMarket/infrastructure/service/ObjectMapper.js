/**
 * @interface
 */
export default class ObjectMapper {

  toDomain({ persistenceProduct }){
    throw new Error('ObjectMapper#mapper must be implemented');
  }

  toPersistence({ domainProduct }){
    throw new Error('ObjectMapper#mapper must be implemented');
  }


}
