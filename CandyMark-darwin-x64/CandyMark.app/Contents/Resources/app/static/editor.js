const electron = require('electron')
var remote = electron.remote;
var fs = require("fs");
var dialog = remote.dialog;
var browserWindow = remote.BrowserWindow;
const ipc = electron.ipcRenderer

// open
function loadFile() {
    var win = browserWindow.getFocusedWindow();
    dialog.showOpenDialog(
        win,
        {
            properties: ['openFile'],
            filters: [
                {
                    name: 'Markdown',
                    extensions: ['md', 'txt']
                }
            ]
        },
        function (filenames) {
            if (filenames) {
                fs.readFile(filenames[0], function (error, text) {
                    if (error != null) {
                        alert('error : ' + error);
                        return;
                    }
                    mdEditor.setValue(text.toString());
                });
                footerVm.currentPath = filenames[0];
            }
        });
}

ipc.on('open', function() {
	loadFile();
});

// save
function saveFile() {
    if (footerVm.currentPath == "") {
        saveNewFile();
        return;
    }
    var win = browserWindow.getFocusedWindow();
    dialog.showMessageBox(win,
        {
            title: 'The existing file will replaced.',
            type: 'info',
            buttons: ['OK', 'Cancel'],
            detail: 'Do you want to continue?'
        },
        function (res) {
            if (res == 0) {
                var data = mdEditor.getValue();
                writeFile(footerVm.currentPath, data);
            }
        }
    );
}

// save
function saveNewFile() {
    var win = browserWindow.getFocusedWindow();
    dialog.showSaveDialog(
        win,
        {
            properties: ['openFile'],
            filters: [
                {
                    name: 'Documents',
                    extensions: ['md', 'txt']
                }
            ]
        },
        function (fileName) {
            if (fileName) {
                var data = mdEditor.getValue();
                footerVm.currentPath = fileName;
                writeFile(fileName, data);
            }
        }
    );
}

// write
function writeFile(path, data) {
    fs.writeFile(path, data, function (error) {
        if (error != null) {
            alert('error : ' + error);
        }
        alert('Save complete.');
    });
}

ipc.on('save', function() {
	saveFile();
});

// new
function newFile(){
	mdEditor.setValue("");
	footerVm.currentPath = "";
}

ipc.on('new', function() {
	newFile();
});
