import {expect} from 'chai';
import Category from '../../../../openMarket/domain/category/Category';
import CategorySummary from '../../../../openMarket/domain/category/CategorySummary';
import CategoryView from '../../../../openMarket/domain/category/CategoryView';
import SqliteCategoryQueryService from '../../../../openMarket/infrastructure/category/SqliteCategoryQueryService';

const ROW = {
  id: '1',
  name: 'Dairy',
  product_count: 1,
  stock_total: 4,
  most_sold_name: null
};

describe('SqliteCategoryQueryService', () => {
  const service = new SqliteCategoryQueryService();

  it('maps stored cents and leaves a missing most-sold name empty', () => {
    const view = service.viewFrom({
      ...ROW,
      base_price_cents: 150,
      base_price: 9.99
    });
    expect(view).to.be.instanceof(CategoryView);
    expect(view).to.not.be.instanceof(Category);
    expect(view.basePriceCents).to.equal(150);
    expect(view.mostSold).to.equal(null);
    expect(view.imageUrl).to.equal(null);
    expect(view.productCount).to.equal(1);
    expect(view.stockTotal).to.equal(4);
    expect(view.imageName).to.equal(undefined);
  });

  it('maps a legacy euro price when cents are missing', () => {
    const view = service.viewFrom({
      ...ROW,
      base_price_cents: null,
      base_price: 1.5,
      most_sold_barcode: '1001',
      most_sold_name: 'Milk',
      most_sold_quantity: 3
    }, 'data:image/png;base64,aa');
    expect(view.basePriceCents).to.equal(150);
    expect(view.mostSold).to.deep.equal({barcode: '1001', name: 'Milk', quantity: 3});
    expect(view.imageUrl).to.equal('data:image/png;base64,aa');
    expect(view).to.not.be.instanceof(Category);
  });

  it('keeps zero cents and treats a blank price as zero', () => {
    const zero = service.viewFrom({...ROW, base_price_cents: 0, base_price: 1.5});
    expect(zero.basePriceCents).to.equal(0);
    const blank = service.viewFrom({...ROW, base_price_cents: null, base_price: null});
    expect(blank.basePriceCents).to.equal(0);
    expect(blank.mostSold).to.equal(null);
  });

  it('keeps the euro summary and its most sold product', () => {
    const summary = service.summaryFrom({
      id: '1',
      name: 'Odin',
      image_name: 'a.png',
      product_count: 3,
      stock_total: 2.5,
      base_price_total: 4,
      most_sold_barcode: '1002',
      most_sold_name: 'Pear',
      most_sold_quantity: 4
    });
    expect(summary).to.be.instanceof(CategorySummary);
    expect(summary.basePriceTotal).to.equal(4);
    expect(summary.imageName).to.equal('a.png');
    expect(summary.productCount).to.equal(3);
    expect(summary.stockTotal).to.equal(2.5);
    expect(summary.mostSold).to.deep.equal({barcode: '1002', name: 'Pear', quantity: 4});
    const empty = service.summaryFrom({
      id: '3',
      name: 'Heimdall',
      image_name: null,
      product_count: 0,
      stock_total: 0,
      base_price_total: 0,
      most_sold_name: null
    });
    expect(empty.mostSold).to.equal(null);
    expect(empty.imageName).to.equal(null);
    expect(empty.basePriceTotal).to.equal(0);
  });

  it('sums cents in the view statement and euros in the summary statement', () => {
    const summaries = service.summariesSql();
    const views = service.viewPage({}).sql;
    expect(summaries).to.contain('/ 100.0 AS base_price_total');
    expect(views).to.contain('AS base_price_cents');
    expect(views).to.not.contain('/ 100.0');
    expect(views).to.contain('quantity DESC, amount DESC, name ASC');
    expect(summaries).to.contain('quantity DESC, amount DESC, name ASC');
    expect(views).to.contain('ORDER BY c.name COLLATE NOCASE ASC');
    expect(views).to.not.contain('LIMIT');
  });

  it('filters by name and pages only when limit is a number', () => {
    const filtered = service.viewPage({text: 'Alp', limit: 1, offset: 2, sort: 'stock_desc'});
    expect(filtered.countSql).to.equal('SELECT COUNT(*) AS total FROM category c WHERE c.name LIKE ?');
    expect(filtered.countParams).to.deep.equal(['%Alp%']);
    expect(filtered.params).to.deep.equal(['%Alp%', 1, 2]);
    expect(filtered.sql).to.contain('WHERE c.name LIKE ?');
    expect(filtered.sql).to.contain('ORDER BY c.name COLLATE NOCASE ASC LIMIT ? OFFSET ?');
    expect(filtered.sql).to.not.contain('stock_desc');

    const all = service.viewPage({});
    expect(all.countSql).to.equal('SELECT COUNT(*) AS total FROM category c');
    expect(all.countParams).to.deep.equal([]);
    expect(all.params).to.deep.equal([]);
    expect(all.sql).to.not.contain('WHERE c.name');
    expect(all.sql).to.not.contain('LIMIT');

    expect(service.viewPage({text: ''}).params).to.deep.equal([]);
    expect(service.viewPage({text: null}).sql).to.not.contain('WHERE c.name');
    expect(service.viewPage({limit: 5, offset: 0}).params).to.deep.equal([5, 0]);
    expect(service.viewPage({limit: 0, offset: 3}).params).to.deep.equal([0, 3]);
    expect(service.viewPage({limit: undefined, offset: 4}).sql).to.not.contain('LIMIT');
    expect(service.viewPage().params).to.deep.equal([]);
    expect(service.viewPage().sql).to.contain('ORDER BY c.name COLLATE NOCASE ASC');
  });
});
