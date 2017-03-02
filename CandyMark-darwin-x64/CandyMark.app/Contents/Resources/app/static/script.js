var $ = jQuery = require("jquery");
// var Hammer = require('./js/hammer.min.js');
var marked = require('marked')
hljs.initHighlightingOnLoad();

// marked setting
var renderer = new marked.Renderer();
renderer.code = function(code, lang) {
    if (code.match(/^sequenceDiagram/) || code.match(/^graph/) || code.match(/^gantt/)) {
        return '<div class="mermaid" style="overflow:auto">' + code + '</div>';
    } else if (lang === "math") {
		var katex_parsed = "";
		try{
			katex_parsed = katex.renderToString(code, {displayMode: true})
			return katex_parsed
		}catch(err){
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

// codemirror setting
var mdEditor = CodeMirror.fromTextArea(document.getElementById("editor-div"), {
    // mode: "markdown",
    // autofocus: true,
    // indentUnit: 4,
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

var editorVm, toolbarVm, footerVm;

//timerID
var timer_mermaid = 0;
//parsed text
var marked_text = "";

//refresh mermaid
var refresh_mermaid = function() {
    //display area
    // $("#preview_panel").html(marked_text);
    // $(".mermaid").show();
    mermaid.init();
};

$(function() {
    // mermaid
    var config = {
        startOnLoad: false,
        flowchart: {
            useMaxWidth: false,
            htmlLabels: true
        },
        gantt: {
            numberSectionStyles: 8
        }
    };
    mermaid.initialize(config);

    // editor
    editorVm = new Vue({
        el: '#editor',
        data: {
            input: ""
        },
        filters: {
            marked: function(input) {
                var marked_text = marked(input);
                //1sec timeout
                clearTimeout(timer_mermaid);
                timer_mermaid = setTimeout(refresh_mermaid, 1000);
                return marked_text
            }
        }
    });

    // change
    mdEditor.on('change', function() {
        mdEditor.save();
        editorVm.input = $('#editor-div').val();
    });

    // toolbar
    // toolbarVm = new Vue({
    //     el: '#action_area',
    //     data: {},
    //     methods: {
    //         load: function(e) {
    //             loadFile();
    //         },
    //         save: function(e) {
    //             saveFile();
    //         }
    //     }
    // });

    // footer
    footerVm = new Vue({
        el: '#path_area',
        data: {
            currentPath: ""
        }
    });
});
