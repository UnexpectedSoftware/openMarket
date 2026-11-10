import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import electronLog from 'electron-log/main';
import { FETCH_IMAGES_CHANNEL } from './image/channel.js';
import { RESET_FIXTURES_CHANNEL, RESET_FIXTURES_CONSUME, RESET_FIXTURES_DONE } from './dev/channel.js';
import { demoDataMenu } from './dev/menu.js';
import { bindLogger, record } from '../infrastructure/logging/ErrorLog.js';
import { preferOsKeyring, registerSecretIpc } from './main/secretsIpc.js';

preferOsKeyring();

const log = electronLog && typeof electronLog.error === 'function'
  ? electronLog
  : electronLog.default;
bindLogger(log, {processType: 'main'});

const sourceDirectory = typeof __dirname === 'undefined'
  ? path.dirname(fileURLToPath(import.meta.url))
  : __dirname;

const versionLabel = process.env.OPENMARKET_VERSION;

app.setName('OpenMarket');

let menu;
let template;
let mainWindow = null;

const openExternal = url => {
  shell.openExternal(url).catch(error => record(error));
};

function sendFetchImages() {
  if (mainWindow) {
    mainWindow.webContents.send(FETCH_IMAGES_CHANNEL);
  }
}

function registerDemoReset() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  let pending = process.argv.includes('--reset-fixtures');
  ipcMain.on(RESET_FIXTURES_CONSUME, event => {
    event.returnValue = pending === true;
    pending = false;
  });
  ipcMain.on(RESET_FIXTURES_DONE, (event, failure) => {
    finishDemoReset(failure);
  });
}

function finishDemoReset(failure) {
  if (!mainWindow) {
    return;
  }
  if (failure) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      message: 'No se han podido reiniciar los datos de demo',
      detail: String(failure)
    }).catch(error => record(error));
    return;
  }
  mainWindow.webContents.reload();
}

function confirmDemoReset() {
  if (!mainWindow) {
    return;
  }
  dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Cancelar', 'Reiniciar'],
    defaultId: 0,
    cancelId: 0,
    message: 'Reiniciar datos de demo',
    detail: 'Esto borra los datos de la tienda de desarrollo y carga el conjunto de demo. No se puede deshacer.'
  }).then(result => {
    if (!mainWindow || result.response !== 1) {
      return;
    }
    mainWindow.webContents.send(RESET_FIXTURES_CHANNEL);
  }).catch(error => record(error));
}

function developmentMenu() {
  return demoDataMenu({
    development: process.env.NODE_ENV === 'development',
    onReset() {
      confirmDemoReset();
    }
  });
}

async function enableProcessHelpers() {
  if (process.env.NODE_ENV === 'production') {
    const { default: sourceMapSupport } = await import('source-map-support');
    sourceMapSupport.install();
  }
  if (process.env.NODE_ENV === 'development') {
    try {
      const electronDebug = await import('electron-debug');
      electronDebug.default();
    } catch (error) {
      record(error);
    }
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


const installExtensions = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  try {
    const installer = await import('electron-devtools-installer');
    const extensions = [
      installer.REACT_DEVELOPER_TOOLS,
      installer.REDUX_DEVTOOLS
    ].filter(Boolean);
    await installer.installExtension(extensions);
  } catch (error) {
    record(error);
  }
};

app.whenReady().then(async () => {
  registerSecretIpc();
  registerDemoReset();
  await enableProcessHelpers();
  await installExtensions();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const userData = app.getPath('userData');
  process.env.OPENMARKET_USER_DATA = userData;

  mainWindow = new BrowserWindow({
    show: false,
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      webSecurity: !isDevelopment,
      additionalArguments: [`--openmarket-user-data=${userData}`]
    }
  });

  if (versionLabel) {
    mainWindow.setTitle(`OpenMarket ${versionLabel}`);
  }
  mainWindow.loadURL(pathToFileURL(path.join(sourceDirectory, 'app.html')).href);

  mainWindow.webContents.on('did-finish-load', () => {
    if (versionLabel) {
      mainWindow.setTitle(`OpenMarket ${versionLabel}`);
    }
    if (process.env.OPENMARKET_SMOKE === '1') {
      fs.writeSync(1, `OPENMARKET_SMOKE ${versionLabel}\n`);
      app.exit(0);
      return;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.openDevTools();
    mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([{
        label: 'Inspect element',
        click() {
          mainWindow.webContents.inspectElement(x, y);
        }
      }]).popup({ window: mainWindow });
    });
  }

  if (process.platform === 'darwin') {
    template = [{
      label: 'Electron',
      submenu: [{
        label: 'About ElectronReact',
        selector: 'orderFrontStandardAboutPanel:'
      }, {
        type: 'separator'
      }, {
        label: 'Services',
        submenu: []
      }, {
        type: 'separator'
      }, {
        label: 'Hide ElectronReact',
        accelerator: 'Command+H',
        selector: 'hide:'
      }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      }, {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      }, {
        type: 'separator'
      }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() {
          app.quit();
        }
      }]
    }, {
      label: 'File',
      submenu: [{
        label: 'Fetch images',
        click() {
          sendFetchImages();
        }
      }]
    }, {
      label: 'Edit',
      submenu: [{
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
      }, {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      }, {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      }, {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      }, {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      }]
    }, {
      label: 'View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: 'Reload',
        accelerator: 'Command+R',
        click() {
          mainWindow.webContents.reload();
        }
      }, {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle Developer Tools',
        accelerator: 'Alt+Command+I',
        click() {
          mainWindow.toggleDevTools();
        }
      }] : [{
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }]
    }, {
      label: 'Window',
      submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
      }, {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:'
      }, {
        type: 'separator'
      }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }]
    }, ...developmentMenu(), {
      label: 'Help',
      submenu: [{
        label: 'Learn More',
        click() {
          openExternal('http://electron.atom.io');
        }
      }, {
        label: 'Documentation',
        click() {
          openExternal('https://github.com/atom/electron/tree/master/docs#readme');
        }
      }, {
        label: 'Community Discussions',
        click() {
          openExternal('https://discuss.atom.io/c/electron');
        }
      }, {
        label: 'Search Issues',
        click() {
          openExternal('https://github.com/atom/electron/issues');
        }
      }]
    }];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [{
      label: '&File',
      submenu: [{
        label: 'Fetch &images',
        click() {
          sendFetchImages();
        }
      }, {
        label: '&Open',
        accelerator: 'Ctrl+O'
      }, {
        label: '&Close',
        accelerator: 'Ctrl+W',
        click() {
          mainWindow.close();
        }
      }]
    }, {
      label: '&View',
      submenu: [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click() {
          mainWindow.webContents.reload();
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click() {
          mainWindow.toggleDevTools();
        }
      }]
    }, ...developmentMenu(), {
      label: 'Help',
      submenu: [{
        label: 'Learn More',
        click() {
          openExternal('http://electron.atom.io');
        }
      }, {
        label: 'Documentation',
        click() {
          openExternal('https://github.com/atom/electron/tree/master/docs#readme');
        }
      }, {
        label: 'Community Discussions',
        click() {
          openExternal('https://discuss.atom.io/c/electron');
        }
      }, {
        label: 'Search Issues',
        click() {
          openExternal('https://github.com/atom/electron/issues');
        }
      }]
    }];
    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
});
