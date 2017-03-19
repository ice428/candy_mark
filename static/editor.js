const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const browserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const shell = electron.shell
const fs = require("fs");
const marked = require('marked');
const Datastore = require('nedb');
const webview = document.getElementById('webview');
let cur_id = "";
hljs.initHighlightingOnLoad();


// markedレンダラーの生成
var renderer = new marked.Renderer();
// codeブロックレンダラーの上書き
renderer.code = function(code, lang) {
    if (lang === "mermaid") {
        // return mermaid.parse(code);
        // return '<div class="mermaid" style="overflow:auto">' + code + '</div>';
        return '<div class="mermaid">' + code + '</div>';
    } else if (lang === "math") {
        var katex_parsed = "";
        try {
            katex_parsed = katex.renderToString(code, {
                displayMode: true
            })
            return katex_parsed
        } catch (err) {
            return err
        }
    } else {
        return '<pre class="code_block"><code>' + hljs.highlightAuto(code, [lang]).value + '</code></pre>'
    }
};
// 画像レンダラの上書き
renderer.image = function(href, title, text) {
    if (href.match(/\..*/)) {
        href = __dirname + href.substr(1)
    }
    return '<img src="' + href + '" alt="' + text + '"' + ' title="' + title + '"' + '>';
};
renderer.hr = function() {
    return '</div><div class="slide">'
}
marked.setOptions({
    renderer: renderer,
    gfm: true
});

// コードミラーの設定
var mdEditor = CodeMirror.fromTextArea(document.getElementById("editor-div"), {
    lineNumbers: true,
    lineWrapping: true,
    indentWithTabs: true,
    autoCloseBrackets: true,
    // autoCloseTags: true,
    mode: 'gfm',
    matchBrackets: true,
    theme: 'custom-theme',
    extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList",
        // "Cmd-K":"toggleComment"
    }
});
ipc.on('comment_out', function() {
    console.log(mdEditor.getCursor());
    let pos = mdEditor.getCursor();
    let line = mdEditor.getLine(pos.line);
    if (line.match(/~~/) === null) {
        mdEditor.replaceRange(line.replace(/(- )(.*)/, "$1~~$2~~"), {
            line: pos.line,
            ch: 0
        }, {
            line: pos.line,
            ch: line.length
        })
    } else {
        mdEditor.replaceRange(line.replace(/~~/g, ""), {
            line: pos.line,
            ch: 0
        }, {
            line: pos.line,
            ch: line.length
        })
    }
});
// スライドモード用の読み出し関数
var mdEditor_read_slide = function() {
    let current = mdEditor.getCursor();
    let first_line = mdEditor.firstLine();
    let first_ch = 0;
    let header = mdEditor.getRange({
        line: first_line,
        ch: first_ch
    }, current)
    let section_count = header.match(/---/g);
    if (section_count === null) {
        return 0;
    } else {
        return section_count.length;
    }
}
// エディタのデータを転送
mdEditor.on('change', function(e) {
    mdEditor.save();
    var marked_text = '<div class="slide">' + marked($('#editor-div').val()) + '</div>';
    // var marked_text = marked(mdEditor_read_slide());
    webview.send('update-markdown', marked_text);
});
mdEditor.on('inputRead', function(e) {
    setTimeout(md_update, 1000);
});

// 同期スクロール
var synchronized_scroll = function() {
    // 現在行までのテキストを取得
    var range = mdEditor.getRange({
        line: 0,
        ch: null
    }, {
        line: mdEditor.getCursor().line,
        ch: null
    });
    // パースしてDOMを生成
    var parser = new DOMParser();
    var dom_tree = parser.parseFromString(marked(range), 'text/html');
    var current = dom_tree.body.querySelectorAll("h1, h2, h3, h4, h5, h6");
    webview.send('scroll_preview', current.length);
};
// 高速同期スクロール
mdEditor.on('cursorActivity', function(e) {
    webview.send('update_slide_index', mdEditor_read_slide());
    // synchronized_scroll();
});

// // ドキュメント表示に変更
// var style_doc = function() {
//     webview.send('mode_document');
// };
// // スライド表示に変更
// var style_slide = function() {
//     webview.send('mode_slide');
// };

// ドキュメント表示に変更
var mode_edit = function() {
    $("#editor_pane").show();
};
// スライド表示に変更
var mode_display = function() {
    $("#editor_pane").hide();
};
ipc.on('display_toggle', function() {
    $("#editor_pane").toggle();
});

