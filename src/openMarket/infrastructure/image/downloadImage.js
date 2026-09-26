import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

export function pause(ms) {
  if (!ms) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function contentType(response) {
  if (!response.headers || typeof response.headers.get !== 'function') {
    return '';
  }
  return String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
}

export async function fetchWithRetry({fetchImpl, url, headers, retryDelay}) {
  const response = await fetchImpl(url, {headers});
  if (response.status !== 429) {
    return response;
  }
  await retryDelay();
  return fetchImpl(url, {headers});
}

export async function writeFetchedImage({response, directory, maxBytes, prefix}) {
  if (!response || !response.ok) {
    return null;
  }
  const extension = IMAGE_EXTENSIONS[contentType(response)];
  if (!extension) {
    return null;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > maxBytes) {
    return null;
  }
  fs.mkdirSync(directory, {recursive: true});
  const filePath = path.join(directory, prefix + crypto.randomBytes(8).toString('hex') + extension);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}
