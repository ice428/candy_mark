const {
    ipcRenderer
} = require('electron');

ipcRenderer.on('scroll_preview', (event, length) => {
	synchronized_scroll(length);
});

ipcRenderer.on('get_size', (event) => {
	console.log($('body').width())
	console.log($('body').height())
	ipcRenderer.send('return_size',$('body').width(),$('body').height())
	// synchronized_scroll(length);
});

ipcRenderer.on('update-markdown', (event, markdown) => {
	// ドキュメントを作る場合
    let source = document.getElementById('preview');
    source.innerHTML = markdown;
    mermaid.init();
	// console.log(source.innerHTML)
	// スライドショーを作る場合
    // let source = document.getElementById('source');
    // source.innerHTML = markdown;
    // slideshow.loadFromString(source.innerHTML);
});

// ドキュメント表示に変更
// var style_doc = function() {
//     $('#preview').show()
//     $('#webview').hide()
// };

// スライド表示に変更
// var style_slide = function() {
//     $('#preview').hide()
//     $('#webview').show()
// };

// $('#style_doc').on('click', style_doc);
// $('#style_slide').on('click', style_slide);
