// "use strict";
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
        href = path.join(get_db_path() + href.substr(1));
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
    let marked_text = '<div class="slide">' + marked($('#editor-div').val()) + '</div>';
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
const preview_basic = function() {
    webview.send('preview_mode', "preview_basic");
    sync_position();
};
// listに切り替え
const preview_slide_list = function() {
    webview.send('preview_mode', "preview_slide_list");
    sync_position();
};
// singleに切り替え
const preview_slide_single = function() {
    webview.send('preview_mode', "preview_slide_single");
    sync_position();
};
// 表示モードのトグル
ipc.on('display_toggle', function() {
    $("#editor_pane").toggle();
    mdEditor.setCursor(mdEditor.getCursor());
});

// dom-ready後のイベントセット
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
