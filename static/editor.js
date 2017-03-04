// var $ = jQuery = require("jquery");
// var Hammer = require('./js/hammer.min.js');
var marked = require('marked')
hljs.initHighlightingOnLoad();

// マークダウンパーサの設定
var renderer = new marked.Renderer();
renderer.code = function(code, lang) {
    if (code.match(/^sequenceDiagram/) || code.match(/^graph/) || code.match(/^gantt/)) {
        // return mermaid.parse(code);
        return '<div class="mermaid" style="overflow:auto">' + code + '</div>';
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
    autoCloseTags: true,
    mode: 'gfm',
    matchBrackets: true,
    theme: 'custom-theme',
    extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList"
    }
});

// ドキュメント表示に変更
var style_doc = function() {
    // $('#preview').show()
    // $('#webview').hide()
};

// スライド表示に変更
var style_slide = function() {
    // $('#preview').hide()
    // $('#webview').show()
};

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

var webview = document.getElementById('webview');
webview.addEventListener('dom-ready', () => {
    webview.openDevTools()
});

$(function() {
    // エディタのデータを転送
    mdEditor.on('change', function(e) {
        mdEditor.save();
        var marked_text = marked($('#editor-div').val());
        webview.send('update-markdown', marked_text);
    });

    // 高速同期スクロール
    mdEditor.on("cursorActivity", synchronized_scroll);
    $('#style_doc').on('click', style_doc);
    $('#style_slide').on('click', style_slide);
});