// 新しいデータベースの作成
const db = new Datastore({
    filename: '/Users/azure/Google Drive/contents.db',
    autoload: true,
    timestampData: true
});
// create
const md_create = function() {
    let title = "new";
    let content = "# new";
    db.insert({
        title: title,
        content: content
    }, function(err, newDoc) {
        db.find().sort({
            updatedAt: -1
        }).exec(function(err, docs) {
            cur_id = docs[0]._id;
            app.list = docs;
            mdEditor.setValue(docs[0].content);
        });
    });
};
ipc.on('new', function() {
    md_create();
});
// update
const md_update = function() {
    let id = cur_id;
    let content = mdEditor.getValue();
    let title = content.match(/#.*/)[0];
    if (title === null) {
        title = "";
    } else {
        title = title.replace(/#.* /, "");
    }
    db.update({
        _id: id
    }, {
        $set: {
            title: title,
            content: content
        }
    }, {}, function(err, numReplaced) {
        console.log(err + "/" + numReplaced);
        db.find().sort({
            updatedAt: -1
        }).exec(function(err, docs) {
            cur_id = docs[0]._id;
            app.list = docs;
        });
    });
};
ipc.on('save', function() {
    md_update();
});
// delete
const md_delete = function() {
    let id = cur_id;
    db.remove({
        _id: id
    }, function() {
        db.find().sort({
            updatedAt: -1
        }).exec(function(err, docs) {
            cur_id = docs[0]._id;
            app.list = docs;
            mdEditor.setValue(docs[0].content);
        });
        alert("deleted!")
    });
};
ipc.on('remove', function() {
    md_delete();
});
// import
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
            db.find().sort({
                updatedAt: -1
            }).exec(function(err, docs) {
                cur_id = docs[0]._id;
                app.list = docs;
                mdEditor.setValue(docs[0].content);
            });
        });
    });
}
ipc.on('md_example', function() {
    md_example();
});
// Vue.jsの初期化
const app = new Vue({
    el: '#app',
    data: {
        searchQuery: '',
        list: []
    },
    methods: {
        // read
        md_read: function(event) {
            $("li").removeClass("active");
            let id = event.currentTarget.id;
            $("#" + id).addClass("active");
            db.find({
                _id: id
            }, function(err, docs) {
                mdEditor.setValue(docs[0].content);
                cur_id = docs[0]._id;
            });
        }
    },
    computed: {
        filteredView() {
            return this.list.filter(l => {
                let query = this.searchQuery.replace(/ /g, "(.|\n)*");
                console.log(query);
                return l.content.match(new RegExp(query, "i"));
            })
        }
    },
    updated: function() {
        $("li").removeClass("active");
        $("#" + cur_id).addClass("active");
    }
})
webview.addEventListener('dom-ready', () => {
    webview.openDevTools()
    // NeDBからデータを引っ張ってきてvueのデータを更新
    db.find().sort({
        updatedAt: -1
    }).exec(function(err, docs) {
        app.list = docs;
        cur_id = docs[0]._id;
        mdEditor.setValue(docs[0].content);
    });
});

$(function() {
    // $('#style_doc').on('click', style_doc);
    // $('#style_slide').on('click', style_slide);
    $('#mode_edit').on('click', mode_edit);
    $('#mode_display').on('click', mode_display);
    $('.md_create').on('click', md_create);
    $('.md_update').on('click', md_update);
    // $('.md_read').on('click', md_read);
    $('.md_delete').on('click', md_delete);
});

// PDF出力
// dpi測定関数
const calc_dpi = function() {
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
            // properties: ['openFile'],
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
    )
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

// import
function loadFile() {
    let win = browserWindow.getFocusedWindow();
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
                        db.find().sort({
                            updatedAt: -1
                        }).exec(function(err, docs) {
                            cur_id = docs[0]._id;
                            app.list = docs;
                            mdEditor.setValue(docs[0].content);
                        });
                    });
                });
            }
        });
}
ipc.on('import_md', function() {
    loadFile();
});
// ファイルの書き込み
function writeFile(path, data) {
    fs.writeFile(path, data, function(error) {
        if (error != null) {
            alert('error : ' + error);
        }
        alert('Exported!');
    });
}
// 新しいファイルを保存するときはこちら
function saveNewFile() {
    let win = browserWindow.getFocusedWindow();
    let content = mdEditor.getValue();
    dialog.showSaveDialog(
        win, {
            filters: [{
                name: 'Custom File Type',
                extensions: ['md']
            }]
        },
        function(fileName) {
            if (fileName) {
                writeFile(fileName, content);
            }
        }
    );
}
ipc.on('export_md', function() {
    saveNewFile();
});
