// ノートをロードしておきます
let notebook = null;

// 書庫のパスを返します
const get_db_path = function() {
    let strage_path = localStorage.getItem("db_path");
    if (strage_path === null | strage_path === "") {
        strage_path = remote_app.getAppPath();
    }
    console.log("strage_path:" + strage_path);
    return strage_path;
};

// ノートブックの名前を返します
const get_notebook_name = function() {
    let notebook_name = localStorage.getItem("cur_notebook");
    if (notebook_name === null | notebook_name === "") {
        notebook_name = "default";
    }
    console.log("notebook_name:" + notebook_name);
    return notebook_name;
};

// ノートブックからノートの一覧を取得します
const get_note_list = function() {
    notebook.find().sort({updatedAt: -1}).exec(function(err, docs) {
        if (docs.length === 0) {
            let title = "new";
            let content = "# new";
            notebook.insert({
                title: title,
                content: content
            }, function(err, newDoc) {
                get_note_list();
            });
        } else {
            app.list = docs;
            localStorage.setItem("cur_note_id", docs[0]._id);
            mdEditor.setValue(docs[0].content);
        }
    });
}

// ノートブックの新規ロード
const load_notebook = function() {
    // 書庫の場所を読み出し
    let strage_path = get_db_path();
    // ノートブック名を読み出し
    let notebook_name = get_notebook_name();
    let notebook_path = path.join(strage_path, notebook_name + '.db');
    console.log(notebook_path);
    notebook = new Datastore({filename: notebook_path, timestampData: true});
    notebook.loadDatabase(function(err) {
        if (!err) {
            get_note_list();
        } else {
            console.log("faild to load notebook.");
        }
    });
};

// Vue.jsの準備をします
const app = new Vue({
    el: '#app',
    data: {
        searchQuery: '',
        list: [],
        notebook: []
    },
    methods: {
        // ノートを読み込みます
        md_read: function(event) {
            $("li").removeClass("active");
            let id = event.currentTarget.id;
            $("#" + id).addClass("active");
            notebook.find({
                _id: id
            }, function(err, docs) {
                mdEditor.setValue(docs[0].content);
                localStorage.setItem("cur_note_id", docs[0]._id);
            });
        },
        // ノートブックを読み込みます
        notebook_read: function(event) {
            $("span").removeClass("active");
            let id = event.currentTarget.id;
            $("#" + id).addClass("active");
            cur_notebook = $("#" + id).text()
            notebook = new Datastore({
                filename: path.join(db_path, cur_notebook + '.db'),
                timestampData: true
            });
            notebook.find({
                _id: id
            }, function(err, docs) {
                mdEditor.setValue(docs[0].content);
                localStorage.setItem("cur_note_id", docs[0]._id);
            });
        }
    },
    computed: {
        // 検索クエリを適用します
        filteredView() {
            return this.list.filter(l => {
                let query = this.searchQuery.replace(/ /g, "(.|\n)*");
                return l.content.match(new RegExp(query, "i"));
            })
        }
    },
    // Vueに更新があった場合に発火します
    updated: function() {
        $("li").removeClass("active");
        $("#" + localStorage.getItem("cur_note_id")).addClass("active");
        $("span").removeClass("active");
        $("#notebook_" + cur_notebook_id).addClass("active");
    }
})

// 新しいノートをつくります
const md_create = function() {
    let title = "new";
    let content = "# new";
    notebook.insert({
        title: title,
        content: content
    }, function(err, newDoc) {
        get_note_list();
    });
};

// ノートを更新します
const md_update = function() {
    let id = localStorage.getItem("cur_note_id");
    let content = mdEditor.getValue();
    let title = content.match(/#.*/)[0];
    if (title === null) {
        title = "";
    } else {
        title = title.replace(/#.* /, "");
    }
    notebook.update({
        _id: id
    }, {
        $set: {
            title: title,
            content: content
        }
    }, {}, function(err, numReplaced) {
        get_note_list();
    });
};

// ノートを削除します
const md_delete = function() {
    let id = localStorage.getItem("cur_note_id");
    notebook.remove({
        _id: id
    }, function() {
        get_note_list();
    });
};

// 設定画面を開きます
const setting_open = function() {
    $('#db_path').text(localStorage.getItem("db_path"));
    $(".setting_modal_window").fadeIn("fast");
};

// 書庫のパスをリセットします
const reset_db_directry = function() {
    $('#db_path').text("");
};

// 書庫のパスをダイアログで取得します
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

// 書庫の設定を閉じます
const setting_close = function() {
    $(".setting_modal_window").fadeOut("fast");
    localStorage.setItem("db_path", $('#db_path').text());
    // ここのNotebook読み出し処理は共通化出来そう
    notebook = load_notebook();
    get_note_list();
};

// 各種イベント発火時の処理です
// ノートの保存時に発火します
ipc.on('save', function() {
    md_update();
});
// ノートの削除時に発火します
ipc.on('remove', function() {
    md_delete();
});
// ノートの新規作成時に発火します
ipc.on('new', function() {
    md_create();
});
// webviewが準備完了したら発火します
webview.addEventListener('dom-ready', () => {
    webview.openDevTools()
    // NoteBookリスト作成
    fs.readdir(localStorage.getItem("db_path"), function(err, list) {
        app.notebook = list.filter(function(element, index, array) {
            return (path.extname(element) === '.db');
        })
        // 現在のノートidを取得します
        cur_notebook_id = app.notebook.indexOf(localStorage.getItem("cur_notebook"));
    })
    // Noteリスト作成
    load_notebook();
});
