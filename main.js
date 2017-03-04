const electron = require('electron')
const app = electron.app
// const webFrame = electron.webFrame
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipc = electron.ipcMain
const shell = electron.shell

// webFrame.setZoomLevelLimits(1, 1)

const path = require('path')
const url = require('url')
const os = require('os')
const fs = require('fs')
// require('crash-reporter').start();

let mainWindow = null;
let workerWindow = null

app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

// load window
function createWindow() {
    // ウィンドウオブジェクトの生成
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 500,
        title: "CandyMark"
    });
    // devtools
    // mainWindow.webContents.openDevTools();
    mainWindow.loadURL("file://" + __dirname + "/index.html");
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
                },
                {
                    label: "PrintPDF",
                    accelerator: "Command+P",
                    click: function() {
						// console.log(mainWindow.webContents.webContents)
                        mainWindow.webContents.send('print_pdf');
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
                    click: function() {
                        mainWindow.restart();
                    }
                },
                {
                    label: 'Toggle &Full Screen',
                    accelerator: 'F11',
                    click: function() {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                {
                    label: 'Toggle &Developer Tools',
                    accelerator: 'Alt+Ctrl+I',
                    click: function() {
                        mainWindow.toggleDevTools();
                    }
                }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// アプリケーションの準備が完了したら発動
app.on('ready', createWindow);

// 全てのWindowが閉じられた時に発動
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

// 再びActiveになった時に発動
app.on('activate', function() {
    if (mainWindow === null) {
        createWindow()
    }
});

// レンダラー側からPDF印刷要求が来たら
ipc.on("return_size", (event, width, height) => {
	console.log(width)
		console.log(height)
    // console.log(content);
    mainWindow.webContents.send("return_size_content", width, height);
});
