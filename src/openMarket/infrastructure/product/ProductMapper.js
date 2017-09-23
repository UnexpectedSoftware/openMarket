/**
 * @interface
 */
export default class ProductMapper {

  toDomain({ persistenceProduct }){
    throw new Error('ProductMapper#mapper must be implemented');
  }

  toPersistence({ domainProduct }){
    throw new Error('ProductMapper#mapper must be implemented');
  }


}
