const {
    ipcRenderer
} = require('electron');

let preview_mode = "preview_slide_single";

var sync_scroll_basic = function(length) {
    if (length > 0) {
        // 現在行までのテキストを取得
        var total = $("#preview").find("h1, h2, h3, h4, h5, h6")
        $(document.body).animate({
            scrollTop: total[length].offsetTop
        }, 100, "swing");

    }
};
var sync_scroll_slide = function(length) {
    if (length) {
        // 現在行までのテキストを取得
        var total = $("#preview").find(".slide")
        $(document.body).animate({
            scrollTop: total[length].offsetTop
        }, 100, "swing");

    }
};

ipcRenderer.on('preview_mode', (event, mode) => {
    preview_mode = mode;
    switch (preview_mode) {
        case "preview_basic":
            $('#preview_mode').attr("href", "static/preview_basic.css");
            break;
        case "preview_slide_list":
            $('#preview_mode').attr("href", "static/preview_slide_list.css");
            break;
        case "preview_slide_single":
            $('#preview_mode').attr("href", "static/preview_slide_single.css");
            break;
    }
});

ipcRenderer.on('get_size', (event) => {
    console.log($('body').width())
    console.log($('body').height())
    ipcRenderer.send('return_size', $('body').width(), $('body').height())
});

ipcRenderer.on('update-markdown', (event, markdown) => {
    // $('#preview').hide();
    document.getElementById('preview').innerHTML = markdown;
    mermaid.init();
});

// イベントハンドラー群
ipcRenderer.on('display_position', (event, length, index) => {
    switch (preview_mode) {
        case "preview_basic":
            $('.slide').show();
            sync_scroll_basic(length);
            break;
        case "preview_slide_list":
            $('.slide').show();
            sync_scroll_slide(length);
            break;
        case "preview_slide_single":
            $('.slide').hide();
            $($('.slide')[index]).show();
            break;
    }
    // $('#preview').show();
});
