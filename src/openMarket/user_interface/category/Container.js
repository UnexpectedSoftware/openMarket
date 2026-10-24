import React, {Component} from 'react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import {PageHeader, Toolbar} from '../components/PageHeader';
import TextField from '../components/TextField';
import CategoryDeleteDialog from './CategoryDeleteDialog';
import CategoryDialog from './CategoryDialog';
import CategoryGrid, {CategorySkeletons} from './CategoryGrid';

class Container extends Component {

  componentWillMount() {
    this.props.categoriesPageLoaded();
  }

  componentDidMount() {
    this.blockFileNavigation = event => {
      const types = event.dataTransfer && event.dataTransfer.types;
      if (types && Array.prototype.indexOf.call(types, 'Files') !== -1) {
        event.preventDefault();
      }
    };
    window.addEventListener('dragover', this.blockFileNavigation);
    window.addEventListener('drop', this.blockFileNavigation);
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.blockFileNavigation);
    window.removeEventListener('drop', this.blockFileNavigation);
  }

  onQuery = event => {
    this.props.categoriesQueryChanged(event.target.value);
  };

  openCreate = () => {
    this.props.categoriesDialogOpened({mode: 'create'});
  };

  openEdit = category => {
    this.props.categoriesDialogOpened({mode: 'edit', id: category.id});
  };

  clearSearch = () => {
    this.props.categoriesQueryChanged('');
  };

  askDelete = category => {
    this.props.categoriesDeleteConfirmOpened(category.id);
  };

  render() {
    const page = this.props.categoriesPage;
    return (
      <div className="container-fluid categories-screen">
        {this.header(page)}
        {this.toolbar(page)}
        {this.body(page)}
        {this.overlay(page)}
      </div>
    );
  }

  header(page) {
    return (
      <PageHeader
        title="Categorías"
        actions={
          <Button variant={this.headerVariant(page)} onClick={this.openCreate}>
            Nueva categoría
          </Button>
        }
      />
    );
  }

  headerVariant(page) {
    if (page.dialog || page.confirmDelete) {
      return 'secondary';
    }
    return 'primary';
  }

  overlay(page) {
    if (page.confirmDelete) {
      return (
        <CategoryDeleteDialog
          confirm={page.confirmDelete}
          onClose={this.props.categoriesDeleteConfirmClosed}
          onConfirm={() => this.props.categoriesDelete(page.confirmDelete.id)}
        />
      );
    }
    if (page.dialog) {
      return this.editor(page.dialog);
    }
    return null;
  }

  toolbar(page) {
    return (
      <Toolbar>
        <div className="categories-search">
          <TextField
            id="categories-search"
            label="Buscar por nombre"
            value={page.text}
            onChange={this.onQuery}
          />
        </div>
      </Toolbar>
    );
  }

  body(page) {
    if (page.error) {
      return <CategoryFailure message={page.error} onRetry={this.props.categoriesPageLoaded} />;
    }
    if (page.loading && page.items.length === 0) {
      return <CategorySkeletons />;
    }
    return (
      <CategoryGrid
        items={page.items}
        empty={this.emptyState(page)}
        onEdit={this.openEdit}
        onDelete={this.askDelete}
        onOpenProduct={this.props.listProductsDetail}
      />
    );
  }

  emptyState(page) {
    if (String(page.text || '').trim()) {
      return (
        <EmptyState
          icon="search"
          title="Ninguna categoría coincide con la búsqueda"
          action={<Button variant="secondary" onClick={this.clearSearch}>Quitar búsqueda</Button>}
        />
      );
    }
    return (
      <EmptyState
        icon="tags"
        title="Aún no hay categorías"
        message="Crea la primera categoría para agrupar los productos."
        action={<Button onClick={this.openCreate}>Nueva categoría</Button>}
      />
    );
  }

  editor(dialog) {
    return (
      <CategoryDialog
        dialog={dialog}
        onClose={this.props.categoriesDialogClosed}
        onDraft={this.props.categoriesDraftChanged}
        onSave={this.props.categoriesSave}
      />
    );
  }
}

/**
 * @param {{message: string, onRetry: Function}} props
 */
function CategoryFailure(props) {
  return (
    <div className="categories-error">
      <p role="alert">{props.message}</p>
      <Button variant="secondary" onClick={props.onRetry}>Reintentar</Button>
    </div>
  );
}

export default Container;
