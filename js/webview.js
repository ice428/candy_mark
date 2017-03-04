const {
    ipcRenderer
} = require('electron');

ipcRenderer.on('scroll_preview', (event, length) => {
	synchronized_scroll(length);
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

// $(function() {
// hljs.initHighlightingOnLoad();
// });
// $('#style_doc').on('click', style_doc);
// $('#style_slide').on('click', style_slide);
// print-to-pdfのイベントリスナー
// ipc.on('print-to-pdf', function(event) {
//     const pdfPath = path.join(os.homedir(), 'print.pdf')
//     const win = BrowserWindow.fromWebContents(event.sender)
//     win.webContents.printToPDF({}, function(error, data) {
//         if (error) throw error
//         fs.writeFile(pdfPath, data, function(error) {
//             if (error) {
//                 throw error
//             }
//             shell.openExternal('file://' + pdfPath)
//             event.sender.send('wrote-pdf', pdfPath)
//         })
//     })
// })
