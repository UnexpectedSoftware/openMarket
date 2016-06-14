import app from 'app';
import BrowserWindow from 'browser-window';
import openMarket from './src/openMarket';
import {ipcMain} from 'electron';

ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg);
    openMarket.get(arg)
        .findAll()
        .subscribe(category => {
            event.sender.send('asynchronous-reply',category);
        });
});

openMarket.get('products_list_all_use_case')
    .findAll({limit:10, offset:0})
    .subscribe(product => console.log(product));

openMarket.get('categories_create_use_case')
    .createCategory({
        name: "Forlayos Varios",
        imageUrl: "htttp://www.rajoy.es"
    })
    .subscribe();

openMarket.get('categories_update_use_case')
    .updateCategory({
        id: "pepe",
        name: "Updated Forlayos Varios",
        imageUrl: "htttp://www.rajoy.es"
    })
    .subscribe();



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
// Create the browser window.
    mainWindow = new BrowserWindow({width: 1024, height: 768});

// and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/view/index.html');

// Open the DevTools.
    mainWindow.webContents.openDevTools();

    //mainWindow.webContents.send('online', clients);


// Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});