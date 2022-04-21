let WASU = {};

// [util API]
// [load/execute API]
// instantiate a wasm file
WASU.wasmload = function (file) {
    let r = new Blob([file], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
};

// run a wasm file with given function name f
WASU.wasmexec = function (s, f, a, afterAction=null) {
    s.then(obj => {
        let result;
        result = obj.instance.exports[f](...a);
        if (afterAction != null) afterAction(result);
    });
};

// [get filename API]
WASU.getFilenameFromInput = function (file) {
    return file.name.substring(0, file.name.lastIndexOf("."));
};

WASU.getFilenameFromFetch = function (file) {
    return file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf("."));
};

// [URL API]
WASU.makeURL = function (contents, filename) {
    let file = new Blob([contents], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    return url;
};

WASU.convertArrayToString = function (arr) {
    return String.fromCharCode(...arr);
};

WASU.convertStringToArray = function (str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i));
    }
    return result;
};