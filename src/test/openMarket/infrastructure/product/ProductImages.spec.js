import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteProductRepository from '../../../../openMarket/infrastructure/product/SqliteProductRepository';
import SqlProductMapper from '../../../../openMarket/infrastructure/product/SqlProductMapper';
import ProductFactoryImpl from '../../../../openMarket/infrastructure/product/ProductFactoryImpl';
import CategoryFactoryImpl from '../../../../openMarket/infrastructure/category/CategoryFactoryImpl';
import ImageStore, {IMAGE_MAX_BYTES} from '../../../../openMarket/infrastructure/service/ImageStore';
import UUIDIdentity from '../../../../openMarket/infrastructure/service/UUIDIdentity';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const identity = new UUIDIdentity();
const categoryFactory = new CategoryFactoryImpl({identity});
const productFactory = new ProductFactoryImpl({identity});
const category = categoryFactory.createWithId({id: '1', name: 'Fruit'});

function setup() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-product-images-'));
  const images = new ImageStore({directory});
  const connection = new SqliteConnection({filename: ':memory:'});
  connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('1', 'Fruit');
  const repository = new SqliteProductRepository({
    connection,
    productMapper: new SqlProductMapper({productFactory, categoryFactory}),
    images
  });
  return {directory, images, connection, repository};
}

function writePng(directory, filename) {
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, PNG);
  return filePath;
}

function product(barcode, name) {
  return productFactory.createWith({
    barcode,
    name,
    description: '',
    price: 1,
    basePrice: 0.4,
    stock: 4,
    stockMin: 1,
    weighted: false,
    category,
    status: 'ENABLED'
  });
}

function cleanup(directory) {
  fs.rmSync(directory, {recursive: true, force: true});
}

