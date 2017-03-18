const electron = require('electron')
const app = electron.app
// const webFrame = electron.webFrame
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const ipc = electron.ipcMain
const shell = electron.shell

// webFrame.setZoomLevelLimits(1, 1)

// const path = require('path')
// const url = require('url')
// const os = require('os')
// const fs = require('fs')
// require('crash-reporter').start();

let mainWindow = null

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
                    accelerator: "CmdOrCtrl+Q",
                    click: function() {
                        app.quit();
                    }
                },
                {
                    label: "New Content",
                    accelerator: "CmdOrCtrl+N",
                    click: function() {
                        mainWindow.webContents.send('new');
                    }
                },
                {
                    label: "Save Content",
                    accelerator: "CmdOrCtrl+S",
                    click: function() {
                        mainWindow.webContents.send('save');
                    }
                },
                {
                    label: 'Delete',
                    accelerator: 'CmdOrCtrl+Shift+D',
                    click: function() {
                        mainWindow.webContents.send('remove');
                    }
                },
                {
                    label: "Import Markdown",
                    // accelerator: "CmdOrCtrl+O",
                    click: function() {
                        mainWindow.webContents.send('import_md');
                    }
                },
                {
                    label: "Export Markdown",
                    // accelerator: "Command+Shift+S",
                    click: function() {
                        mainWindow.webContents.send('export_md');
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
                    label: 'Toggle Comment',
                    accelerator: 'CmdOrCtrl+K',
                    click: function() {
                        mainWindow.webContents.send('comment_out');
                    }
                },
                {
                    label: 'Toggle Display Mode',
                    accelerator: 'CmdOrCtrl+L',
                    click: function() {
                        mainWindow.webContents.send('display_toggle');
                    }
                },
                {
                    label: 'Toggle &Full Screen',
                    accelerator: 'CmdOrCtrl+F',
                    click: function() {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                {
                    label: 'Toggle &Developer Tools',
                    // accelerator: 'CmdOrCtrl+Shift+D',
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
    mainWindow.webContents.send("return_size_content", width, height);
});
