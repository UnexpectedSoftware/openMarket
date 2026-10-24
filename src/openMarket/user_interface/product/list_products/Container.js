import React, {Component} from 'react';
import {Link} from 'react-router';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import IconButton from '../../components/IconButton';
import {PageHeader} from '../../components/PageHeader';
import placeholder from '../../resources/category-placeholder.svg';
import {defaultCatalogSort, filtersActive, PAGE_SIZE} from './model';
import ProductFilters from './ProductFilters';
import ProductTable from './ProductTable';

class Container extends Component {

  lowStockFrom(location) {
    const params = location && location.query;
    return !!(params && String(params.lowStock) === '1');
  }

  openCatalog(lowStock) {
    this.props.productsPageOpened({
      query: '',
      lowStock,
      status: null,
      categoryId: null,
      weighted: null,
      sort: defaultCatalogSort,
      limit: PAGE_SIZE
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

  onQuery = (event) => {
    this.props.productsQueryChanged(event.target.value);
  };

  changeFilters(next) {
    const products = this.props.products;
    this.props.productsFiltersChanged({
      lowStock: products.lowStock,
      status: products.status,
      categoryId: products.categoryId,
      weighted: products.weighted,
      sort: products.sort,
      ...next
    });
  }

  onCategory = (event) => {
    this.changeFilters({categoryId: event.target.value || null});
  };

  onStatus = (status) => {
    this.changeFilters({status});
  };

  onWeighted = () => {
    this.changeFilters({weighted: this.props.products.weighted ? null : true});
  };

  onLowStock = () => {
    this.changeFilters({lowStock: !this.props.products.lowStock});
  };

  onSort = (event) => {
    this.changeFilters({sort: event.target.value});
  };

  onPage = (offset) => {
    this.props.productsPageChanged({offset: Math.max(0, offset)});
  };

  onRetry = () => {
    this.props.productsPageChanged({offset: this.props.products.offset});
  };

  onEdit = (row) => {
    this.props.listProductsDetail({barcode: row.barcode, imageUrl: row.imageUrl});
  };

  onDisable = (barcode) => {
    this.props.listProductsDisable({barcode});
  };

  clearFilters = () => {
    if (this.lowStockFrom(this.props.location) && this.props.router) {
      this.props.router.push('/list_products');
      return;
    }
    this.openCatalog(false);
  };

  withImages(items) {
    return (items || []).map(item => ({
      ...item,
      imageSrc: item.imageUrl || placeholder
    }));
  }

  emptyCatalog() {
    if (filtersActive(this.props.products)) {
      return (
        <EmptyState
          icon="search"
          title="Ningún producto coincide con estos filtros"
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

  render() {
    const products = this.props.products;
    return (
      <div className="container-fluid products-screen">
        <PageHeader
          title="Productos"
          actions={
            <span className="products-heading-actions">
              <Link to="/create_product" className="om-button om-button--primary">Nuevo producto</Link>
              <IconButton icon="print" label="Print product list" onClick={() => this.props.listProductsPrint()} />
            </span>
          }
        />
        <ProductFilters
          query={products.query}
          categoryId={products.categoryId}
          categories={products.categories}
          status={products.status}
          weighted={products.weighted}
          lowStock={products.lowStock}
          sort={products.sort}
          onQuery={this.onQuery}
          onCategory={this.onCategory}
          onStatus={this.onStatus}
          onWeighted={this.onWeighted}
          onLowStock={this.onLowStock}
          onSort={this.onSort}
        />
        <ProductTable
          items={this.withImages(products.items)}
          total={products.total}
          offset={products.offset}
          limit={products.limit}
          loading={products.loading}
          error={products.error}
          empty={this.emptyCatalog()}
          onEdit={this.onEdit}
          onDisable={this.onDisable}
          onPage={this.onPage}
          onRetry={this.onRetry}
        />
      </div>
    );
  }
}

export default Container;
