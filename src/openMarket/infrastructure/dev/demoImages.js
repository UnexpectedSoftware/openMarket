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
 * Writes one tiny PNG per product that names an image file.
 * A missing directory skips the copy. Called after the seed transaction commits.
 * @param {{directory?: string | null, products?: Array<{_imageName?: string | null}>}} files
 * @returns {void}
 */
export function installDemoImages({directory, products} = {}) {
  if (!directory) {
    return;
  }
  fs.mkdirSync(directory, {recursive: true});
  let color = 0;
  (products || []).forEach(product => {
    const imageName = product && product._imageName;
    if (!imageName || path.basename(imageName) !== imageName) {
      return;
    }
    const bytes = Buffer.from(COLORS[color % COLORS.length], 'base64');
    color += 1;
    fs.writeFileSync(path.join(directory, imageName), bytes);
  });
}
