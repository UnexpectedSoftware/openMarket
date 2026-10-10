import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteCategoryRepository from '../../../../openMarket/infrastructure/category/SqliteCategoryRepository';
import SqliteCategoryQueryService from '../../../../openMarket/infrastructure/category/SqliteCategoryQueryService';
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
    images,
    queryService: new SqliteCategoryQueryService()
  });
  return {directory, images, connection, repository};
}

function writePng(directory, filename) {
  const filePath = path.join(directory, filename);
  fs.writeFileSync(filePath, PNG);
  return filePath;
}

function newCategory(name, imagePath) {
  const category = categoryFactory.createWith({name});
  return imagePath ? {category, imagePath} : {category};
}

describe('category images', () => {
  it('copies an image under the category id and reads it back', (done) => {
    const {directory, images, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
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
    repository.save(newCategory('Fruit'))
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
    repository.save(newCategory('Fruit', source))
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

    repository.save(newCategory('Bad', textFile))
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected the text file to be rejected'));
        },
        () => {
          repository.save(newCategory('Huge', hugeFile)).subscribe(
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
    repository.save(newCategory('Fruit', source))
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

  it('updates only the image of an existing category', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit'))
      .flatMap(() => {
        const row = connection.database.prepare('SELECT id, name FROM category').get();
        return repository.updateCategory({id: row.id, imagePath: source}).map(() => row);
      })
      .subscribe(
        row => {
          const stored = connection.database.prepare('SELECT id, name, image_name FROM category WHERE id = ?').get(row.id);
          expect(stored).to.deep.equal({id: row.id, name: 'Fruit', image_name: row.id + '.png'});
          expect(fs.existsSync(path.join(directory, row.id + '.png'))).to.equal(true);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('clears a stored image and deletes the file', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => repository.clearImage({id: categories[0].id}).map(() => categories[0]))
      .flatMap(original => repository.findById({id: original.id}).map(category => ({category, original})))
      .subscribe(
        ({category, original}) => {
          expect(category.name).to.equal('Fruit');
          expect(category.imageName).to.equal(null);
          expect(fs.existsSync(path.join(directory, original.imageName))).to.equal(false);
          const row = connection.database.prepare('SELECT image_name FROM category WHERE id = ?').get(original.id);
          expect(row).to.deep.equal({image_name: null});
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('leaves an empty image empty', (done) => {
    const {directory, connection, repository} = setup();
    repository.save(newCategory('Fruit'))
      .flatMap(() => repository.findAll())
      .flatMap(categories => repository.clearImage({id: categories[0].id}).map(() => categories[0].id))
      .subscribe(
        id => {
          const row = connection.database.prepare('SELECT name, image_name FROM category WHERE id = ?').get(id);
          expect(row).to.deep.equal({name: 'Fruit', image_name: null});
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('rejects clearing an image for an unknown category', (done) => {
    const {directory, repository} = setup();
    repository.clearImage({id: 'missing'})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected a missing category'));
        },
        error => {
          expect(error.code).to.equal('CATEGORY_NOT_FOUND');
          expect(error.userMessage).to.equal('category not found');
          expect(error.context.operation).to.equal('clearImage');
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('rejects an image update for an unknown category', (done) => {
    const {directory, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.updateCategory({id: 'missing', imagePath: source})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected a missing category'));
        },
        error => {
          expect(error.code).to.equal('CATEGORY_NOT_FOUND');
          expect(error.userMessage).to.equal('category not found');
          expect(error.context.operation).to.equal('replaceImage');
          const copied = fs.readdirSync(directory).filter(name => name !== 'source.png');
          expect(copied).to.deep.equal([]);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('rejects a rename for an unknown category', (done) => {
    const {directory, repository} = setup();
    repository.update({id: 'missing', name: 'Nope'})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected a missing category'));
        },
        error => {
          expect(error.code).to.equal('CATEGORY_NOT_FOUND');
          expect(error.userMessage).to.equal('category not found');
          expect(error.context.operation).to.equal('rename');
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('replaces a stored image and deletes the previous file', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    const next = writePng(directory, 'next.jpg');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => repository.updateCategory({
        id: categories[0].id,
        imagePath: next
      }).map(() => categories[0].id))
      .subscribe(
        id => {
          const row = connection.database.prepare('SELECT image_name FROM category WHERE id = ?').get(id);
          expect(row).to.deep.equal({image_name: id + '.jpg'});
          expect(fs.existsSync(path.join(directory, id + '.jpg'))).to.equal(true);
          expect(fs.existsSync(path.join(directory, id + '.png'))).to.equal(false);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('keeps the stored image when deleting the previous file fails', (done) => {
    const {directory, images, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    const next = writePng(directory, 'next.jpg');
    const originalRemove = images.remove.bind(images);
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => {
        images.remove = (imageName) => {
          if (String(imageName).endsWith('.png')) {
            throw new Error('disk full');
          }
          originalRemove(imageName);
        };
        return repository.updateCategory({
          id: categories[0].id,
          imagePath: next
        }).map(() => categories[0].id);
      })
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected the previous file delete to fail'));
        },
        error => {
          expect(error.message).to.match(/disk full/);
          const row = connection.database.prepare('SELECT id, image_name FROM category').get();
          expect(row.image_name).to.equal(row.id + '.png');
          expect(fs.existsSync(path.join(directory, row.id + '.png'))).to.equal(true);
          expect(fs.existsSync(path.join(directory, row.id + '.jpg'))).to.equal(false);
          expect(transactionIsOpen(connection)).to.equal(false);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('removes an empty category and its image', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => {
        const id = categories[0].id;
        return repository.remove({id}).map(() => id);
      })
      .flatMap(id => repository.findById({id}).defaultIfEmpty(null).map(found => ({id, found})))
      .subscribe(
        ({id, found}) => {
          expect(found).to.equal(null);
          expect(fs.existsSync(path.join(directory, id + '.png'))).to.equal(false);
          const total = Number(connection.database.prepare('SELECT count(*) AS total FROM category').get().total);
          expect(total).to.equal(0);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        },
        error => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(error);
        }
      );
  });

  it('keeps a category that still has products', (done) => {
    const {directory, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => {
        const id = categories[0].id;
        connection.database.prepare(
          'INSERT INTO product (barcode, name, status, category_id) VALUES (?, ?, ?, ?)'
        ).run('1001', 'Apple', 'DISABLED', id);
        return repository.remove({id}).map(() => id);
      })
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected the category to be kept'));
        },
        error => {
          expect(error.code).to.equal('CATEGORY_NOT_EMPTY');
          expect(error.userMessage).to.equal('Category still has products');
          const row = connection.database.prepare('SELECT id, image_name FROM category').get();
          expect(row.image_name).to.equal(row.id + '.png');
          expect(fs.existsSync(path.join(directory, row.image_name))).to.equal(true);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('reports a missing category when remove matches nothing', (done) => {
    const {directory, repository} = setup();
    repository.remove({id: 'missing'})
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected a missing category'));
        },
        error => {
          expect(error.code).to.equal('CATEGORY_NOT_FOUND');
          expect(error.userMessage).to.equal('category not found');
          expect(error.context.operation).to.equal('delete');
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('puts the category back when its image cannot be deleted', (done) => {
    const {directory, images, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => {
        images.remove = () => {
          throw new Error('disk full');
        };
        return repository.remove({id: categories[0].id});
      })
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected image deletion to fail'));
        },
        error => {
          expect(error.message).to.match(/disk full/);
          const row = connection.database.prepare('SELECT id, name, image_name FROM category').get();
          expect(row.name).to.equal('Fruit');
          expect(row.image_name).to.equal(row.id + '.png');
          expect(fs.existsSync(path.join(directory, row.image_name))).to.equal(true);
          expect(transactionIsOpen(connection)).to.equal(false);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });

  it('puts the image name back when clearing the file fails', (done) => {
    const {directory, images, connection, repository} = setup();
    const source = writePng(directory, 'source.png');
    repository.save(newCategory('Fruit', source))
      .flatMap(() => repository.findAll())
      .flatMap(categories => {
        images.remove = () => {
          throw new Error('disk full');
        };
        return repository.clearImage({id: categories[0].id});
      })
      .subscribe(
        () => {
          fs.rmSync(directory, {recursive: true, force: true});
          done(new Error('expected image deletion to fail'));
        },
        error => {
          expect(error.message).to.match(/disk full/);
          const row = connection.database.prepare('SELECT id, image_name FROM category').get();
          expect(row.image_name).to.equal(row.id + '.png');
          expect(fs.existsSync(path.join(directory, row.image_name))).to.equal(true);
          expect(transactionIsOpen(connection)).to.equal(false);
          fs.rmSync(directory, {recursive: true, force: true});
          done();
        }
      );
  });
});

function transactionIsOpen(connection) {
  try {
    connection.database.exec('BEGIN');
    connection.database.exec('ROLLBACK');
    return false;
  } catch (error) {
    return true;
  }
}
