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
                extensions: ['md', 'markdown']
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
                // 実行ディレクトリの変更
                $("title").text(filenames[0]);
            }
        });
}
ipc.on('open', function() {
    loadFile();
});

// ファイル保存
function saveFile() {
    if ($('title').text() == "") {
        saveNewFile();
        return;
    } else {
        var win = browserWindow.getFocusedWindow();
        writeFile($('title').text(), mdEditor.getValue());
}
// 新しいファイルを保存するときはこちら
function saveNewFile() {
    var win = browserWindow.getFocusedWindow();
    dialog.showSaveDialog(
        win, {
            properties: ['openFile'],
            filters: [{
                name: 'Documents',
                extensions: ['md', 'markdown']
            }]
        },
        function(fileName) {
            if (fileName) {
                var data = mdEditor.getValue();
                // 実行ディレクトリの変更
                $('title').text(fileName);
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
        alert('Saved successfully.');
    });
}
ipc.on('save', function() {
    saveFile();
});
ipc.on('save_as', function() {
    saveNewFile();
});

// 新規ファイル作成
function newFile() {
    mdEditor.setValue("");
    $('title').text("(untitled)");
}
ipc.on('new', function() {
    newFile();
});

// PDF出力
var webview = document.getElementById('webview');
// dpi測定関数
var calc_dpi = function() {
    let div = document.createElement('div');
    div.setAttribute('style', 'height:1in;left:-100%;top:-100%;position:absolute;width:1in;');
    document.body.appendChild(div);
    let dpi = div.offsetHeight;
    document.body.removeChild(div);
    return dpi
}
// メインスレッドからのPDF印刷指示で発火
ipc.on('print_pdf', function(event) {
    webview.send('get_size');
});
// PDF保存ダイアログ
function savePdfDialog(data) {
    var win = browserWindow.getFocusedWindow();
    dialog.showSaveDialog(
        win, {
            properties: ['openFile'],
            filters: [{
                name: 'Documents',
                extensions: ['pdf']
            }]
        },
        function(fileName) {
            if (fileName) {
		        fs.writeFile(fileName, data, function(error) {
		            if (error) {
		                throw error
		            }
		            shell.openExternal('file://' + fileName)
		        })
            }
        }
    );
}
// メインスレッドからサイズが帰ってきた時に発火
ipc.on('return_size_content', function(event, width, height) {
    let dpi = calc_dpi()
    webview.printToPDF({
        pageSize: {
            width: parseInt(width * 25.4 / dpi * 1000 * 1.3),
            height: parseInt(height * 25.4 / dpi * 1000 * 1.2)
        }
    }, function(error, data) {
        if (error) throw error
		savePdfDialog(data)
    })
});
