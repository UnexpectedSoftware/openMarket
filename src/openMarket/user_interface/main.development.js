import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { app, BrowserWindow, Menu, shell } from 'electron';

const sourceDirectory = typeof __dirname === 'undefined'
  ? path.dirname(fileURLToPath(import.meta.url))
  : __dirname;

const versionLabel = process.env.OPENMARKET_VERSION;

app.setName('OpenMarket');

let menu;
let template;
let mainWindow = null;

const openExternal = url => {
  shell.openExternal(url).catch(error => console.log(error));
};

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
      console.log('electron-debug is unavailable', error);
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
    console.log('DevTools extensions were not installed', error);
  }
};

app.whenReady().then(async () => {
  await enableProcessHelpers();
  await installExtensions();

  const isDevelopment = process.env.NODE_ENV === 'development';
  const userData = app.getPath('userData');
  process.env.OPENMARKET_USER_DATA = userData;

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
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
    }, {
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
    }, {
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
