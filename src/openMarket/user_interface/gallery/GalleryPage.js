import React, {Component} from 'react';
import Badge, {StatusPill} from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Dialog from '../components/Dialog';
import EmptyState from '../components/EmptyState';
import IconButton from '../components/IconButton';
import NumberField from '../components/NumberField';
import {PageHeader, Toolbar} from '../components/PageHeader';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import Spinner from '../components/Spinner';
import TextField from '../components/TextField';

const ROWS = [
  {id: '1', name: 'Milk', stock: 12, price: '1,20 €'},
  {id: '2', name: 'Bread', stock: 4, price: '0,90 €'}
];

const COLUMNS = [
  {key: 'name', header: 'Name', sortable: true},
  {key: 'stock', header: 'Stock', align: 'end', sortable: true},
  {key: 'price', header: 'Price', align: 'end'}
];

/**
 * Dev-only catalogue of the shared components. Not linked from the rail.
 */
export default class GalleryPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      name: 'Leche',
      weight: 0.35,
      status: 'ENABLED',
      sort: {key: 'name', dir: 'asc'}
    };
    this.openDialog = this.openDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  openDialog() {
    this.setState({open: true});
  }

  closeDialog() {
    this.setState({open: false});
  }

  onSort(sort) {
    this.setState({sort});
  }

  render() {
    const rows = ROWS.slice().sort((left, right) => {
      const dir = this.state.sort.dir === 'asc' ? 1 : -1;
      if (left[this.state.sort.key] < right[this.state.sort.key]) {
        return -1 * dir;
      }
      if (left[this.state.sort.key] > right[this.state.sort.key]) {
        return 1 * dir;
      }
      return 0;
    });
    return (
      <div className="container-fluid om-gallery">
        <PageHeader
          title="Component gallery"
          subtitle="Shared controls, every variant. Not shown in production."
        />

        <section className="om-gallery-section">
          <h2>Buttons</h2>
          <div className="om-gallery-row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" busy>Busy</Button>
            <Button variant="secondary" icon="print">With icon</Button>
            <IconButton icon="times" label="Close sample" />
          </div>
        </section>

        <section className="om-gallery-section">
          <h2>Fields</h2>
          <TextField id="gallery-name" label="Name" value={this.state.name} onChange={event => this.setState({name: event.target.value})} />
          <TextField id="gallery-error" label="Barcode" value="" error="Required" onChange={() => {}} />
          <TextField id="gallery-hint" label="Description" hint="Optional note on the ticket" value="" multiline onChange={() => {}} />
          <NumberField
            id="gallery-weight"
            label="Weight"
            unit="kg"
            value={this.state.weight}
            onChange={value => this.setState({weight: value})}
          />
          <Select
            id="gallery-status"
            label="Status"
            value={this.state.status}
            onChange={event => this.setState({status: event.target.value})}
            options={[
              {value: 'ENABLED', label: 'Activo'},
              {value: 'DISABLED', label: 'Desactivado'}
            ]}
          />
        </section>

        <section className="om-gallery-section">
          <h2>Status</h2>
          <div className="om-gallery-row">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="primary">Primary</Badge>
            <StatusPill tone="success">Activo</StatusPill>
            <StatusPill tone="warning">Low stock</StatusPill>
            <StatusPill tone="danger">Desactivado</StatusPill>
            <Spinner label="Loading sample" />
            <Skeleton lines={2} width="40%" />
          </div>
        </section>

        <section className="om-gallery-section">
          <h2>Card and toolbar</h2>
          <Toolbar align="between">
            <span>Filters</span>
            <Button variant="secondary" type="button">Quitar filtros</Button>
          </Toolbar>
          <Card title="Milk" actions={<Button variant="ghost" type="button">View</Button>}>
            A surface for a fact or a short form.
          </Card>
        </section>

        <section className="om-gallery-section">
          <h2>Table</h2>
          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey="id"
            sort={this.state.sort}
            onSort={this.onSort}
          />
          <DataTable columns={COLUMNS} rows={[]} rowKey="id" empty={<EmptyState icon="search" title="No rows" />} />
          <DataTable columns={COLUMNS} rows={[]} rowKey="id" loading />
        </section>

        <section className="om-gallery-section">
          <h2>Empty</h2>
          <EmptyState
            icon="barcode"
            title="Aún no hay productos"
            message="Crea el primer producto para venderlo."
            action={<Button type="button">Crear producto</Button>}
          />
        </section>

        <section className="om-gallery-section">
          <h2>Dialog</h2>
          <Button type="button" onClick={this.openDialog}>Open dialog</Button>
          <Dialog
            open={this.state.open}
            title="Example dialog"
            onClose={this.closeDialog}
            actions={(
              <span className="om-gallery-row">
                <Button type="button" variant="secondary" onClick={this.closeDialog}>Cancel</Button>
                <Button type="button" onClick={this.closeDialog}>Confirm</Button>
              </span>
            )}
          >
            <p>Tab stays inside this dialog. Escape closes it.</p>
          </Dialog>
        </section>
      </div>
    );
  }
}
