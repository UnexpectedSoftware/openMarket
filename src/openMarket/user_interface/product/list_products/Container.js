import React, {Component} from 'react';
import {Link} from 'react-router';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import placeholder from '../../resources/category-placeholder.svg';
import {formatMoney} from '../../i18n/money';
import {catalogLimit, defaultCatalogSort, NAME_ASC, NAME_DESC, STOCK_ASC, STOCK_DESC} from './model';
import ProductStatus from '../../../domain/product/ProductStatus';

class Container extends Component {

  lowStockFrom(location) {
    const params = location && location.query;
    return !!(params && String(params.lowStock) === '1');
  }

  openCatalog(lowStock) {
    this.props.listProductsPageLoaded({
      query: '',
      lowStock,
      status: null,
      categoryId: null,
      sort: defaultCatalogSort,
      limit: catalogLimit
    });
  }

  componentWillMount() {
    this.openCatalog(this.lowStockFrom(this.props.location));
  }

  componentWillReceiveProps(nextProps) {
    const nextLowStock = this.lowStockFrom(nextProps.location);
    if (nextLowStock !== this.lowStockFrom(this.props.location)) {
      this.openCatalog(nextLowStock);
    }
  }

  componentDidMount() {
    this.onScroll = () => this.loadMoreIfVisible();
    window.addEventListener('scroll', this.onScroll);
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        this.loadMore();
      }
    }, {root: null, rootMargin: '200px'});
    this.watchSentinel();
    this.loadMoreIfVisible();
  }

  componentDidUpdate() {
    this.watchSentinel();
    this.loadMoreIfVisible();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setSentinel = (node) => {
    this.sentinel = node;
  };

  watchSentinel() {
    if (!this.observer) {
      return;
    }
    this.observer.disconnect();
    if (this.sentinel && this.props.products.hasMore) {
      this.observer.observe(this.sentinel);
    }
  }

  loadMore = () => {
    const {products, listProductsLoadMore} = this.props;
    if (!products.hasMore || products.loading || !products.nextCursor) {
      return;
    }
    listProductsLoadMore();
  };

  loadMoreIfVisible() {
    if (!this.sentinel) {
      return;
    }
    const rect = this.sentinel.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 200) {
      this.loadMore();
    }
  }

  handleQuery = (event) => {
    this.props.listProductsQueryChanged(event.target.value);
  };

  changeFilters(next) {
    const {products, listProductsFiltersChanged} = this.props;
    listProductsFiltersChanged({
      lowStock: products.lowStock,
      status: products.status,
      categoryId: products.categoryId,
      sort: products.sort,
      ...next
    });
  }

  toggleLowStock = () => {
    this.changeFilters({lowStock: !this.props.products.lowStock});
  };

  pickStatus = (status) => {
    this.changeFilters({status});
  };

  pickCategory = (categoryId) => {
    this.changeFilters({categoryId});
  };

  filtersActive() {
    const products = this.props.products || {};
    return !!(
      String(products.query || '').trim() ||
      products.lowStock ||
      products.status ||
      products.categoryId
    );
  }

  clearFilters = () => {
    if (this.lowStockFrom(this.props.location) && this.props.router) {
      this.props.router.push('/list_products');
      return;
    }
    this.openCatalog(false);
  };

  catalogStatus(cards) {
    const products = this.props.products;
    if (products.loading && cards.length === 0) {
      return <Spinner label="Loading products" />;
    }
    if (products.loading) {
      return <p className="catalog-note">Loading…</p>;
    }
    if (cards.length === 0) {
      if (this.filtersActive()) {
        return (
          <EmptyState
            icon="search"
            title="No products match these filters"
            action={<Button type="button" variant="secondary" onClick={this.clearFilters}>Quitar filtros</Button>}
          />
        );
      }
      return (
        <EmptyState
          icon="barcode"
          title="Aún no hay productos"
          message="Crea el primer producto para venderlo."
          action={<Link to="/create_product" className="om-button om-button--primary">Crear producto</Link>}
        />
      );
    }
    if (!products.hasMore) {
      return <p className="catalog-note">End of catalog</p>;
    }
    return null;
  }

  pickSort = (event) => {
    this.changeFilters({sort: event.target.value});
  };

  disableProduct(barcode) {
    this.props.listProductsDisable({barcode});
  }

  renderCard(product) {
    const {listProductsDetail} = this.props;
    const disabled = product.status === 'DISABLED';
    return (
      <article className="product-card" key={product.barcode}>
        <img src={product.imageSrc || placeholder} alt={product.name} />
        <div className="product-card-body">
          <div className="product-card-title">
            <h3 className="product-card-name">{product.name}</h3>
            {product.categoryName
              ? <span className="product-card-category">{product.categoryName}</span>
              : null}
          </div>
          <div className="product-card-facts">
            <div className="product-card-details">
              <p className="product-card-barcode">
                <i className="fa fa-barcode" aria-hidden="true" title="Barcode" />
                {product.barcode}
              </p>
              <p className="product-card-stock">
                <i className="fa fa-cubes" aria-hidden="true" title="Stock" />
                {product.stock}
              </p>
              <p className={disabled ? 'product-card-status is-disabled' : 'product-card-status is-enabled'}>
                {disabled ? 'Disabled' : 'Enabled'}
              </p>
            </div>
            <p className="product-card-price">{formatMoney(product.price)}</p>
          </div>
          <div className="product-card-actions">
            <button type="button" className="product-card-view" onClick={() => listProductsDetail(product.barcode)}>View</button>
            {!disabled &&
              <button type="button" className="product-card-disable" onClick={() => this.disableProduct(product.barcode)}>Disable</button>
            }
          </div>
        </div>
      </article>
    );
  }

  render() {
    const {products} = this.props;
    const cards = products.products;
    return (
      <div className="container-fluid">
        <div className="catalog-heading">
          <h2>List Products</h2>
          <div className="catalog-heading-actions">
            <Link to="/create_product" className="catalog-new-product">Nuevo producto</Link>
            <button
              type="button"
              className="catalog-print"
              aria-label="Print product list"
              onClick={() => this.props.listProductsPrint()}
            >
              <i className="fa fa-print" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="catalog-layout">
          <aside className="catalog-filters">
            <fieldset>
              <legend>Stock</legend>
              <label>
                <input type="checkbox" checked={products.lowStock} onChange={this.toggleLowStock} />
                Low stock
              </label>
            </fieldset>
            <fieldset>
              <legend>Status</legend>
              <label>
                <input
                  type="radio"
                  name="catalog-status"
                  checked={!products.status}
                  onChange={() => this.pickStatus(null)}
                />
                All
              </label>
              <label>
                <input
                  type="radio"
                  name="catalog-status"
                  checked={products.status === ProductStatus.ENABLED}
                  onChange={() => this.pickStatus(ProductStatus.ENABLED)}
                />
                Enabled
              </label>
              <label>
                <input
                  type="radio"
                  name="catalog-status"
                  checked={products.status === ProductStatus.DISABLED}
                  onChange={() => this.pickStatus(ProductStatus.DISABLED)}
                />
                Disabled
              </label>
            </fieldset>
            <fieldset>
              <legend>Category</legend>
              <label>
                <input
                  type="radio"
                  name="catalog-category"
                  checked={!products.categoryId}
                  onChange={() => this.pickCategory(null)}
                />
                All
              </label>
              {products.categories.map(category => (
                <label key={category.id}>
                  <input
                    type="radio"
                    name="catalog-category"
                    checked={products.categoryId === category.id}
                    onChange={() => this.pickCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </fieldset>
          </aside>
          <div className="catalog-main">
            <div className="catalog-toolbar">
              <div className="catalog-search">
                <i className="fa fa-search" />
                <input
                  type="text"
                  placeholder="Search products"
                  value={products.query}
                  onChange={this.handleQuery}
                />
              </div>
              <div className="catalog-sort">
                <label>
                  Sort by
                  <span className="catalog-sort-control">
                    <select value={products.sort || defaultCatalogSort} onChange={this.pickSort}>
                      <option value={NAME_ASC}>Name: A to Z</option>
                      <option value={NAME_DESC}>Name: Z to A</option>
                      <option value={STOCK_ASC}>Stock: Low to High</option>
                      <option value={STOCK_DESC}>Stock: High to Low</option>
                    </select>
                  </span>
                </label>
              </div>
            </div>
            <div className="product-cards">
              {cards.map(product => this.renderCard(product))}
            </div>
            {this.catalogStatus(cards)}
            <div className="catalog-sentinel" ref={this.setSentinel} />
          </div>
        </div>
      </div>
    );
  }
}

export default Container;
