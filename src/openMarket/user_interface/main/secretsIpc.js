import {ipcMain, safeStorage} from 'electron';

/**
 * On Linux, safeStorage picks basic text when the keyring cannot be used, then
 * refuses to encrypt until the app opts in. The opt-in has to happen before ready.
 * macOS and Windows use the keychain and DPAPI without this call.
 * The Plugins page says when the backend is basic text.
 */
export function preferOsKeyring() {
  if (process.platform === 'linux' && typeof safeStorage.setUsePlainTextEncryption === 'function') {
    safeStorage.setUsePlainTextEncryption(true);
  }
}

/**
 * Encryption stays in the main process. The renderer only sees ciphertext.
 */
export function registerSecretIpc() {
  ipcMain.on('openmarket:secrets:status', event => {
    event.returnValue = {
      available: safeStorage.isEncryptionAvailable(),
      backend: typeof safeStorage.getSelectedStorageBackend === 'function'
        ? safeStorage.getSelectedStorageBackend()
        : 'unknown'
    };
  });

  ipcMain.on('openmarket:secrets:encrypt', (event, plain) => {
    if (!safeStorage.isEncryptionAvailable()) {
      event.returnValue = {error: 'Encryption is not available'};
      return;
    }
    event.returnValue = {ciphertext: safeStorage.encryptString(String(plain)).toString('base64')};
  });

  ipcMain.on('openmarket:secrets:decrypt', (event, encoded) => {
    try {
      const buffer = Buffer.from(String(encoded), 'base64');
      event.returnValue = {plain: safeStorage.decryptString(buffer)};
    } catch (error) {
      event.returnValue = {error: error && error.message ? error.message : 'Could not decrypt'};
    }
  });
}
