import fs from 'fs';
import os from 'os';
import path from 'path';

const USER_DATA_ARGUMENT = '--openmarket-user-data=';

function userDataDirectory() {
  const fromArgv = process.argv.find(arg => arg.startsWith(USER_DATA_ARGUMENT));
  if (fromArgv) {
    return fromArgv.slice(USER_DATA_ARGUMENT.length);
  }
  return process.env.OPENMARKET_USER_DATA || null;
}

export default function sqliteDatabasePath() {
  if (process.env.NODE_ENV === 'test') {
    return path.join(os.tmpdir(), 'openmarket-test.sqlite');
  }
  const directory = userDataDirectory() || os.tmpdir();
  fs.mkdirSync(directory, {recursive: true});
  return path.join(directory, 'openmarket.sqlite');
}
