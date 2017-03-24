// ファイル入出力関係

// dpi測定関数
const calc_dpi = function() {
    let div = document.createElement('div');
    div.setAttribute('style', 'height:1in;left:-100%;top:-100%;position:absolute;width:1in;');
    document.body.appendChild(div);
    let dpi = div.offsetHeight;
    document.body.removeChild(div);
    return dpi
}

// PDF保存ダイアログ
function savePdfDialog(data) {
    var win = browserWindow.getFocusedWindow();
    dialog.showSaveDialog(win, {
        // properties: ['openFile'],
        filters: [
            {
                name: 'Documents',
                extensions: ['pdf']
            }
        ]
    }, function(fileName) {
        if (fileName) {
            fs.writeFile(fileName, data, function(error) {
                if (error) {
                    throw error
                }
                shell.openExternal('file://' + fileName)
            })
        }
    })
}

// ExampleのImport
function md_example() {
    let filename = "./static/example.md"
    fs.readFile(filename, function(error, text) {
        if (error != null) {
            alert('error : ' + error);
            return;
        }
        mdEditor.setValue(text.toString());
        let content = text.toString();
        let title = content.match(/#.*/)[0];
        if (title === null) {
            title = "";
        } else {
            title = title.replace(/#.* /, "");
        }
        db.insert({
            title: title,
            content: content
        }, function(err, newDoc) {
            db.find().sort({updatedAt: -1}).exec(function(err, docs) {
                cur_id = docs[0]._id;
                app.list = docs;
                mdEditor.setValue(docs[0].content);
            });
        });
    });
}
// MarkdownImport
function loadFile() {
    let win = browserWindow.getFocusedWindow();
    dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Markdown',
                extensions: ['md', 'markdown']
            }
        ]
    }, function(filenames) {
        if (filenames) {
            fs.readFile(filenames[0], function(error, text) {
                if (error != null) {
                    alert('error : ' + error);
                    return;
                }
                mdEditor.setValue(text.toString());
                let content = text.toString();
                let title = content.match(/#.*/)[0];
                if (title === null) {
                    title = "";
                } else {
                    title = title.replace(/#.* /, "");
                }
                db.insert({
                    title: title,
                    content: content
                }, function(err, newDoc) {
                    db.find().sort({updatedAt: -1}).exec(function(err, docs) {
                        cur_id = docs[0]._id;
                        app.list = docs;
                        mdEditor.setValue(docs[0].content);
                    });
                });
            });
        }
    });
}

// ファイルの書き込み
function writeFile(path, data) {
    fs.writeFile(path, data, function(error) {
        if (error != null) {
            alert('error : ' + error);
        }
        alert('Exported!');
    });
}
// MarkdownExport
function saveNewFile() {
    let win = browserWindow.getFocusedWindow();
    let content = mdEditor.getValue();
    dialog.showSaveDialog(win, {
        filters: [
            {
                name: 'Custom File Type',
                extensions: ['md']
            }
        ]
    }, function(fileName) {
        if (fileName) {
            writeFile(fileName, content);
        }
    });
}

// 各種イベント処理群
// MarkdownImport
ipc.on('import_md', function() {
    loadFile();
});
// MarkdownExport
ipc.on('export_md', function() {
    saveNewFile();
});
// ExampleのLoad要求
ipc.on('md_example', function() {
    md_example();
});
// メインスレッドからのPDF印刷指示で発火
ipc.on('print_pdf', function(event) {
    webview.send('get_size');
});
// メインスレッドからサイズが帰ってきた時に発火
ipc.on('return_size_content', function(event, width, height) {
    let dpi = calc_dpi()
    webview.printToPDF({
        pageSize: {
            // width: parseInt(width * 25.4 / dpi * 1000 * 1.3),
            // height: parseInt(height * 25.4 / dpi * 1000 * 1.2)
            width: parseInt(width * 25.4 / dpi * 1000),
            height: parseInt(height * 25.4 / dpi * 1000)
        }
    }, function(error, data) {
        if (error)
            throw error
        savePdfDialog(data)
    })
});
