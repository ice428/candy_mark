// 主にremoteとmainのデータのやり取りを行う

// var $ = jQuery = require("jquery");
// var Hammer = require('./js/hammer.min.js');
const electron = require('electron')
const remote = electron.remote;
const ipc = electron.ipcRenderer;
const dialog = remote.dialog;
const browserWindow = remote.BrowserWindow;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const shell = electron.shell

const fs = require("fs");
const path = require('path')
const os = require('os')

// ファイルを開く
function loadFile() {
    var win = browserWindow.getFocusedWindow();
    dialog.showOpenDialog(
        win, {
            properties: ['openFile'],
            filters: [{
                name: 'Markdown',
                extensions: ['md', 'txt']
            }]
        },
        function(filenames) {
            if (filenames) {
                fs.readFile(filenames[0], function(error, text) {
                    if (error != null) {
                        alert('error : ' + error);
                        return;
                    }
                    mdEditor.setValue(text.toString());
                });
                $("#path_area").html(filenames[0]);
            }
        });
}
ipc.on('open', function() {
    loadFile();
});

// ファイル保存
function saveFile() {
    if (footerVm.currentPath == "") {
        saveNewFile();
        return;
    }else{
		var win = browserWindow.getFocusedWindow();
	    dialog.showMessageBox(win, {
	            title: 'The existing file will replaced.',
	            type: 'info',
	            buttons: ['OK', 'Cancel'],
	            detail: 'Do you want to continue?'
	        },
	        function(res) {
	            if (res == 0) {
	                var data = mdEditor.getValue();
	                writeFile(footerVm.currentPath, data);
	            }
	        }
	    );}
}
// 新しいファイルを保存するときはこちら
function saveNewFile() {
    var win = browserWindow.getFocusedWindow();
    dialog.showSaveDialog(
        win, {
            properties: ['openFile'],
            filters: [{
                name: 'Documents',
                extensions: ['md', 'txt']
            }]
        },
        function(fileName) {
            if (fileName) {
                var data = mdEditor.getValue();
                footerVm.currentPath = fileName;
                writeFile(fileName, data);
            }
        }
    );
}
// ファイルの書き込み
function writeFile(path, data) {
    fs.writeFile(path, data, function(error) {
        if (error != null) {
            alert('error : ' + error);
        }
        alert('Save complete.');
    });
}
ipc.on('save', function() {
    saveFile();
});

// 新規ファイル作成
function newFile() {
    mdEditor.setValue("");
    footerVm.currentPath = "";
}
ipc.on('new', function() {
    newFile();
});

var webview = document.getElementById('webview');
ipc.on('print_pdf', function(event) {
    const pdfPath = path.join(os.homedir(), 'print.pdf')
    webview.printToPDF({}, function(error, data) {
        if (error) throw error
        fs.writeFile(pdfPath, data, function(error) {
            if (error) {
                throw error
            }
            shell.openExternal('file://' + pdfPath)
            // event.sender.send('wrote-pdf', pdfPath)
        })
    })
})
