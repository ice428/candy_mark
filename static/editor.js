const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const remote_app = remote.app;
const browserWindow = remote.BrowserWindow;
const dialog = remote.dialog;
const shell = electron.shell
const fs = require("fs");
const path = require("path");
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
            katex_parsed = katex.renderToString(code, {displayMode: true})
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
        href = path.join(db_path + href.substr(1))
    }
    return '<img src="' + href + '" alt="' + text + '"' + ' title="' + title + '"' + '>';
};
// hrレンダラーの上書き
renderer.hr = function() {
    return '</div><div class="slide">'
}
marked.setOptions({renderer: renderer, gfm: true});

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
// 現在のスライド番号算出
var get_slide_index = function() {
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
    webview.send('update-markdown', marked_text);
});
mdEditor.on('inputRead', function(e) {
    md_update();
});

// 現在のカーソル位置取得
const get_content_position = function() {
    // 現在行までのテキストを取得
    let range = mdEditor.getRange({
        line: 0,
        ch: null
    }, {
        line: mdEditor.getCursor().line,
        ch: null
    });
    // パースしてDOMを生成
    let parser = new DOMParser();
    let dom_tree = parser.parseFromString(marked(range), 'text/html');
    let current = dom_tree.body.querySelectorAll("h1, h2, h3, h4, h5, h6");
    return current.length
};
// previewの位置同期用
const sync_position = function() {
    // カーソル位置取得
    let content_position = get_content_position();
    // スライド番号取得
    let slide_index = get_slide_index();
    webview.send('display_position', content_position, slide_index);
}
// カーソル移動時
mdEditor.on('cursorActivity', function(e) {
    sync_position();
});

// basicに切替
var preview_basic = function() {
    webview.send('preview_mode', "preview_basic");
    sync_position();
};
// listに切り替え
var preview_slide_list = function() {
    webview.send('preview_mode', "preview_slide_list");
    sync_position();
};
// singleに切り替え
var preview_slide_single = function() {
    webview.send('preview_mode', "preview_slide_single");
    sync_position();
};
// 設定画面のOpen
var setting_open = function() {
    db_path = localStorage.getItem("db_path");
    $('#db_path').text(db_path);
    $(".setting_modal_window").fadeIn("fast");
};
// DB保存Pathのリセット
var reset_db_directry = function() {
    $('#db_path').text("");
};
// DB保存Path取得
const get_db_directry = function() {
    var win = browserWindow.getFocusedWindow();
    dialog.showOpenDialog(win, {
        title: "Select database path.",
        properties: ['openDirectory'],
        filters: [
            {
                name: 'All Files',
                extensions: ['*']
            }
        ]
    }, function(dir_name) {
        $('#db_path').text(dir_name);
    })
}
// 設定画面のClose
var setting_close = function() {
    $(".setting_modal_window").fadeOut("fast");
    db_path = $('#db_path').text();
    localStorage.setItem("db_path", db_path);
    // db_path = localStorage.getItem("db_path");
    if (db_path === null | db_path === "") {
        db_path = remote_app.getAppPath();
    }
    db = new Datastore({
        filename: path.join(db_path, '/contents.db'),
        timestampData: true
    });
    console.log(path.join(db_path, '/contents.db'))
    db.loadDatabase(function(err) {
        db.find().sort({updatedAt: -1}).exec(function(err, docs) {
            app.list = docs;
            cur_id = docs[0]._id;
            mdEditor.setValue(docs[0].content);
        });
    });
};
// 表示モードのトグル
ipc.on('display_toggle', function() {
    $("#editor_pane").toggle();
    mdEditor.setCursor(mdEditor.getCursor());
});

// 新しいデータベースの作成
let db_path = localStorage.getItem("db_path");
if (db_path === null | db_path === "") {
    db_path = remote_app.getAppPath();
}
let db = new Datastore({
    filename: path.join(db_path, '/contents.db'),
    timestampData: true
});
console.log(path.join(db_path, '/contents.db'))
db.loadDatabase();
// create
const md_create = function() {
    let title = "new";
    let content = "# new";
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
        // console.log(err + "/" + numReplaced);
        db.find().sort({updatedAt: -1}).exec(function(err, docs) {
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
        db.find().sort({updatedAt: -1}).exec(function(err, docs) {
            cur_id = docs[0]._id;
            app.list = docs;
            mdEditor.setValue(docs[0].content);
        });
        // alert("deleted!")
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
            db.find().sort({updatedAt: -1}).exec(function(err, docs) {
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
                // console.log(query);
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
    db.find().sort({updatedAt: -1}).exec(function(err, docs) {
        app.list = docs;
        cur_id = docs[0]._id;
        mdEditor.setValue(docs[0].content);
    });
});

$(function() {
    $('#preview_basic').on('click', preview_basic);
    $('#preview_slide_list').on('click', preview_slide_list);
    $('#preview_slide_single').on('click', preview_slide_single);
    $('.md_create').on('click', md_create);
    $('.md_update').on('click', md_update);
    $('.md_delete').on('click', md_delete);
    $('.setting_open').on('click', setting_open);
    $('.setting_close').on('click', setting_close);
    $('.get_db_directry').on('click', get_db_directry);
    $('.reset_db_directry').on('click', reset_db_directry);
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

// import
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
ipc.on('export_md', function() {
    saveNewFile();
});
