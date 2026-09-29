// @flow
import React, {Component} from 'react';
import placeholder from '../../resources/category-placeholder.svg';
import {catalogLimit} from './model';

class Container extends Component {

  lowStockFrom(location) {
    const params = location && location.query;
    return !!(params && String(params.lowStock) === '1');
  }

  openCatalog(lowStock) {
    this.props.listProductsPageLoaded({
      query: '',
      lowStock,
      enabledOnly: false,
      categoryId: null,
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
      enabledOnly: products.enabledOnly,
      categoryId: products.categoryId,
      ...next
    });
  }

  toggleLowStock = () => {
    this.changeFilters({lowStock: !this.props.products.lowStock});
  };

  toggleEnabled = () => {
    this.changeFilters({enabledOnly: !this.props.products.enabledOnly});
  };

  pickCategory = (categoryId) => {
    this.changeFilters({categoryId});
  };

  disableProduct(barcode) {
    this.props.listProductsDisable({barcode});
  }

  renderCard(product) {
    const {listProductsDetail} = this.props;
    const disabled = product.status === 'DISABLED';
    const price = Number(product.price);
    return (
      <article className="product-card" key={product.barcode}>
        <img src={product.imageSrc || placeholder} alt={product.name} />
        <div className="product-card-body">
          <h3 className="product-card-name">{product.name}</h3>
          <p className="product-card-barcode">{product.barcode}</p>
          <p className="product-card-price">{Number.isFinite(price) ? price.toFixed(2) : ''}</p>
          <p className="product-card-meta">Stock {product.stock}</p>
          <p className="product-card-meta">{product.categoryName}</p>
          <p className={disabled ? 'product-card-status is-disabled' : 'product-card-status is-enabled'}>
            {disabled ? 'Disabled' : 'Enabled'}
          </p>
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
        <h2>List Products</h2>
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
                <input type="checkbox" checked={products.enabledOnly} onChange={this.toggleEnabled} />
                Enabled
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
            <div className="catalog-search">
              <i className="fa fa-search" />
              <input
                type="text"
                placeholder="Search products"
                value={products.query}
                onChange={this.handleQuery}
              />
            </div>
            <div className="product-cards">
              {cards.map(product => this.renderCard(product))}
            </div>
            {products.loading && <p className="catalog-note">Loading…</p>}
            {!products.loading && cards.length === 0 &&
              <p className="catalog-note">No products match these filters</p>
            }
            {!products.loading && !products.hasMore && cards.length > 0 &&
              <p className="catalog-note">End of catalog</p>
            }
            <div className="catalog-sentinel" ref={this.setSentinel} />
          </div>
        </div>
      </div>
    );
  }
}

export default Container;
