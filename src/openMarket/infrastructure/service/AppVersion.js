import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const STAMPED_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+-[0-9a-f]{7}$/;

/**
 * Version shown in the running app. A packaged release is already stamped
 * `<package version>-<7-char sha>`, which is the GitHub tag without the leading v.
 * A checkout build appends the current commit the same way.
 */
export function readAppVersion(startDir) {
  const found = findPackage(startDir);
  if (!found) {
    return null;
  }
  if (STAMPED_VERSION.test(found.version)) {
    return found.version;
  }
  const sha = gitShortSha(found.directory);
  return sha ? `${found.version}-${sha}` : found.version;
}

function findPackage(startDir) {
  let directory = startDir;
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(directory, 'package.json');
    if (fs.existsSync(candidate)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        if (pkg.name === 'OpenMarket' && typeof pkg.version === 'string') {
          return { version: pkg.version, directory };
        }
      } catch (error) {
        return null;
      }
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
  return null;
}

function gitShortSha(directory) {
  try {
    const sha = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : null;
  } catch (error) {
    return null;
  }
}