describe('product images', () => {
  it('copies an image under the barcode and reads it back', (done) => {
    const {directory, images, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save({product: product('0001', 'Apple'), imagePath: source})
      .flatMap(() => repository.findByBarcode({barcode: '0001'}))
      .subscribe(
        saved => {
          expect(saved.name).to.equal('Apple');
          expect(saved.imageName).to.equal('0001.png');
          expect(fs.existsSync(path.join(directory, '0001.png'))).to.equal(true);
          const dataUrl = images.readDataUrl(saved.imageName);
          expect(dataUrl.startsWith('data:image/png;base64,')).to.equal(true);
          const stored = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
          expect(stored.equals(PNG)).to.equal(true);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });

  it('leaves image_name empty when no file is chosen', (done) => {
    const {directory, repository} = setup();
    repository.save({product: product('0001', 'Apple')})
      .flatMap(() => repository.findByBarcode({barcode: '0001'}))
      .subscribe(
        saved => {
          expect(saved.imageName).to.equal(null);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });

  it('rejects a text file and an oversized file without inserting a row', (done) => {
    const {directory, images, connection, repository} = setup();
    const textFile = path.join(directory, 'note.txt');
    fs.writeFileSync(textFile, 'hello');
    const hugeFile = path.join(directory, 'huge.png');
    fs.writeFileSync(hugeFile, Buffer.alloc(IMAGE_MAX_BYTES + 1));

    expect(() => images.store({id: '0001', sourcePath: textFile})).to.throw(/JPEG, PNG, GIF, or WebP/);
    expect(() => images.store({id: '0002', sourcePath: hugeFile})).to.throw(/5 MB/);

    repository.save({product: product('0001', 'Bad'), imagePath: textFile})
      .subscribe(
        () => {
          cleanup(directory);
          done(new Error('expected the text file to be rejected'));
        },
        () => {
          repository.save({product: product('0002', 'Huge'), imagePath: hugeFile}).subscribe(
            () => {
              cleanup(directory);
              done(new Error('expected the oversized file to be rejected'));
            },
            () => {
              const total = Number(connection.database.prepare('SELECT count(*) AS total FROM product').get().total);
              expect(total).to.equal(0);
              const copied = fs.readdirSync(directory).filter(name => name !== 'note.txt' && name !== 'huge.png');
              expect(copied).to.deep.equal([]);
              cleanup(directory);
              done();
            }
          );
        }
      );
  });

  it('removes the copied file when the insert fails', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    connection.database.exec(
      "CREATE TRIGGER product_fail BEFORE INSERT ON product BEGIN SELECT RAISE(ABORT, 'product failed'); END"
    );
    repository.save({product: product('0001', 'Apple'), imagePath: source})
      .subscribe(
        () => {
          cleanup(directory);
          done(new Error('expected the insert to fail'));
        },
        () => {
          const copied = fs.readdirSync(directory).filter(name => name !== 'source.png');
          expect(copied).to.deep.equal([]);
          cleanup(directory);
          done();
        }
      );
  });

  it('keeps the image when the product is saved again without a new file', (done) => {
    const {directory, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save({product: product('0001', 'Apple'), imagePath: source})
      .flatMap(() => repository.findByBarcode({barcode: '0001'}))
      .flatMap(saved => {
        saved._stock += 2;
        return repository.save({product: saved}).map(() => saved.imageName);
      })
      .flatMap(imageName => repository.save({product: product('0001', 'Apple fuji')}).map(() => imageName))
      .flatMap(imageName => repository.findByBarcode({barcode: '0001'}).map(saved => ({saved, imageName})))
      .subscribe(
        ({saved, imageName}) => {
          expect(saved.name).to.equal('Apple fuji');
          expect(saved.stock).to.equal(4);
          expect(saved.imageName).to.equal(imageName);
          expect(fs.existsSync(path.join(directory, imageName))).to.equal(true);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });

  it('replaces the file and deletes the previous name when the extension changes', (done) => {
    const {directory, repository} = setup();
    const png = writePng(directory, 'source.png');
    const jpeg = path.join(directory, 'source.jpeg');
    fs.writeFileSync(jpeg, PNG);
    repository.save({product: product('0001', 'Apple'), imagePath: png})
      .flatMap(() => repository.save({product: product('0001', 'Apple'), imagePath: jpeg}))
      .flatMap(() => repository.findByBarcode({barcode: '0001'}))
      .subscribe(
        saved => {
          expect(saved.imageName).to.equal('0001.jpeg');
          expect(fs.existsSync(path.join(directory, '0001.jpeg'))).to.equal(true);
          expect(fs.existsSync(path.join(directory, '0001.png'))).to.equal(false);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });

  it('adds image_name to a product table created before the column existed', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-product-migrate-'));
    const filename = path.join(directory, 'legacy.sqlite');
    try {
      const raw = new DatabaseSync(filename);
      raw.exec('CREATE TABLE product (barcode TEXT PRIMARY KEY, name TEXT)');
      raw.prepare('INSERT INTO product (barcode, name) VALUES (?, ?)').run('0001', 'Apple');
      raw.close();

      const connection = new SqliteConnection({filename});
      const row = connection.database.prepare('SELECT barcode, name, image_name FROM product WHERE barcode = ?').get('0001');
      expect(row).to.deep.equal({barcode: '0001', name: 'Apple', image_name: null});
      connection.database.close();
    } finally {
      cleanup(directory);
    }
  });

  it('updates only the image of an existing product', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save({product: product('0001', 'Apple')})
      .flatMap(() => repository.updateProduct({barcode: '0001', imagePath: source}))
      .flatMap(() => repository.findByBarcode({barcode: '0001'}))
      .subscribe(
        saved => {
          const row = connection.database.prepare(
            'SELECT name, price, stock, image_name FROM product WHERE barcode = ?'
          ).get('0001');
          expect(row).to.deep.equal({name: 'Apple', price: 1, stock: 4, image_name: '0001.png'});
          expect(saved.imageName).to.equal('0001.png');
          expect(fs.existsSync(path.join(directory, '0001.png'))).to.equal(true);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });

  it('rejects an image update for an unknown barcode', (done) => {
    const {directory, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.updateProduct({barcode: 'missing', imagePath: source})
      .subscribe(
        () => {
          cleanup(directory);
          done(new Error('expected a missing product'));
        },
        error => {
          expect(error.message).to.match(/product not found/);
          cleanup(directory);
          done();
        }
      );
  });

  it('returns one ordered page and includes disabled products', (done) => {
    const {directory, repository} = setup();
    const disabled = product('0002', 'Pear');
    disabled._status = 'DISABLED';
    repository.save({product: product('0003', 'Fig')})
      .flatMap(() => repository.save({product: disabled}))
      .flatMap(() => repository.save({product: product('0001', 'Apple')}))
      .flatMap(() => repository.findPage({limit: 2, offset: 0}))
      .flatMap(page => repository.findPage({limit: 2, offset: 2}).map(next => ({page, next})))
      .subscribe(
        ({page, next}) => {
          expect(page.map(item => item.barcode)).to.deep.equal(['0001', '0002']);
          expect(page[1].status).to.equal('DISABLED');
          expect(next.map(item => item.barcode)).to.deep.equal(['0003']);
          cleanup(directory);
          done();
        },
        error => {
          cleanup(directory);
          done(error);
        }
      );
  });
});
