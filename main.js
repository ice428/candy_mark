const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
var {ipc} = electron;

const path = require('path')
const url = require('url')

// require('crash-reporter').start();

var mainWindow = null;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

// load window
function createWindow () {
    // create window object
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 500,
        title: "Candy"
    });

	// devtools
    // mainWindow.webContents.openDevTools();

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.on('closed', function() {
        mainWindow = null
    });
    var template = [{
            label: "Application",
            submenu: [{
                    label: "About Application",
                    selector: "orderFrontStandardAboutPanel:"
                },
                {
                    type: "separator"
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: function() {
                        app.quit();
                    }
                },
                {
                    label: "Save",
                    accelerator: "Command+S",
                    click: function() {
                        mainWindow.webContents.send('save');
                    }
                },
                {
                    label: "Open",
                    accelerator: "Command+O",
                    click: function() {
                        mainWindow.webContents.send('open');
                    }
                },
                {
                    label: "New",
                    accelerator: "Command+N",
                    click: function() {
                        mainWindow.webContents.send('new');
                    }
                }
            ]
        },
        {
            label: "Edit",
            submenu: [{
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    selector: "undo:"
                },
                {
                    label: "Redo",
                    accelerator: "Shift+CmdOrCtrl+Z",
                    selector: "redo:"
                },
                {
                    type: "separator"
                },
                {
                    label: "Cut",
                    accelerator: "CmdOrCtrl+X",
                    selector: "cut:"
                },
                {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+C",
                    selector: "copy:"
                },
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    selector: "paste:"
                },
                {
                    label: "Select All",
                    accelerator: "CmdOrCtrl+A",
                    selector: "selectAll:"
                },
				{
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: function() { mainWindow.restart(); }
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: function() { mainWindow.setFullScreen(!mainWindow.isFullScreen()); }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: function() { mainWindow.toggleDevTools(); }
          }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};
app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
});
