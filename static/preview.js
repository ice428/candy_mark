const {
    ipcRenderer
} = require('electron');

const mode_document = 0;
const mode_slide = 1;
var mode = mode_document;

// イベントハンドラー群
ipcRenderer.on('scroll_preview', (event, length) => {
    synchronized_scroll(length);
});
ipcRenderer.on('mode_document', (event, length) => {
    mode = mode_document;
    $("#preview").show();
    $(".container").hide();
});
ipcRenderer.on('mode_slide', (event, length) => {
    mode = mode_slide;
    $("#preview").hide();
    $(".container").show();
});

ipcRenderer.on('get_size', (event) => {
    console.log($('body').width())
    console.log($('body').height())
    ipcRenderer.send('return_size', $('body').width(), $('body').height())
    // synchronized_scroll(length);
});

ipcRenderer.on('update-markdown', (event, markdown) => {
    let source
    switch (mode) {
        case mode_document:
            // ドキュメントを作る場合
            source = document.getElementById('preview');
            source.innerHTML = markdown;
            mermaid.init();
            break;
        case mode_slide:
            // // スライドショーを作る場合
            // source = document.getElementById('source');
			// markdown = markdown.replace(/<hr>/g,'---')
			// console.log(markdown)
            // source.innerHTML = markdown
            // mermaid.init();
            break;
    }
});
