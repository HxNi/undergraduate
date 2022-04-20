// [pack/unpack API]
// pack wrapper from remote input
function wasmpackInput(file, keyvalue, afterAction=null) {
    let reader = new FileReader();
    let filename = getFilenameFromInput(file);
    reader.onload = function() {
        // [2] get file contents
        let contents = new Uint8Array(reader.result);
        
        // *DEBUG*
        //contents = new TextEncoder("utf-8").encode(contents);

        insideWasmpackInput(contents, keyvalue);
        if (afterAction != null) afterAction(contents, filename);
    };
    // [1] read file
    reader.readAsArrayBuffer(file);
}

function wasmpackFetch(file, keyvalue, afterAction=null) {
    let filename = getFilenameFromFetch(file);
    fetch(file).then(res => {
        if (afterAction != null)
            res.body.getReader().read()
            .then(res => insideWasmpackFetch(res, keyvalue))
            .then(res => afterAction(res, filename));
        else
            res.body.getReader().read()
            .then(res => insideWasmpackFetch(res, keyvalue))
    });
}

// unpack wrapper
function wasmunpackInput(file, keyvalue) {
    let reader = new FileReader();
    let trigger = false;
    let filename = getFilenameFromInput(file);
    let promise = new Promise(function(res) {
        reader.onload = function() {
            let contents = new Uint8Array(reader.result);
            insideWasmunpackInput(contents, keyvalue);
            res(contents);
        }
    });
    reader.readAsArrayBuffer(file);

    return promise;
}

async function wasmunpackFetch(filename, keyvalue) {
    let res = await fetch(filename); // fetch(filename) -> [Response Promise] -> await -> res
    let res2 = await res.body.getReader().read(); // [Promise] res.body.getReader().read() -> await -> res2
    let res3 = await insideWasmunpackFetch(res2, keyvalue); // [Promise] res2=unpack(res2, keyvalue) -> await -> res3
    let res4 = await wasmloadFetch(res3); // [Promise] res3=instantiate(res3) -> await -> res4:WebAssembly.instantiateStreaming(moduleResponse)
    return res4;

    // fetch(filename).then(res => {
    //     let promise = res.body.getReader().read();
    //     promise.then(res => unpack(res, keyvalue)).then(res => execute(res, func));
    // });
}

// pack
function insideWasmpackInput(contents, key, mode='xor') {
    insideWasmpack(contents, key, mode);
}

function insideWasmpackFetch(s, key, mode='xor') {
    let contents = s.value;
    insideWasmpack(contents, key, mode);
    return s;
}

function insideWasmpack(contents, key, mode='xor') {
    if (mode == 'xor') {
        for (let i = 0; i < contents.length; i++) {
            contents[i] ^= key;
        }
    }
}

// unpack
function insideWasmunpackInput(contents, key, mode='xor') {
    insideWasmunpack(contents, key, mode);
    return contents;
}

function insideWasmunpackFetch(s, key, mode='xor') {
    let contents = s.value;
    insideWasmunpack(contents, key, mode);
    return s;
}

function insideWasmunpack(contents, key, mode='xor') {
    if (mode == 'xor') {
        for (let i = 0; i < contents.length; i++) {
            contents[i] ^= key;
        }
    }
}

// [util API]
// [load/execute API]
function wasmloadInput(file) {
    return wasmload(file);
}

function wasmloadFetch(s) {
    return wasmload(s.value);
}

// instantiate a wasm file
function wasmload(file) {
    let r = new Blob([file], {type: 'application/wasm'});
    let moduleResponse = new Response(r, {'headers': {'Content-Type': 'application/wasm'}});
    return WebAssembly.instantiateStreaming(moduleResponse);
}

// run a wasm file with given function name f
function wasmexec(s, f, afterAction=null) {
    s.then(obj => {
        let result;
        result = f(obj.instance.exports);
        if (afterAction != null) afterAction(result);
    });
}

// [get filename API]
function getFilenameFromInput(file) {
    return file.name.substring(0, file.name.lastIndexOf("."));
}

function getFilenameFromFetch(file) {
    return file.substring(file.lastIndexOf("/") + 1, file.lastIndexOf("."));
}

// [URL API]
function makeURL(contents, filename) {
    let file = new Blob([contents], {type: 'application/wasm'});
    var url = URL.createObjectURL(file);
    return url;
}