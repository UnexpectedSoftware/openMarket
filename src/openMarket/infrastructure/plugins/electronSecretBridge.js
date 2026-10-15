/**
 * Renderer bridge to the main-process safeStorage handlers.
 * Electron is required only when a secret is read or written.
 */
export function electronSecretBridge() {
  return {
    /**
     * @returns {Promise<{available: boolean, backend: string}>}
     */
    status() {
      return answered(ipc().sendSync('openmarket:secrets:status'));
    },
    /**
     * @param {string} plain
     * @returns {string}
     */
    encrypt(plain) {
      const result = answered(ipc().sendSync('openmarket:secrets:encrypt', plain));
      return result.ciphertext;
    },
    /**
     * @param {string} encoded
     * @returns {string}
     */
    decrypt(encoded) {
      const result = answered(ipc().sendSync('openmarket:secrets:decrypt', encoded));
      return result.plain;
    }
  };
}

/**
 * @param {{error?: string}} result
 * @returns {*}
 */
function answered(result) {
  if (result && result.error) {
    throw new Error(result.error);
  }
  return result;
}

function ipc() {
  const electron = require('electron');
  if (!electron || !electron.ipcRenderer || typeof electron.ipcRenderer.sendSync !== 'function') {
    throw new Error('Secret storage is only available in the app window');
  }
  return electron.ipcRenderer;
}
