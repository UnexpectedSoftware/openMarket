import fs from 'fs';
import path from 'path';

const COLORS = [
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4EmMHAANGAV8JZtwBAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOI6fECAAJ6ATMaULTEAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPQz18MAAISAUKgmy4KAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4ssIZAAQTAcCKbtrEAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOoipoHAALEAXOmpYoZAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOIiooCAAIgAQ/kH0CsAAAAAElFTkSuQmCC'
];

/**
 * Writes one tiny PNG per demo product that shows a photo, ready for the product form
 * to copy into the image store. The caller removes the directory afterwards.
 * @param {{directory: string, products: Array<{barcode: string, image: boolean}>}} files
 * @returns {Map<string, string>} barcode to the PNG path
 */
export function writeDemoImages({directory, products}) {
  fs.mkdirSync(directory, {recursive: true});
  const paths = new Map();
  products.filter(product => product.image).forEach((product, index) => {
    const file = path.join(directory, product.barcode + '.png');
    fs.writeFileSync(file, Buffer.from(COLORS[index % COLORS.length], 'base64'));
    paths.set(product.barcode, file);
  });
  return paths;
}
