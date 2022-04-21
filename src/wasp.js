let WASP = {};

// [pack/unpack API]
// pack wrapper from remote input
WASP.wasmpackInput = function (file, keyvalue, afterAction=null) {
    let reader = new FileReader();
    let filename = WASP.getFilenameFromInput(file);
    reader.onload = function() {
        // [2] get file contents
        let contents = new Uint8Array(reader.result);
        
        // *DEBUG*
        //contents = new TextEncoder("utf-8").encode(contents);

        WASP.insideWasmpack(contents, keyvalue);
        if (afterAction != null) afterAction(contents, filename);
    };
    // [1] read file
    reader.readAsArrayBuffer(file);
};

WASP.wasmpackFetch = function (file, keyvalue, afterAction=null) {
    let filename = WASP.getFilenameFromFetch(file);
    fetch(file).then(res => {
        if (afterAction != null)
            res.body.getReader().read()
            .then(res => WASP.insideWasmpack(res.value, keyvalue))
            .then(res => afterAction(res, filename));
        else
            res.body.getReader().read()
            .then(res => WASP.insideWasmpack(res.value, keyvalue));
    });
};

// unpack wrapper
WASP.wasmunpackInput = function (file, keyvalue) {
    let reader = new FileReader();
    let trigger = false;
    let filename = WASP.getFilenameFromInput(file);
    let promise = new Promise(function(res) {
        reader.onload = function() {
            let contents = new Uint8Array(reader.result);
            WASP.insideWasmunpack(contents, keyvalue);
            res(contents);
        }
    });
    reader.readAsArrayBuffer(file);

    return promise;
};

WASP.wasmunpackFetch = async function wasmunpackFetch(filename, keyvalue) {
    let res = await fetch(filename); // fetch(filename) -> [Response Promise] -> await -> res
    let res2 = await res.body.getReader().read(); // [Promise] res.body.getReader().read() -> await -> res2
    let res3 = await WASP.insideWasmunpack(res2.value, keyvalue); // [Promise] res2=unpack(res2, keyvalue) -> await -> res3
    let res4 = await WASP.wasmload(res3); // [Promise] res3=instantiate(res3) -> await -> res4:WebAssembly.instantiateStreaming(moduleResponse)
    return res4;

    // *PREVIOUS CODE*
    // fetch(filename).then(res => {
    //     let promise = res.body.getReader().read();
    //     promise.then(res => unpack(res, keyvalue)).then(res => execute(res, func));
    // });
};

// pack
WASP.insideWasmpack = function (contents, key, mode='xor') {
    if (mode == 'xor') {
        for (let i = 0; i < contents.length; i++) {
            contents[i] ^= key;
        }
    }
};

// unpack
WASP.insideWasmunpack = function (contents, key, mode='xor') {
    if (mode == 'xor') {
        for (let i = 0; i < contents.length; i++) {
            contents[i] ^= key;
        }
    }
    return contents;
};

// [util API]
// [load/execute API]
// instantiate a wasm file
WASP.wasmload = function (file) {
    let r = new Blob([file], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
};

// run a wasm file with given function name f
WASP.wasmexec = function (s, f, afterAction=null) {
    s.then(obj => {
        let result;
        result = f(obj.instance.exports);
        if (afterAction != null) afterAction(result);
    });
};

// [get filename API]
WASP.getFilenameFromInput = function (file) {
    return file.name.substring(0, file.name.lastIndexOf("."));
};

WASP.getFilenameFromFetch = function (file) {
    return file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf("."));
};

// [URL API]
WASP.makeURL = function (contents, filename) {
    let file = new Blob([contents], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    return url;
};