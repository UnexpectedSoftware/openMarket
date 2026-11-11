import 'rxjs/add/operator/do';
import CategoryCreated from '../../../domain/event/CategoryCreated';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */
/** @typedef {import('../../../domain/category/CategoryFactory').default} CategoryFactory */
/** @typedef {import('../../../domain/service/DomainEventBus').default} DomainEventBus */
/** @typedef {import('../../../domain/service/Transaction').default} Transaction */

/**
 * @class CreateCategory
 */
export default class CreateCategory {
  /**
   * @param {object} deps
   * @param {CategoryRepository} deps.repository
   * @param {CategoryFactory} deps.categoryFactory
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   */
  constructor({repository, categoryFactory, domainEventBus, transaction}) {
    /**
     * @type {CategoryRepository}
     * @private
     */
    this.repository = repository;
    /**
     * @type {CategoryFactory}
     * @private
     */
    this.categoryFactory = categoryFactory;
    /**
     * @type {DomainEventBus}
     * @private
     */
    this._domainEventBus = domainEventBus;
    /**
     * @type {Transaction}
     * @private
     */
    this._transaction = transaction;
  }

  /**
   * @param {object} category
   * @param {string} category.name
   * @param {string | null} [category.imagePath] absolute path of a file to copy, when the user picked one
   * @returns {Observable<null>}
   */
  createCategory({name, imagePath}) {
    const category = this.categoryFactory.createWith({name});
    return this._transaction.run(() => this.repository.save({category, imagePath}).do(() => {
      this._domainEventBus.save(new CategoryCreated({id: category.id, name: category.name}));
    })).do(
      () => this._domainEventBus.raise(),
      () => this._domainEventBus.discard()
    );
  }
}
