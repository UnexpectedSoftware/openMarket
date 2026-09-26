import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteCategoryRepository from '../../../../openMarket/infrastructure/category/SqliteCategoryRepository';
import CategoryFactoryImpl from '../../../../openMarket/infrastructure/category/CategoryFactoryImpl';
import ImageStore, {IMAGE_MAX_BYTES} from '../../../../openMarket/infrastructure/service/ImageStore';
import UUIDIdentity from '../../../../openMarket/infrastructure/service/UUIDIdentity';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const categoryFactory = new CategoryFactoryImpl({identity: new UUIDIdentity()});

function setup() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-category-images-'));
  const images = new ImageStore({directory});
  const connection = new SqliteConnection({filename: ':memory:'});
  const repository = new SqliteCategoryRepository({
    connection,
    categoryFactory,
    images
  });
  return {directory, images, connection, repository};
}

function writePng(directory, filename) {
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, PNG);
  return filePath;
}

describe('category images', () => {
  it('copies an image under the category id and reads it back', (done) => {
    const {directory, images, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save({name: 'Fruit', imagePath: source})
      .flatMap(() => repository.findAll())
      .subscribe(
        categories => {
          expect(categories).to.have.length(1);
          expect(categories[0].name).to.equal('Fruit');
          expect(categories[0].imageName).to.match(/\.png$/);
          expect(fs.existsSync(path.join(directory, categories[0].imageName))).to.equal(true);
          const dataUrl = images.readDataUrl(categories[0].imageName);
          expect(dataUrl.startsWith('data:image/png;base64,')).to.equal(true);
          const stored = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
          expect(stored.equals(PNG)).to.equal(true);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('leaves image_name empty when no file is chosen', (done) => {
    const {directory, repository} = setup();
    repository.save({name: 'Fruit'})
      .flatMap(() => repository.findById({id: 'missing'}).defaultIfEmpty(null))
      .flatMap(() => repository.findAll())
      .subscribe(
        categories => {
          expect(categories).to.have.length(1);
          expect(categories[0].imageName).to.equal(null);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('keeps the file when the category is renamed', (done) => {
    const {directory, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save({name: 'Fruit', imagePath: source})
      .flatMap(() => repository.findAll())
      .flatMap(categories => repository.update({
        id: categories[0].id,
        name: 'Fruit bowl'
      }).map(() => categories[0]))
      .flatMap(original => repository.findById({id: original.id}))
      .subscribe(
        category => {
          expect(category.name).to.equal('Fruit bowl');
          expect(category.imageName).to.match(/\.png$/);
          expect(fs.existsSync(path.join(directory, category.imageName))).to.equal(true);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
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

    expect(() => images.store({id: '1', sourcePath: textFile})).to.throw(/JPEG, PNG, GIF, or WebP/);
    expect(() => images.store({id: '2', sourcePath: hugeFile})).to.throw(/5 MB/);

    repository.save({name: 'Bad', imagePath: textFile})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected the text file to be rejected'));
        },
        () => {
          repository.save({name: 'Huge', imagePath: hugeFile}).subscribe(
            () => {
              fs.rmSync(directory, {recursive: true, force: true});
              done(new Error('expected the oversized file to be rejected'));
            },
            () => {
              const total = Number(connection.database.prepare('SELECT count(*) AS total FROM category').get().total);
              expect(total).to.equal(0);
              const copied = fs.readdirSync(directory).filter(name => name !== 'note.txt' && name !== 'huge.png');
              expect(copied).to.deep.equal([]);
              fs.rmSync(directory, {recursive: true, force: true});
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
      "CREATE TRIGGER category_fail BEFORE INSERT ON category BEGIN SELECT RAISE(ABORT, 'category failed'); END"
    );
    repository.save({name: 'Fruit', imagePath: source})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected the insert to fail'));
        },
        () => {
          const copied = fs.readdirSync(directory).filter(name => name !== 'source.png');
          expect(copied).to.deep.equal([]);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('stores the lowercase extension and refuses to read outside the image directory', () => {
    const {directory, images} = setup();
    const source = writePng(directory, 'PHOTO.JPEG');
    const imageName = images.store({id: '../outside', sourcePath: source});
    expect(imageName).to.equal('outside.jpeg');
    expect(fs.existsSync(path.join(directory, 'outside.jpeg'))).to.equal(true);
    expect(fs.existsSync(path.join(directory, '..', 'outside.jpeg'))).to.equal(false);
    expect(images.readDataUrl('../secret.png')).to.equal(null);
    expect(images.readDataUrl(null)).to.equal(null);
    expect(() => images.store({id: '..', sourcePath: source})).to.throw(/image file/);
    expect(() => images.store({id: '.', sourcePath: source})).to.throw(/image file/);
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('adds image_name to a category table created before the column existed', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-category-migrate-'));
    const filename = path.join(directory, 'legacy.sqlite');
    try {
      const raw = new DatabaseSync(filename);
      raw.exec('CREATE TABLE category (id TEXT PRIMARY KEY, name TEXT)');
      raw.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('1', 'Fruit');
      raw.close();

      const connection = new SqliteConnection({filename});
      const row = connection.database.prepare('SELECT id, name, image_name FROM category WHERE id = ?').get('1');
      expect(row).to.deep.equal({id: '1', name: 'Fruit', image_name: null});
      connection.database.close();
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});
