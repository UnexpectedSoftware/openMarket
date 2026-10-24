import React, {Component} from 'react';
import {Link} from 'react-router';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import EmptyState from '../../components/EmptyState';
import IconButton from '../../components/IconButton';
import {PageHeader} from '../../components/PageHeader';
import placeholder from '../../resources/category-placeholder.svg';
import {wantsSearch} from './keys';
import {
  catalogRequest,
  catalogRoute,
  categoryParam,
  filtersActive,
  locationWithoutCategory,
  lowStockParam,
  syncedCategory
} from './model';
import ProductDrawer from './ProductDrawer';
import ProductFilters from './ProductFilters';
import ProductTable from './ProductTable';
import {routeChanged, routePlan} from './route';

class Container extends Component {

  constructor(props) {
    super(props);
    this.nameRef = {current: null};
    this.imageField = null;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.setImageField = this.setImageField.bind(this);
  }

  openCatalog(location, products) {
    this.props.productsPageOpened(catalogRequest(location, products || this.props.products));
  }

  syncRoute(props, previous) {
    const plan = routePlan(props, previous);
    if (plan.loadCatalog) {
      this.openCatalog(props.location, props.products);
    }
    if (plan.openCreate) {
      this.nameRef.current = null;
      this.props.productsDrawerOpened({mode: 'create'});
    } else if (plan.closeCreate) {
      this.props.productsDrawerClosed();
    }
  }

  componentWillMount() {
    this.syncRoute(this.props, null);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillReceiveProps(nextProps) {
    if (routeChanged(this.props, nextProps)) {
      this.syncRoute(nextProps, this.props);
    }
    if (lowStockParam(nextProps.location) === lowStockParam(this.props.location)) {
      this.applySyncedCategory(nextProps);
    }
  }

  applySyncedCategory(nextProps) {
    const categoryId = syncedCategory(this.props, nextProps);
    if (categoryId === undefined) {
      return;
    }
    this.changeFiltersOn(nextProps.products, {categoryId});
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event) {
    if (!wantsSearch(event, this.props.products.drawerOpen)) {
      return;
    }
    event.preventDefault();
    const search = document.getElementById('products-search');
    if (search && search.focus) {
      search.focus();
    }
  }

  setImageField(node) {
    this.imageField = node;
  }

  onQuery = (event) => {
    this.props.productsQueryChanged(event.target.value);
  };

  changeFilters(next) {
    this.changeFiltersOn(this.props.products, next);
  }

  changeFiltersOn(products, next) {
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
    const categoryId = event.target.value || null;
    this.changeFilters({categoryId});
    this.pushCatalog(catalogRoute({
      lowStock: lowStockParam(this.props.location),
      categoryId
    }));
  };

  pushCatalog(query) {
    if (!this.props.router) {
      return;
    }
    this.props.router.push({pathname: '/list_products', query});
  }

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
    this.nameRef.current = null;
    this.props.productsDrawerOpened({mode: 'edit', barcode: row.barcode});
  };

  onField = (field, value) => {
    this.props.productsDraftChanged({field, value});
  };

  onSave = () => {
    const chosen = this.imageField ? this.imageField.readChosenPath() : {imagePath: null};
    if (chosen.error) {
      this.props.productsSaveFailed({message: chosen.error});
      return;
    }
    this.props.productsSave({imagePath: chosen.imagePath || null});
  };

  onClose = () => {
    if (this.props.products.confirmArchive) {
      return;
    }
    this.props.productsDrawerClosed();
  };

  onArchive = () => {
    this.props.productsArchivePrompted();
  };

  onArchiveDismiss = () => {
    this.props.productsArchiveDismissed();
  };

  onArchiveConfirm = () => {
    const draft = this.props.products.draft || {};
    this.props.productsArchive({barcode: draft.barcode});
  };

  onFindImage = () => {
    this.props.productsImageRequested();
  };

  clearFilters = () => {
    if (categoryParam(this.props.location)) {
      this.dropCategory();
      return;
    }
    if (lowStockParam(this.props.location) && this.props.router) {
      this.props.router.push('/list_products');
      return;
    }
    this.openCatalog({query: {}});
  };

  dropCategory() {
    const location = locationWithoutCategory(this.props.location);
    this.openCatalog(location);
    this.pushCatalog(location.query);
  }

  withImages(items) {
    return (items || []).map(item => ({
      ...item,
      imageSrc: item.imageUrl || placeholder
    }));
  }

  emptyCatalog() {
    const buttonClass = this.actionClass();
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
        action={<Link to="/create_product" className={buttonClass}>Crear producto</Link>}
      />
    );
  }

  actionClass() {
    if (this.props.products.drawerOpen) {
      return 'om-button om-button--secondary';
    }
    return 'om-button om-button--primary';
  }

  render() {
    const products = this.props.products;
    return (
      <div className="container-fluid products-screen">
        <PageHeader
          title="Productos"
          actions={
            <span className="products-heading-actions">
              <Link to="/create_product" className={this.actionClass()}>Nuevo producto</Link>
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
          onPage={this.onPage}
          onRetry={this.onRetry}
        />
        <ProductDrawer
          open={products.drawerOpen}
          mode={products.mode}
          draft={products.draft}
          errors={products.errors}
          formError={products.formError}
          saving={products.saving}
          loadingDraft={products.loadingDraft}
          imageLookupBusy={products.imageLookupBusy}
          categories={products.categories}
          nameRef={this.nameRef}
          imageRef={this.setImageField}
          onField={this.onField}
          onClose={this.onClose}
          onSave={this.onSave}
          onArchive={this.onArchive}
          onFindImage={this.onFindImage}
        />
        <Dialog
          open={products.confirmArchive}
          title="Desactivar producto"
          onClose={this.onArchiveDismiss}
          role="alertdialog"
          actions={
            <span className="products-drawer-actions">
              <Button variant="secondary" onClick={this.onArchiveDismiss}>Cancelar</Button>
              <Button variant="danger" onClick={this.onArchiveConfirm}>Desactivar</Button>
            </span>
          }
        >
          <p>Pasa a Inactivo y deja de salir en la venta. Los tickets antiguos lo conservan.</p>
        </Dialog>
      </div>
    );
  }
}

export default Container;
